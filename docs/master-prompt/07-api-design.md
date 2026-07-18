> ⚠️ **STALE (2026-07-18)**: 이 문서는 폐기된 초기 설계다. Server Actions·`api/export`(Sharp)·
> Zod·`@upstash/ratelimit` 는 구현되지 않았다. 실제 서버 API 는 `src/app/api/payments/{prepare,confirm,webhook}`
> 뿐이고, 데이터 조작은 클라이언트 훅 + Supabase RLS 로 수행한다. 이 문서를 근거로 작업하지 말 것.

# 🧚 Pairy - API 설계 (API Design)

## API 개요

### 기술 스택
- **프레임워크**: Next.js App Router (Server Actions + Route Handlers)
- **데이터 페칭**: Supabase Client
- **인증**: Supabase Auth (JWT)
- **검증**: Zod

### API 패턴
| 용도 | 패턴 | 사용 예 |
|------|------|--------|
| 폼 제출/뮤테이션 | Server Actions | 좋아요, 저장, 업로드 |
| 외부 연동 | Route Handlers | 결제 웹훅, OAuth 콜백 |
| 데이터 조회 | Server Components + Supabase | 틀 목록, 상세 조회 |

---

## 1. 인증 API (Authentication)

### 1.1 OAuth 콜백

```typescript
// src/app/auth/callback/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 신규 유저면 프로필 생성 필요
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        // 프로필 설정 페이지로
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
```

### 1.2 프로필 생성 (Server Action)

```typescript
// src/app/actions/auth.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  nickname: z.string().min(2).max(20),
  bio: z.string().max(200).optional(),
});

export async function createProfile(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const validated = ProfileSchema.parse({
    nickname: formData.get('nickname'),
    bio: formData.get('bio'),
  });

  // 닉네임 중복 체크
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', validated.nickname)
    .single();

  if (existing) {
    return { error: '이미 사용 중인 닉네임입니다.' };
  }

  const { error } = await supabase.from('profiles').insert({
    user_id: user.id,
    nickname: validated.nickname,
    bio: validated.bio,
    avatar_url: user.user_metadata.avatar_url,
  });

  if (error) throw error;

  revalidatePath('/');
  return { success: true };
}
```

---

## 2. 틀 API (Templates)

### 2.1 틀 목록 조회

```typescript
// src/app/actions/templates.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface TemplateFilters {
  query?: string;
  category?: 'pair' | 'imeres' | 'trace' | 'profile';
  tags?: string[];
  sortBy?: 'latest' | 'popular';
  page?: number;
  limit?: number;
}

export async function getTemplates(filters: TemplateFilters = {}) {
  const supabase = createServerSupabaseClient();
  const {
    query,
    category,
    tags,
    sortBy = 'latest',
    page = 1,
    limit = 20,
  } = filters;

  // RPC 함수 호출
  const { data, error } = await supabase.rpc('search_templates', {
    search_query: query || null,
    category_filter: category || null,
    tag_slugs: tags || null,
    sort_by: sortBy,
    page_size: limit,
    page_offset: (page - 1) * limit,
  });

  if (error) throw error;

  return data;
}
```

### 2.2 틀 상세 조회

```typescript
// src/app/actions/templates.ts

export async function getTemplateById(id: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('template_details')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // 조회수 증가 (비동기, 에러 무시)
  supabase
    .from('templates')
    .update({ views_count: data.views_count + 1 })
    .eq('id', id)
    .then(() => {});

  return data;
}

export async function getTemplateForEditor(id: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('templates')
    .select(`
      id,
      title,
      editor_data,
      editable_areas,
      color_areas,
      is_free,
      price,
      creator_id
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // 유료 틀인 경우 구매 여부 확인
  if (!data.is_free && user) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', id)
      .eq('status', 'completed')
      .single();

    if (!purchase) {
      return { error: 'PURCHASE_REQUIRED', template: { ...data, editor_data: null } };
    }
  }

  return { template: data };
}
```

### 2.3 틀 등록 (Server Action)

```typescript
// src/app/actions/templates.ts

const TemplateSchema = z.object({
  title: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  category: z.enum(['pair', 'imeres', 'trace', 'profile']),
  personCount: z.number().min(1).max(10),
  tags: z.array(z.string()).min(3).max(10),
  isFree: z.boolean(),
  price: z.number().min(0).max(50000),
  requiresCredit: z.boolean(),
  allowsCommercial: z.boolean(),
  allowsModification: z.boolean(),
});

