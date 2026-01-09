/**
 * Sprint 36: 곡선 텍스트 경로 생성 유틸리티
 *
 * SVG 경로 문자열을 생성하여 Konva TextPath에서 사용
 */

import type { TextCurve } from '@/types/template'

/**
 * 곡선 타입에 따른 SVG 경로 생성
 *
 * @param curve - 곡선 설정
 * @param width - 텍스트 영역 너비
 * @param height - 텍스트 영역 높이
 * @returns SVG 경로 문자열
 */
export function generateCurvePath(
  curve: TextCurve,
  width: number,
  height: number
): string {
  const { type, strength } = curve

  switch (type) {
    case 'arc-up':
      return generateArcPath(width, height, strength, true)

    case 'arc-down':
      return generateArcPath(width, height, strength, false)

    case 'circle':
      return generateCirclePath(width, height, strength, curve.startAngle ?? 0)

    case 'wave':
      return generateWavePath(width, height, strength, curve.waveFrequency ?? 2)

    case 'none':
    default:
      // 직선 경로
      return `M 0 ${height / 2} L ${width} ${height / 2}`
  }
}

/**
 * 아치형 경로 생성
 *
 * @param width - 너비
 * @param height - 높이
 * @param strength - 곡률 (0~1)
 * @param isUp - 위로 휘는 아치 여부
 * @returns SVG 아치 경로
 */
function generateArcPath(
  width: number,
  height: number,
  strength: number,
  isUp: boolean
): string {
  // 곡률에 따른 제어점 오프셋
  const curveHeight = height * strength * 0.8

  // 중심점
  const midX = width / 2
  const baseY = isUp ? height * 0.7 : height * 0.3
  const peakY = isUp ? baseY - curveHeight : baseY + curveHeight

  // 이차 베지어 곡선 (Q 명령어)
  return `M 0 ${baseY} Q ${midX} ${peakY} ${width} ${baseY}`
}

/**
 * 원형 경로 생성
 *
 * @param width - 너비
 * @param height - 높이
 * @param strength - 호의 비율 (0~1, 1이면 전체 원)
 * @param startAngle - 시작 각도 (도)
 * @returns SVG 원호 경로
 */
function generateCirclePath(
  width: number,
  height: number,
  strength: number,
  startAngle: number
): string {
  // 반지름 계산
  const radius = Math.min(width, height) * 0.4

  // 중심점
  const cx = width / 2
  const cy = height / 2

  // 호의 각도 범위 (strength에 따라)
  const arcAngle = 360 * strength
  const startRad = (startAngle * Math.PI) / 180
  const endRad = ((startAngle + arcAngle) * Math.PI) / 180

  // 시작점과 끝점
  const startX = cx + radius * Math.cos(startRad)
  const startY = cy + radius * Math.sin(startRad)
  const endX = cx + radius * Math.cos(endRad)
  const endY = cy + radius * Math.sin(endRad)

  // 큰 호인지 작은 호인지 (180도 이상이면 큰 호)
  const largeArcFlag = arcAngle > 180 ? 1 : 0

  // SVG 호 경로
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
}

/**
 * 파동 경로 생성
 *
 * @param width - 너비
 * @param height - 높이
 * @param strength - 파동 진폭 (0~1)
 * @param frequency - 파동 주기
 * @returns SVG 파동 경로
 */
function generateWavePath(
  width: number,
  height: number,
  strength: number,
  frequency: number
): string {
  const amplitude = height * 0.3 * strength
  const centerY = height / 2
  const segments = Math.max(4, Math.floor(frequency * 4))

  // 경로 시작
  let path = `M 0 ${centerY}`

  // 세그먼트별로 삼차 베지어 곡선 추가
  const segmentWidth = width / segments

  for (let i = 0; i < segments; i++) {
    const x1 = (i + 0.5) * segmentWidth
    const x2 = (i + 1) * segmentWidth

    // 홀수/짝수에 따라 방향 전환
    const direction = i % 2 === 0 ? -1 : 1
    const y1 = centerY + direction * amplitude

    // 이차 베지어 곡선
    path += ` Q ${x1} ${y1} ${x2} ${centerY}`
  }

  return path
}

/**
 * 경로 길이 계산 (근사값)
 *
 * @param path - SVG 경로 문자열
 * @returns 경로 길이
 */
export function estimatePathLength(path: string): number {
  // 간단한 근사: 직선인 경우 명령어 사이 거리 합산
  // 실제로는 더 정교한 계산이 필요하지만 여기서는 근사값 사용

  // M x y 로 시작하는 간단한 케이스 처리
  const match = path.match(/^M\s+([\d.]+)\s+([\d.]+)\s+.*\s+([\d.]+)\s+([\d.]+)$/i)

  if (match) {
    const x1 = parseFloat(match[1])
    const y1 = parseFloat(match[2])
    const x2 = parseFloat(match[3])
    const y2 = parseFloat(match[4])

    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }

  // 기본값: 500px
  return 500
}
