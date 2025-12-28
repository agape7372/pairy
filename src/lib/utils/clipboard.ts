/**
 * 클립보드 유틸리티 - 폴백 지원
 *
 * navigator.clipboard API가 없거나 실패할 경우
 * execCommand('copy') 폴백을 사용합니다.
 */

/**
 * 텍스트를 클립보드에 복사합니다.
 * @param text 복사할 텍스트
 * @returns 성공 여부
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. navigator.clipboard API 시도 (modern browsers)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err)
      // API가 있지만 권한 문제 등으로 실패할 수 있음 - 폴백으로 진행
    }
  }

  // 2. execCommand 폴백 (legacy browsers, 권한 제한 환경)
  return copyWithExecCommand(text)
}

/**
 * execCommand를 사용한 폴백 복사
 */
function copyWithExecCommand(text: string): boolean {
  // 임시 textarea 생성
  const textarea = document.createElement('textarea')
  textarea.value = text

  // 화면에 보이지 않도록 스타일 설정
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  textarea.setAttribute('readonly', '') // 모바일 키보드 방지

  document.body.appendChild(textarea)

  try {
    // iOS Safari 대응
    const range = document.createRange()
    range.selectNodeContents(textarea)

    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }

    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length) // iOS Safari 대응

    const success = document.execCommand('copy')
    return success
  } catch (err) {
    console.error('execCommand copy failed:', err)
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/**
 * 클립보드 API 지원 여부 확인
 */
export function isClipboardSupported(): boolean {
  return !!(
    (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') ||
    document.queryCommandSupported?.('copy')
  )
}