export async function createTemplate(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  // 데이터 검증
  const validated = TemplateSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    personCount: Number(formData.get('personCount')),
    tags: JSON.parse(formData.get('tags') as string),
    isFree: formData.get('isFree') === 'true',
    price: Number(formData.get('price')),
    requiresCredit: formData.get('requiresCredit') === 'true',
    allowsCommercial: formData.get('allowsCommercial') === 'true',
    allowsModification: formData.get('allowsModification') === 'true',
  });

  // 썸네일 업로드
  const thumbnailFile = formData.get('thumbnail') as File;
  const thumbnailPath = `${profile.id}/${Date.now()}-${thumbnailFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from('thumbnails')
    .upload(thumbnailPath, thumbnailFile);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(thumbnailPath);

  // 에디터 데이터
  const editorData = JSON.parse(formData.get('editorData') as string);
  const editableAreas = JSON.parse(formData.get('editableAreas') as string);
  const colorAreas = JSON.parse(formData.get('colorAreas') as string);

  // 틀 생성
  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      creator_id: profile.id,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      person_count: validated.personCount,
      thumbnail_url: publicUrl,
      editor_data: editorData,
      editable_areas: editableAreas,
      color_areas: colorAreas,
      is_free: validated.isFree,
      price: validated.price,
      requires_credit: validated.requiresCredit,
      allows_commercial: validated.allowsCommercial,
      allows_modification: validated.allowsModification,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;

  // 태그 연결
  const tagPromises = validated.tags.map(async (tagSlug) => {
    // 태그 찾기 or 생성
    let { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single();

    if (!tag) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name: tagSlug, slug: tagSlug })
        .select('id')
        .single();
      tag = newTag;
    }

    // 연결
    await supabase.from('template_tags').insert({
      template_id: template.id,
      tag_id: tag!.id,
    });
  });

  await Promise.all(tagPromises);

  revalidatePath('/templates');
  return { success: true, templateId: template.id };
}
```

### 2.4 좋아요 토글 (Server Action)

```typescript
// src/app/actions/templates.ts

export async function toggleLike(templateId: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return { error: 'PROFILE_REQUIRED' };

  const { data: liked } = await supabase.rpc('toggle_like', {
    p_user_id: profile.id,
    p_template_id: templateId,
  });

  revalidatePath(`/templates/${templateId}`);
  return { liked };
}
```

### 2.5 북마크 토글 (Server Action)

```typescript
// src/app/actions/templates.ts

export async function toggleBookmark(templateId: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 기존 북마크 확인
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', profile!.id)
    .eq('template_id', templateId)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return { bookmarked: false };
  } else {
    await supabase.from('bookmarks').insert({
      user_id: profile!.id,
      template_id: templateId,
    });
    return { bookmarked: true };
  }
}
```

---

## 3. 에디터 API (Editor)

### 3.1 작업물 저장 (Server Action)

```typescript
// src/app/actions/works.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function saveWork(data: {
  workId?: string;
  templateId: string;
  canvasData: object;
  title?: string;
}) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_premium')
    .eq('user_id', user.id)
    .single();

  // 무료 유저 작업물 개수 제한
  if (!profile!.is_premium) {
    const { count } = await supabase
      .from('works')
      .select('id', { count: 'exact' })
      .eq('user_id', profile!.id);

    if ((count || 0) >= 3) {
      return { error: 'WORK_LIMIT_REACHED' };
    }
  }

  if (data.workId) {
    // 기존 작업물 업데이트
    const { error } = await supabase
      .from('works')
      .update({
        canvas_data: data.canvasData,
        title: data.title,
        updated_at: new Date().toISOString(),
        auto_saved_at: new Date().toISOString(),
      })
      .eq('id', data.workId)
      .eq('user_id', profile!.id);

    if (error) throw error;
    return { workId: data.workId };
  } else {
    // 새 작업물 생성
    const { data: work, error } = await supabase
      .from('works')
      .insert({
        user_id: profile!.id,
        template_id: data.templateId,
        canvas_data: data.canvasData,
        title: data.title || '제목 없음',
      })
      .select('id')
      .single();

    if (error) throw error;
    return { workId: work.id };
  }
}
```

### 3.2 이미지 내보내기 (Route Handler)

