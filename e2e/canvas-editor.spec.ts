import { test, expect } from '@playwright/test'

test.describe('Canvas Editor', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), '데스크톱 에디터 시나리오')

  test.beforeEach(async ({ page }) => {
    // 기능 테스트는 첫 방문용 온보딩과 독립적으로 실행한다.
    await page.addInitScript(() => {
      localStorage.setItem('pairy-onboarding-completed', 'true')
    })
    await page.goto('/canvas-editor/couple-magazine')
    await page.locator('canvas').first().waitFor({
      state: 'visible',
      timeout: 15_000,
    })
  })

  test('should load the canvas editor page', async ({ page }) => {
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/Pairy/)

    // 에디터 UI 요소 확인
    await expect(page.locator('header')).toBeVisible()

    // 캔버스 영역 확인
    await expect(page.locator('canvas').first()).toBeVisible()
  })

  test('should have working zoom controls', async ({ page }) => {
    // 줌 컨트롤 버튼 확인
    const zoomInBtn = page.locator('button[title="확대"]')
    const zoomOutBtn = page.locator('button[title="축소"]')
    const zoomResetBtn = page.locator('button[title="100%로 리셋"]')

    await expect(zoomInBtn).toBeVisible()
    await expect(zoomOutBtn).toBeVisible()
    await expect(zoomResetBtn).toBeVisible()

    const zoomValue = page.getByText(/^\d+%$/).first()
    const beforeZoom = Number.parseInt(
      (await zoomValue.textContent()) || '0',
      10
    )

    // 현재 화면 맞춤 값과 무관하게 줌 인 결과가 증가하는지 확인
    await zoomInBtn.click()
    await expect
      .poll(async () =>
        Number.parseInt((await zoomValue.textContent()) || '0', 10)
      )
      .toBeGreaterThan(beforeZoom)
  })

  test('should have sidebar with tabs', async ({ page }) => {
    // 사이드바 탭 확인
    await expect(page.getByRole('tab', { name: /캐릭터/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /텍스트/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /색상/ })).toBeVisible()
  })

  test('should switch sidebar tabs', async ({ page }) => {
    // 색상 탭 클릭
    await page.getByRole('tab', { name: /색상/ }).click()

    // 색상 피커 확인
    await expect(page.locator('input[type="color"]').first()).toBeVisible()
  })

  test('should have undo/redo buttons', async ({ page }) => {
    // Undo/Redo 버튼 확인
    const undoBtn = page.getByRole('button', { name: '실행 취소' })
    const redoBtn = page.getByRole('button', { name: '다시 실행' })

    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
  })

  test('제목만 변경해도 즉시 브라우저에 저장한다', async ({ page }) => {
    const titleInput = page.getByRole('textbox', { name: '작업 제목' })
    const saveButton = page.getByRole('button', { name: '작업 저장' })

    await titleInput.fill('제목 전용 저장 검증')
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(page.getByText('브라우저에 저장되었습니다')).toBeVisible()
    const savedTitle = await page.evaluate(() => {
      const draftId = new URL(window.location.href).searchParams.get('draft')
      const raw = draftId
        ? localStorage.getItem(`pairy-autosave-draft-${draftId}`)
        : null
      return raw ? JSON.parse(raw).title : null
    })
    expect(savedTitle).toBe('제목 전용 저장 검증')

    await page.reload()
    await page.getByRole('button', { name: '복구하기' }).click()
    await expect(
      page.getByRole('textbox', { name: '작업 제목' })
    ).toHaveValue('제목 전용 저장 검증')
  })

  test('should have export button', async ({ page }) => {
    // 내보내기 버튼 확인
    const exportBtn = page.getByRole('button', { name: /내보내기/ })
    await expect(exportBtn).toBeVisible()

    // 클릭하면 모달 열림
    await exportBtn.click()
    await expect(page.getByText('이미지 내보내기')).toBeVisible()
  })
})

test.describe('Canvas Editor - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pairy-onboarding-completed', 'true')
    })
    await page.goto('/canvas-editor/couple-magazine')

    // 모바일에서도 캔버스 표시
    await expect(page.locator('canvas').first()).toBeVisible()

    // 헤더 표시
    await expect(page.locator('header')).toBeVisible()
  })
})
