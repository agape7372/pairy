import { test, expect } from '@playwright/test'

test.describe('Canvas Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas-editor/couple-magazine')
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

    // 줌 인 클릭
    await zoomInBtn.click()
    // 줌 표시 확인 (110% 예상)
    await expect(page.getByText(/110%/)).toBeVisible()
  })

  test('should have sidebar with tabs', async ({ page }) => {
    // 사이드바 탭 확인
    await expect(page.getByRole('button', { name: /캐릭터/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /텍스트/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /색상/ })).toBeVisible()
  })

  test('should switch sidebar tabs', async ({ page }) => {
    // 색상 탭 클릭
    await page.getByRole('button', { name: /색상/ }).click()

    // 색상 피커 확인
    await expect(page.locator('input[type="color"]').first()).toBeVisible()
  })

  test('should have undo/redo buttons', async ({ page }) => {
    // Undo/Redo 버튼 확인
    const undoBtn = page.locator('button[title="실행 취소 (Ctrl+Z)"]')
    const redoBtn = page.locator('button[title="다시 실행 (Ctrl+Y)"]')

    await expect(undoBtn).toBeVisible()
    await expect(redoBtn).toBeVisible()
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
    await page.goto('/canvas-editor/couple-magazine')

    // 모바일에서도 캔버스 표시
    await expect(page.locator('canvas').first()).toBeVisible()

    // 헤더 표시
    await expect(page.locator('header')).toBeVisible()
  })
})
