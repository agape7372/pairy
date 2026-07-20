import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * 한글/일본어 등 IME 조합 중인 키 이벤트인지 판정.
 *
 * H-13(2차 감사 · DL-0006): 조합 중 Enter 가 제출/저장을 조기 실행하는 문제 방지용.
 * 제목·댓글·태그·프리셋명·이름변경·폴더명·인라인 텍스트 등의 Enter 핸들러 맨 앞에서
 * `if (isImeComposing(e)) return` 으로 조합 확정 Enter 를 흘려보낸다.
 *
 * - `nativeEvent.isComposing`: 표준(Chrome/Edge/Firefox) 조합 중 true.
 * - `keyCode === 229`: 구형 Safari/일부 IME 가 조합 중 보내는 값(호환 커버).
 *
 * 일반(비조합) Enter·Shift+Enter 동작은 그대로 유지된다.
 */
export function isImeComposing(
  e: Pick<ReactKeyboardEvent, 'nativeEvent'>
): boolean {
  const native = e.nativeEvent as KeyboardEvent
  return native.isComposing || native.keyCode === 229
}
