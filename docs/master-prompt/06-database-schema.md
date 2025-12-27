# 🧚 Pairy - 데이터베이스 스키마 (Database Schema)

## 데이터베이스 개요

- **DBMS**: PostgreSQL (Supabase)
- **ORM**: Supabase Client (자동 타입 생성)
- **마이그레이션**: Supabase Migration

---

## 1. ER 다이어그램

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   profiles  │       │  templates  │       │    tags     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)     │
│ user_id     │  │    │ creator_id  │←─┘    │ name        │
│ nickname    │  │    │ title       │       │ slug        │
│ avatar_url  │  └───→│ description │       │ count       │
│ bio         │       │ thumbnail   │       └─────────────┘
│ ...         │       │ editor_data │              │
└─────────────┘       │ price       │              │
                      │ ...         │              │
                      └─────────────┘              │
                             │                     │
                             │      ┌──────────────┘
                             ▼      ▼
                      ┌─────────────────┐
                      │ template_tags   │
                      ├─────────────────┤
                      │ template_id(FK) │
                      │ tag_id (FK)     │
                      └─────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   likes     │       │  bookmarks  │       │   works     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ user_id(FK) │       │ user_id(FK) │       │ user_id(FK) │
│ template_id │       │ template_id │       │ template_id │
│ created_at  │       │ created_at  │       │ data (JSON) │
└─────────────┘       └─────────────┘       │ ...         │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  sessions   │       │   reports   │       │ purchases   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ host_id(FK) │       │ reporter_id │       │ user_id(FK) │
│ template_id │       │ template_id │       │ template_id │
│ status      │       │ reason      │       │ amount      │
│ ...         │       │ ...         │       │ ...         │
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐
│subscriptions│
├─────────────┤
│ id (PK)     │
│ user_id(FK) │
│ plan        │
│ status      │
│ ...         │
└─────────────┘
```

---

## 2. 테이블 정의

### 2.1 profiles (유저 프로필)

Supabase Auth의 `auth.users`와 1:1 관계

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 기본 정보
  nickname VARCHAR(20) NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(200),

  -- 소셜 링크
  twitter_handle VARCHAR(50),

  -- 설정
  theme_color VARCHAR(7) DEFAULT '#FF6B9D',

  -- 통계
  templates_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,

  -- 구독 상태
  is_premium BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT nickname_unique UNIQUE (nickname),
  CONSTRAINT nickname_length CHECK (char_length(nickname) >= 2)
);

-- 인덱스
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 조회는 모두 가능" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "본인만 수정 가능" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2.2 templates (틀)

```sql
-- 카테고리 enum
CREATE TYPE template_category AS ENUM (
  'pair',      -- 페어틀
  'imeres',    -- 이메레스
  'trace',     -- 트레틀
  'profile'    -- 프로필틀
);

