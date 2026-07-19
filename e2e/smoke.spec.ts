import { test, expect } from '@playwright/test'

/**
 * 스모크 테스트 — "클릭했는데 무반응" / "죽은 링크" 부류 회귀 방지 (2026-07-19)
 *
 * 배경: 총 리뷰(정적 검토)가 놓친 실사용 버그 3건(패널 안 닫힘·결제 무반응·업로드 실종)의
 * 재발을 기계적으로 막는다. 데모 모드(Supabase env 없음) 기준으로 결정적으로 동작하는
 * 핵심 플로우만 담는다 — 여기 실패하면 실제 사용자가 겪는 문제다.
 */

test.describe('핵심 페이지 렌더', () => {
  test('홈이 뜬다', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Pairy/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('틀 아카이브가 카드와 함께 뜬다', async ({ page }) => {
    await page.goto('/templates')
    // 데모 샘플 카드가 최소 1개는 있어야 한다 (read-path 회귀 가드)
    await expect(page.locator('a[href^="/templates/"]').first()).toBeVisible()
  })

  test('틀 상세가 뜬다', async ({ page }) => {
    await page.goto('/templates/1')
    // CSR 완료의 양성 신호(샘플 자료 제목)를 먼저 기다린 뒤 폴백 부재를 검증
    // (로딩 중엔 폴백이 아직 없어서 부정 검증만으로는 거짓 통과 가능)
    await expect(page.getByRole('heading', { name: '커플 프로필 틀' }).first()).toBeVisible()
    await expect(page.getByText('자료를 찾을 수 없어요')).toHaveCount(0)
  })

  test('로그인 페이지가 뜬다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })
})

test.describe('CTA 피드백 — 클릭이 무반응이면 실패', () => {
  test('프리미엄 구독 클릭 시 사용자 피드백이 반드시 뜬다', async ({ page }) => {
    await page.goto('/premium')
    await page.getByRole('button', { name: '서포터 되기', exact: true }).first().click()
    // 데모: 성공 토스트 / 프로덕션: 결제창 또는 에러 토스트 — 어느 쪽이든 "무반응"은 버그
    await expect(
      page.getByRole('alert').first()
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('라우트 무결성 — 죽은 내부 링크 가드', () => {
  // 헤더/푸터/패널에서 참조하는 정적 라우트는 반드시 200 이어야 한다.
  // (사례: 알림 패널의 /my/notifications 죽은 링크, 캐릭터 복제 후 /my/characters/[id] 404)
  // 주의: /my/* 는 서버 리다이렉트 미들웨어가 없고 클라이언트에서 인증 상태를 그리므로
  // 데모 CI 에서도 200 이 정답이다 — 302 기대(인증 분리)로 바꾸면 오히려 깨진다.
  // 서버측 인증 미들웨어가 도입되면 그때 공개/비공개로 분리할 것.
  const ROUTES = [
    '/',
    '/templates',
    '/premium',
    '/about',
    '/creators',
    '/help',
    '/terms',
    '/privacy',
    '/login',
    '/my',
    '/my/characters',
    '/my/library',
    '/my/works',
    '/my/settings',
    '/my/bookmarks',
    '/my/creator',
    '/my/whispers',
    '/my/subscription',
    '/my/notifications',
    '/resources/new',
  ]

  for (const route of ROUTES) {
    test(`GET ${route} → 200`, async ({ request }) => {
      const res = await request.get(route)
      expect(res.status(), `${route} 응답 코드`).toBe(200)
    })
  }

  test('존재하지 않는 경로는 404 페이지를 보여준다', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-real-page')
    expect(res?.status()).toBe(404)
  })
})
