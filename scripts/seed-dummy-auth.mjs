#!/usr/bin/env node
/**
 * seed-dummy-auth.mjs — 로그인 가능한 더미 계정 생성 (E2E 테스트용)
 *
 * 왜: supabase/seed.sql 은 profiles 만 넣어(auth.users 직접 삽입 불가) 시드 유저로 로그인이 안 된다.
 *     이 스크립트는 Supabase Admin API 로 auth.users + 프로필을 만들어 실제 로그인 테스트를 가능케 한다.
 *
 * ⚠️ 보안:
 *   - SERVICE_ROLE 키를 쓴다. 절대 커밋/브라우저 노출 금지. 로컬 .env.local(gitignored)에만 둔다.
 *   - 이 스크립트는 로컬/테스트 프로젝트에서만 실행. 운영 DB에 더미 계정 만들지 말 것.
 *   - AI 는 계정을 직접 생성하지 않는다(헌법 §2). 이 스크립트는 사용자가 실행한다.
 *
 * 준비: .env.local 에 아래 두 줄이 있어야 한다.
 *   NEXT_PUBLIC_SUPABASE_URL=...        (이미 있음)
 *   SUPABASE_SERVICE_ROLE_KEY=...       (Supabase 대시보드 > Project Settings > API > service_role)
 *
 * 실행 (Node 20+):
 *   node --env-file=.env.local scripts/seed-dummy-auth.mjs
 *   # 또는 직접 export 후: node scripts/seed-dummy-auth.mjs
 *
 * 옵션(환경변수):
 *   DUMMY_EMAIL   (기본 tester@pairy.test)
 *   DUMMY_PASSWORD(기본 Pairy!test1234 — 테스트 전용, 운영 금지)
 *   DUMMY_HANDLE  (기본 tester)
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.DUMMY_EMAIL || 'tester@pairy.test'
const password = process.env.DUMMY_PASSWORD || 'Pairy!test1234'
const handle = process.env.DUMMY_HANDLE || 'tester'

if (!url || !serviceKey) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  console.error('  .env.local 에 넣고  node --env-file=.env.local scripts/seed-dummy-auth.mjs  로 실행하세요.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`→ 더미 계정 생성 시도: ${email}`)

  // 1) auth 유저 생성 (이메일 확인 스킵 → 바로 로그인 가능)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: '테스터', handle },
  })

  let userId = created?.user?.id
  if (createErr) {
    // 이미 존재하면 조회해서 재사용
    if (String(createErr.message || '').toLowerCase().includes('already')) {
      console.log('… 이미 존재하는 이메일. 기존 유저 조회.')
      const { data: list } = await admin.auth.admin.listUsers()
      userId = list?.users?.find((u) => u.email === email)?.id
    } else {
      console.error('✗ 유저 생성 실패:', createErr.message)
      process.exit(1)
    }
  }
  if (!userId) {
    console.error('✗ userId 를 확보하지 못했습니다.')
    process.exit(1)
  }

  // 2) 프로필 업서트 (handle_new_user 트리거가 기본 프로필을 만들지만, username/is_creator 를 채운다)
  const { error: profErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        username: handle,
        display_name: '테스터',
        bio: 'E2E 테스트용 더미 계정',
        is_creator: true, // 크리에이터 플로우(대시보드·업로드)도 테스트 가능하게
      },
      { onConflict: 'id' },
    )
  if (profErr) console.warn('△ 프로필 업서트 경고(무시 가능):', profErr.message)

  console.log('\n✓ 완료. 아래 자격증명으로 /login 에서 로그인하세요:')
  console.log(`    이메일 : ${email}`)
  console.log(`    비밀번호: ${password}`)
  console.log(`    user_id: ${userId}`)
  console.log('\n다음: supabase/seed.sql 로 열람용 콘텐츠(템플릿/크리에이터) 시딩 → npm run dev')
  console.log('참고: characters/resources 테이블은 아직 없어 자캐·자료는 localStorage 폴백으로 동작(감사 F-17/F-16b).')
}

main().catch((e) => {
  console.error('✗ 예외:', e)
  process.exit(1)
})