```typescript
// src/app/api/export/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ImageProcessor } from '@/lib/image/processor';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const { imageData, format, multiplier, addWatermark } = body;

  // Base64 → Buffer
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  let imageBuffer = Buffer.from(base64Data, 'base64');

  // 프리미엄 체크
  let isPremium = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', user.id)
      .single();
    isPremium = profile?.is_premium || false;
  }

  // 해상도 제한 (비프리미엄)
  const finalMultiplier = isPremium ? multiplier : 1;

  // 워터마크 추가 (비프리미엄)
  if (!isPremium && addWatermark !== false) {
    const watermarkBuffer = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/watermark.png`
    ).then((res) => res.arrayBuffer()).then(Buffer.from);

    imageBuffer = await ImageProcessor.addWatermark(imageBuffer, watermarkBuffer);
  }

  // 포맷 변환
  const outputBuffer = await sharp(imageBuffer)
    .resize({
      width: Math.round(body.width * finalMultiplier),
      height: Math.round(body.height * finalMultiplier),
    })
    [format]({ quality: format === 'jpeg' ? 90 : undefined })
    .toBuffer();

  return new NextResponse(outputBuffer, {
    headers: {
      'Content-Type': `image/${format}`,
      'Content-Disposition': `attachment; filename="pairy-${Date.now()}.${format}"`,
    },
  });
}
```

---

## 4. 협업 API (Collaboration)

### 4.1 세션 생성 (Server Action)

```typescript
// src/app/actions/collab.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function createCollabSession(templateId: string, workId?: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, is_premium')
    .eq('user_id', user.id)
    .single();

  // 무료 유저 일일 협업 제한
  if (!profile!.is_premium) {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('collab_sessions')
      .select('id', { count: 'exact' })
      .eq('host_id', profile!.id)
      .gte('created_at', today);

    if ((count || 0) >= 1) {
      return { error: 'DAILY_COLLAB_LIMIT' };
    }
  }

  const inviteCode = nanoid(8);

  const { data: session, error } = await supabase
    .from('collab_sessions')
    .insert({
      host_id: profile!.id,
      template_id: templateId,
      work_id: workId,
      invite_code: inviteCode,
      participants: [{
        user_id: profile!.id,
        nickname: profile!.nickname,
        avatar_url: profile!.avatar_url,
        is_host: true,
        joined_at: new Date().toISOString(),
      }],
    })
    .select('id, invite_code')
    .single();

  if (error) throw error;

  return {
    sessionId: session.id,
    inviteCode: session.invite_code,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/collab/${session.invite_code}`,
  };
}
```

### 4.2 세션 참여 (Server Action)

```typescript
// src/app/actions/collab.ts

export async function joinCollabSession(inviteCode: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 세션 조회
  const { data: session, error } = await supabase
    .from('collab_sessions')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error || !session) {
    return { error: 'SESSION_NOT_FOUND' };
  }

  if (session.status !== 'waiting' && session.status !== 'active') {
    return { error: 'SESSION_EXPIRED' };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { error: 'SESSION_EXPIRED' };
  }

  // 참여자 추가
  let participant;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('user_id', user.id)
      .single();

    participant = {
      user_id: profile!.id,
      nickname: profile!.nickname,
      avatar_url: profile!.avatar_url,
      is_host: false,
      joined_at: new Date().toISOString(),
    };
  } else {
    // 게스트
    participant = {
      user_id: null,
      nickname: `게스트${Math.floor(Math.random() * 1000)}`,
      avatar_url: null,
      is_host: false,
      is_guest: true,
      joined_at: new Date().toISOString(),
    };
  }

  const updatedParticipants = [...session.participants, participant];

  await supabase
    .from('collab_sessions')
    .update({
      participants: updatedParticipants,
      status: 'active',
    })
    .eq('id', session.id);

  return {
    sessionId: session.id,
    templateId: session.template_id,
    workId: session.work_id,
    participants: updatedParticipants,
  };
}
```

### 4.3 협업 완료 (Server Action)

```typescript
// src/app/actions/collab.ts

export async function completeCollabSession(sessionId: string) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { error } = await supabase
    .from('collab_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;

  return { success: true };
}
```

---

## 5. 결제 API (Payment)

### 5.1 결제 준비 (Server Action)

```typescript
// src/app/actions/payment.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function preparePayment(data: {
  type: 'template' | 'subscription' | 'daily_pass';
  templateId?: string;
  plan?: 'premium' | 'pro';
}) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'LOGIN_REQUIRED' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let amount = 0;
  let orderName = '';

  switch (data.type) {
    case 'template':
      const { data: template } = await supabase
        .from('templates')
        .select('title, price')
        .eq('id', data.templateId)
        .single();
      amount = template!.price;
      orderName = `틀 구매: ${template!.title}`;
      break;

    case 'subscription':
      amount = data.plan === 'pro' ? 9900 : 3900;
      orderName = `Pairy ${data.plan === 'pro' ? 'Pro' : '프리미엄'} 구독`;
      break;

    case 'daily_pass':
      amount = 500;
      orderName = 'Pairy 1일 이용권';
      break;
  }

  const orderId = `pairy_${nanoid(16)}`;

  // 구매 레코드 생성 (대기 상태)
  await supabase.from('purchases').insert({
    user_id: profile!.id,
    type: data.type,
    template_id: data.templateId,
    amount,
    order_id: orderId,
    status: 'pending',
  });

  return {
    orderId,
    amount,
    orderName,
    customerName: profile!.nickname,
  };
}
```

### 5.2 결제 확인 (Route Handler - 토스 웹훅)

```typescript
// src/app/api/payment/confirm/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paymentKey, orderId, amount } = body;

  // 토스페이먼츠 결제 확인 API 호출
  const tossResponse = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TOSS_SECRET_KEY}:`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  );

  if (!tossResponse.ok) {
    const error = await tossResponse.json();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // 구매 상태 업데이트
  const { data: purchase } = await supabase
    .from('purchases')
    .update({
      status: 'completed',
      payment_key: paymentKey,
      completed_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('*')
    .single();

  // 구독인 경우 구독 레코드 생성
  if (purchase?.type === 'subscription') {
    const now = new Date();
    const endDate = new Date(now.setMonth(now.getMonth() + 1));

    await supabase.from('subscriptions').upsert({
      user_id: purchase.user_id,
      plan: purchase.amount === 9900 ? 'pro' : 'premium',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: endDate.toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
```

---

## 6. 에러 핸들링

### 6.1 에러 타입 정의

```typescript
// src/types/errors.ts
export const ErrorCodes = {
  // 인증
  LOGIN_REQUIRED: { code: 'LOGIN_REQUIRED', message: '로그인이 필요합니다.' },
  PROFILE_REQUIRED: { code: 'PROFILE_REQUIRED', message: '프로필 설정이 필요합니다.' },

  // 권한
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '권한이 없습니다.' },
  PURCHASE_REQUIRED: { code: 'PURCHASE_REQUIRED', message: '구매가 필요합니다.' },

  // 제한
  WORK_LIMIT_REACHED: { code: 'WORK_LIMIT_REACHED', message: '저장 가능한 작업물 수를 초과했습니다.' },
  DAILY_COLLAB_LIMIT: { code: 'DAILY_COLLAB_LIMIT', message: '오늘 협업 횟수를 초과했습니다.' },

  // 세션
  SESSION_NOT_FOUND: { code: 'SESSION_NOT_FOUND', message: '세션을 찾을 수 없습니다.' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', message: '세션이 만료되었습니다.' },

  // 일반
  NOT_FOUND: { code: 'NOT_FOUND', message: '찾을 수 없습니다.' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: '오류가 발생했습니다.' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
```

### 6.2 에러 응답 유틸

```typescript
// src/lib/api/response.ts
export function createErrorResponse(code: ErrorCode) {
  return { error: ErrorCodes[code] };
}

export function createSuccessResponse<T>(data: T) {
  return { data };
}
```

---

## 7. API 보안

### 7.1 Rate Limiting (Middleware)

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 분당 100회
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
```

### 7.2 입력 검증 (Zod)

```typescript
// src/lib/validations/template.ts
import { z } from 'zod';

export const CreateTemplateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(50, '제목은 50자 이하'),
  description: z.string().max(500).optional(),
  category: z.enum(['pair', 'imeres', 'trace', 'profile']),
  personCount: z.number().min(1).max(10),
  tags: z.array(z.string()).min(3, '태그는 최소 3개').max(10, '태그는 최대 10개'),
  isFree: z.boolean(),
  price: z.number().min(0).max(50000),
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
```
