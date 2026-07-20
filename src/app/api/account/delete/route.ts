import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 계정 탈퇴 — 서버 전용(H-06, 2차 감사 · DL-0006).
//
// 왜 서버로: 기존엔 브라우저 클라이언트가 자식행을 순차 delete(오류 무시) 후 signOut 만 했다.
//   profiles DELETE 정책이 없어 프로필 행이 안 지워지고 auth.users 는 그대로 남아 재로그인 가능한데도
//   UI 는 "탈퇴 완료"를 표시(거짓 성공 + 개인정보 삭제 약속 위반). Admin API(service_role)는
//   서버에서만 안전하므로 라우트로 이관한다.
//
// 삭제 범위: admin.deleteUser(auth.users) → profiles(ON DELETE CASCADE) → 전 자식 테이블 cascade
//   (works·templates·characters·likes·bookmarks·comments·follows·collab_sessions·payments·
//    payout_requests·resources·whispers 등 전부 CASCADE 확인). 구매기록(purchases)은
//   buyer_id ON DELETE SET NULL 로 보존(회계/세무 — DL-0006 결정 2, 기본 유지).
export async function POST() {
  const supabase = await createClient()

  // 본인만 — 세션 검증(H-01 쿠키 세션 통일로 서버가 로그인 유저를 인식).
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY 미설정 — 서버 삭제 불가. 거짓 성공 대신 정직한 실패.
    return NextResponse.json(
      { error: '계정 삭제 기능이 아직 활성화되지 않았어요. 잠시 후 다시 시도해주세요.' },
      { status: 503 }
    )
  }

  // best-effort: 사용자 업로드 이미지(아바타·캐릭터) 정리 — DB cascade 대상 아님(개인정보).
  // 실패해도 계정 삭제 자체는 진행(비치명).
  try {
    const roots = [user.id, `${user.id}/characters`]
    for (const prefix of roots) {
      const { data: files } = await admin.storage.from('avatars').list(prefix)
      if (files?.length) {
        await admin.storage
          .from('avatars')
          .remove(files.filter((f) => f.id).map((f) => `${prefix}/${f.name}`))
      }
    }
  } catch {
    // 스토리지 정리 실패는 무시(고아 공개 이미지는 저위험). DB 개인정보는 아래서 확실히 삭제됨.
  }

  // auth.users 삭제 → 전 스키마 cascade. 되돌릴 수 없음.
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: '계정 삭제에 실패했어요. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  // 서버 세션 쿠키 무효화(삭제된 사용자의 잔존 세션 제거).
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