-- 틀 상태 enum
CREATE TYPE template_status AS ENUM (
  'draft',     -- 작성 중
  'published', -- 공개
  'hidden',    -- 숨김
  'deleted'    -- 삭제됨
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- 기본 정보
  title VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  category template_category NOT NULL DEFAULT 'pair',
  person_count INTEGER DEFAULT 2,

  -- 파일 (3중 분리)
  thumbnail_url TEXT NOT NULL,           -- 미리보기용
  editor_data JSONB NOT NULL,             -- 에디터용 (레이어 정보)
  original_file_url TEXT,                 -- 원본 파일 외부 링크

  -- 가격
  is_free BOOLEAN DEFAULT TRUE,
  price INTEGER DEFAULT 0,                -- 원 단위

  -- 이용 조건
  requires_credit BOOLEAN DEFAULT TRUE,   -- 크레딧 필수
  allows_commercial BOOLEAN DEFAULT FALSE,-- 상업적 이용
  allows_modification BOOLEAN DEFAULT TRUE,-- 2차 수정

  -- 편집 영역 설정
  editable_areas JSONB DEFAULT '[]',      -- [{id, x, y, width, height, type}]
  color_areas JSONB DEFAULT '[]',         -- [{id, role, defaultColor}]

  -- 통계
  likes_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- 상태
  status template_status DEFAULT 'published',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_templates_creator ON templates(creator_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status) WHERE status = 'published';
CREATE INDEX idx_templates_likes ON templates(likes_count DESC);
CREATE INDEX idx_templates_created ON templates(created_at DESC);

-- Full-text 검색 인덱스
CREATE INDEX idx_templates_search ON templates
  USING GIN (to_tsvector('korean', title || ' ' || COALESCE(description, '')));

-- RLS 정책
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공개된 틀은 모두 조회 가능" ON templates
  FOR SELECT USING (status = 'published' OR creator_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "본인만 생성 가능" ON templates
  FOR INSERT WITH CHECK (creator_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "본인만 수정 가능" ON templates
  FOR UPDATE USING (creator_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));
```

### 2.3 tags (태그)

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(30) NOT NULL,
  slug VARCHAR(30) NOT NULL,

  -- 태그 유형
  category VARCHAR(20) DEFAULT 'general', -- mood, relation, theme, etc.

  -- 통계
  usage_count INTEGER DEFAULT 0,

  -- 제약조건
  CONSTRAINT tag_slug_unique UNIQUE (slug)
);

-- 인덱스
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

### 2.4 template_tags (틀-태그 연결)

```sql
CREATE TABLE template_tags (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (template_id, tag_id)
);

-- 인덱스
CREATE INDEX idx_template_tags_template ON template_tags(template_id);
CREATE INDEX idx_template_tags_tag ON template_tags(tag_id);
```

### 2.5 likes (좋아요)

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  CONSTRAINT unique_like UNIQUE (user_id, template_id)
);

-- 인덱스
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_template ON likes(template_id);

-- 좋아요 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE templates SET likes_count = likes_count + 1 WHERE id = NEW.template_id;
    UPDATE profiles SET likes_received = likes_received + 1
      WHERE id = (SELECT creator_id FROM templates WHERE id = NEW.template_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE templates SET likes_count = likes_count - 1 WHERE id = OLD.template_id;
    UPDATE profiles SET likes_received = likes_received - 1
      WHERE id = (SELECT creator_id FROM templates WHERE id = OLD.template_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();
```

### 2.6 bookmarks (북마크)

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,

  -- 폴더 분류 (P2)
  folder_name VARCHAR(50) DEFAULT 'default',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_bookmark UNIQUE (user_id, template_id)
);

-- 인덱스
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
```

### 2.7 works (작업물)

```sql
CREATE TYPE work_status AS ENUM (
  'draft',      -- 작업 중
  'completed',  -- 완료
  'shared'      -- 공유됨
);

CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- 작업 데이터
  title VARCHAR(100),
  canvas_data JSONB NOT NULL,             -- Fabric.js JSON
  thumbnail_url TEXT,                      -- 썸네일

  -- 상태
  status work_status DEFAULT 'draft',

  -- 협업 정보
  collab_session_id UUID,
  collaborators UUID[] DEFAULT '{}',       -- 참여자 목록

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 자동 저장
  auto_saved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_works_user ON works(user_id);
CREATE INDEX idx_works_updated ON works(updated_at DESC);
```

### 2.8 collab_sessions (협업 세션)

```sql
CREATE TYPE session_status AS ENUM (
  'waiting',    -- 대기 중
  'active',     -- 진행 중
  'completed',  -- 완료
  'expired'     -- 만료
);

CREATE TABLE collab_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 호스트
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- 작업 연결
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- 세션 정보
  invite_code VARCHAR(10) UNIQUE NOT NULL,  -- 짧은 초대 코드

  -- 참여자
  participants JSONB DEFAULT '[]',          -- [{user_id, nickname, joined_at}]
  max_participants INTEGER DEFAULT 2,

  -- 상태
  status session_status DEFAULT 'waiting',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_sessions_host ON collab_sessions(host_id);
CREATE INDEX idx_sessions_code ON collab_sessions(invite_code);
CREATE INDEX idx_sessions_status ON collab_sessions(status);
```

### 2.9 purchases (구매 내역)

```sql
CREATE TYPE purchase_type AS ENUM (
  'template',     -- 틀 구매
  'subscription', -- 구독
  'daily_pass'    -- 1일 이용권
);

CREATE TYPE purchase_status AS ENUM (
  'pending',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- 구매 정보
  type purchase_type NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- 결제 정보
  amount INTEGER NOT NULL,                  -- 원 단위
  payment_key VARCHAR(200),                 -- 토스페이먼츠 결제 키
  order_id VARCHAR(100) UNIQUE NOT NULL,

  -- 상태
  status purchase_status DEFAULT 'pending',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_template ON purchases(template_id);
CREATE INDEX idx_purchases_order ON purchases(order_id);
```

### 2.10 subscriptions (구독)

```sql
CREATE TYPE subscription_plan AS ENUM (
  'premium',    -- ₩3,900/월
  'pro'         -- ₩9,900/월
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'expired',
  'past_due'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 플랜 정보
  plan subscription_plan NOT NULL,

  -- 상태
  status subscription_status DEFAULT 'active',

  -- 기간
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,

  -- 결제 정보
  billing_key VARCHAR(200),                 -- 자동 결제 키

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 구독 상태 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION sync_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    is_premium = (NEW.status = 'active' AND NEW.plan IN ('premium', 'pro')),
    is_pro = (NEW.status = 'active' AND NEW.plan = 'pro')
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_subscription
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION sync_subscription_status();
```

### 2.11 reports (신고)

```sql
CREATE TYPE report_reason AS ENUM (
  'copyright',      -- 저작권 침해
  'plagiarism',     -- 무단 도용
  'inappropriate',  -- 부적절한 콘텐츠
  'spam',           -- 스팸
  'other'           -- 기타
);

CREATE TYPE report_status AS ENUM (
  'pending',    -- 대기 중
  'reviewing',  -- 검토 중
  'resolved',   -- 처리 완료
  'dismissed'   -- 기각
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 신고자
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 대상
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,

  -- 신고 내용
  reason report_reason NOT NULL,
  description TEXT,
  evidence_urls TEXT[],

  -- 상태
  status report_status DEFAULT 'pending',
  admin_note TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_reports_template ON reports(template_id);
CREATE INDEX idx_reports_status ON reports(status);
```

---

## 3. 뷰 (Views)

### 3.1 템플릿 상세 뷰

```sql
CREATE VIEW template_details AS
SELECT
  t.*,
  p.nickname AS creator_nickname,
  p.avatar_url AS creator_avatar,
  p.twitter_handle AS creator_twitter,
  COALESCE(
    (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug))
     FROM template_tags tt
     JOIN tags tg ON tt.tag_id = tg.id
     WHERE tt.template_id = t.id
    ), '[]'
  ) AS tags
FROM templates t
JOIN profiles p ON t.creator_id = p.id
WHERE t.status = 'published';
```

### 3.2 유저 통계 뷰

```sql
CREATE VIEW user_stats AS
SELECT
  p.id,
  p.nickname,
  COUNT(DISTINCT t.id) AS templates_count,
  COALESCE(SUM(t.likes_count), 0) AS total_likes,
  COALESCE(SUM(t.uses_count), 0) AS total_uses,
  COUNT(DISTINCT w.id) AS works_count
FROM profiles p
LEFT JOIN templates t ON t.creator_id = p.id AND t.status = 'published'
LEFT JOIN works w ON w.user_id = p.id
GROUP BY p.id, p.nickname;
```

---

## 4. 함수 (Functions)

### 4.1 템플릿 검색

```sql
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT DEFAULT NULL,
  category_filter template_category DEFAULT NULL,
  tag_slugs TEXT[] DEFAULT NULL,
  sort_by TEXT DEFAULT 'latest',
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  thumbnail_url TEXT,
  creator_nickname VARCHAR,
  likes_count INTEGER,
  uses_count INTEGER,
  is_free BOOLEAN,
  price INTEGER,
  tags JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.thumbnail_url,
    p.nickname,
    t.likes_count,
    t.uses_count,
    t.is_free,
    t.price,
    COALESCE(
      (SELECT json_agg(json_build_object('name', tg.name, 'slug', tg.slug))
       FROM template_tags tt
       JOIN tags tg ON tt.tag_id = tg.id
       WHERE tt.template_id = t.id
      ), '[]'
    )::JSONB
  FROM templates t
  JOIN profiles p ON t.creator_id = p.id
  WHERE t.status = 'published'
    AND (search_query IS NULL OR
         to_tsvector('korean', t.title || ' ' || COALESCE(t.description, ''))
         @@ plainto_tsquery('korean', search_query))
    AND (category_filter IS NULL OR t.category = category_filter)
    AND (tag_slugs IS NULL OR EXISTS (
      SELECT 1 FROM template_tags tt
      JOIN tags tg ON tt.tag_id = tg.id
      WHERE tt.template_id = t.id AND tg.slug = ANY(tag_slugs)
    ))
  ORDER BY
    CASE sort_by
      WHEN 'latest' THEN t.created_at
      WHEN 'popular' THEN t.likes_count::TIMESTAMPTZ
    END DESC NULLS LAST
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 좋아요 토글

```sql
CREATE OR REPLACE FUNCTION toggle_like(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  -- 기존 좋아요 확인
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE user_id = p_user_id AND template_id = p_template_id
  ) INTO liked;

  IF liked THEN
    -- 좋아요 취소
    DELETE FROM likes
    WHERE user_id = p_user_id AND template_id = p_template_id;
    RETURN FALSE;
  ELSE
    -- 좋아요 추가
    INSERT INTO likes (user_id, template_id)
    VALUES (p_user_id, p_template_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Storage 버킷

### 5.1 버킷 구조

```sql
-- Supabase Storage 버킷 설정
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),           -- 프로필 이미지
  ('thumbnails', 'thumbnails', true),     -- 틀 썸네일
  ('works', 'works', false);              -- 작업물 (비공개)
```

### 5.2 Storage 정책

```sql
-- 아바타: 본인만 업로드, 모두 조회
CREATE POLICY "아바타 조회" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "아바타 업로드" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 썸네일: 작가만 업로드, 모두 조회
CREATE POLICY "썸네일 조회" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "썸네일 업로드" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND id::text = (storage.foldername(name))[1]
    )
  );

-- 작업물: 본인만 접근
CREATE POLICY "작업물 조회" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'works' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "작업물 업로드" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'works' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 6. TypeScript 타입 생성

```bash
# Supabase CLI로 타입 자동 생성
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### 6.1 생성된 타입 예시

```typescript
// src/types/database.ts (자동 생성)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          avatar_url: string | null;
          bio: string | null;
          twitter_handle: string | null;
          theme_color: string;
          templates_count: number;
          likes_received: number;
          is_premium: boolean;
          is_pro: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          avatar_url?: string | null;
          // ...
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
          // ...
        };
      };
      templates: {
        // ...
      };
      // ...
    };
    Views: {
      template_details: {
        Row: {
          id: string;
          title: string;
          creator_nickname: string;
          tags: Json;
          // ...
        };
      };
    };
    Functions: {
      search_templates: {
        Args: {
          search_query?: string;
          category_filter?: string;
          tag_slugs?: string[];
          sort_by?: string;
          page_size?: number;
          page_offset?: number;
        };
        Returns: {
          id: string;
          title: string;
          // ...
        }[];
      };
      toggle_like: {
        Args: {
          p_user_id: string;
          p_template_id: string;
        };
        Returns: boolean;
      };
    };
  };
};
```
