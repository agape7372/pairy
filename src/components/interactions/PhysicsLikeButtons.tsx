'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Heart Pump - 심장 펌프
// 심장이 수축/이완하며 혈액이 충전되는 메커니즘
// ============================================

export function LikeHeartPump({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.heartPumpContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.heartPumpSvg}>
        {/* 혈액 충전 (가장 뒤) */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          className={cn(
            styles.bloodFill,
            isAnimating && !isLiked && styles.filling,
            isLiked && styles.active
          )}
        />

        {/* 좌심실 */}
        <path
          d="M7.5 3C4.42 3 2 5.42 2 8.5c0 1.5.5 2.9 1.35 4L12 5.09C10.91 3.81 9.24 3 7.5 3z"
          className={cn(
            styles.heartChamberLeft,
            isAnimating && styles.squeeze,
            isLiked && styles.active
          )}
        />

        {/* 우심실 */}
        <path
          d="M16.5 3c-1.74 0-3.41.81-4.5 2.09L20.65 12.5c.85-1.1 1.35-2.5 1.35-4C22 5.42 19.58 3 16.5 3z"
          className={cn(
            styles.heartChamberRight,
            isAnimating && styles.squeeze,
            isLiked && styles.active
          )}
        />

        {/* 심장 외곽 프레임 */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          className={cn(styles.heartFrame, isLiked && styles.active)}
        />

        {/* 중앙 밸브 */}
        <circle
          cx="12"
          cy="10"
          r="2"
          className={cn(styles.heartValve, isAnimating && styles.open)}
        />
      </svg>
    </div>
  )
}

// ============================================
// 2. Stamp Press - 도장 찍기
// 도장이 내려찍히며 잉크가 번지는 메커니즘
// ============================================

export function LikeStampPress({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.stampContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.stampSvg}>
        {/* 잉크 번짐 효과 */}
        <circle
          cx="12"
          cy="18"
          r="6"
          className={cn(styles.inkSpread, isAnimating && styles.spreading)}
        />

        {/* 잉크 자국 */}
        <path
          d="M12 14l-1.45-1.32C8.5 10.84 7 9.5 7 8c0-1.38 1.12-2.5 2.5-2.5.98 0 1.85.54 2.28 1.34.27-.49.65-.9 1.12-1.19A2.49 2.49 0 0114.5 5.5C15.88 5.5 17 6.62 17 8c0 1.5-1.5 2.84-3.55 4.68L12 14z"
          className={cn(
            styles.inkMark,
            isAnimating && !isLiked && styles.stamped,
            isLiked && styles.active
          )}
          transform="translate(0, 4)"
        />

        {/* 도장 손잡이 */}
        <rect
          x="9"
          y="2"
          width="6"
          height="8"
          rx="1"
          className={cn(styles.stampHandle, isAnimating && styles.pressing)}
        />

        {/* 도장 고무 부분 */}
        <rect
          x="8"
          y="9"
          width="8"
          height="3"
          rx="0.5"
          className={cn(styles.stampRubber, isAnimating && styles.pressing)}
        />
      </svg>
    </div>
  )
}

// ============================================
// 3. Toggle Switch - 토글 스위치
// 금속 스위치가 철컥 넘어가는 메커니즘
// ============================================

export function LikeToggleSwitch({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 300)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.toggleContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.toggleSvg}>
        {/* 스위치 베이스 */}
        <rect
          x="4"
          y="8"
          width="16"
          height="8"
          rx="4"
          className={cn(styles.switchBase, isLiked && styles.active)}
        />

        {/* 스위치 노브 */}
        <circle
          cx="8"
          cy="12"
          r="5"
          className={cn(
            styles.switchKnob,
            isLiked && styles.on,
            isAnimating && styles.switchTick
          )}
        />

        {/* 하트 아이콘 (노브 위) */}
        <path
          d="M8 10.5l-.5-.45C6.6 9.28 6 8.7 6 8c0-.55.45-1 1-1 .39 0 .75.22.9.55.15-.33.51-.55.9-.55.55 0 1 .45 1 1 0 .7-.6 1.28-1.5 2.05L8 10.5z"
          fill={isLiked ? 'white' : '#9ca3af'}
          style={{
            transform: isLiked ? 'translateX(12px)' : 'translateX(0)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 4. Lock Click - 자물쇠 잠금
// 걸쇠가 맞물리며 잠기는 메커니즘
// ============================================

export function LikeLockClick({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.lockContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.lockSvg}>
        {/* 걸쇠 (Shackle) */}
        <path
          d="M7 10V7a5 5 0 0110 0v3"
          className={cn(
            styles.lockShackle,
            !isLiked && styles.unlocked,
            isAnimating && isLiked && styles.locking,
            isLiked && styles.locked
          )}
        />

        {/* 자물쇠 본체 */}
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
          className={cn(styles.lockBody, isLiked && styles.locked)}
        />

        {/* 열쇠 구멍 */}
        <circle
          cx="12"
          cy="15"
          r="1.5"
          className={cn(styles.keyhole, isLiked && styles.locked)}
        />
        <rect
          x="11.25"
          y="15"
          width="1.5"
          height="3"
          className={cn(styles.keyhole, isLiked && styles.locked)}
        />
      </svg>
    </div>
  )
}

// ============================================
// 5. Dial Turn - 다이얼 회전
// 다이얼이 돌아가며 눈금이 맞춰지는 메커니즘
// ============================================

export function LikeDialTurn({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.dialContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.dialSvg}>
        {/* 다이얼 외곽 */}
        <circle cx="12" cy="12" r="10" className={styles.dialOuter} />

        {/* 눈금 */}
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="12"
            y1="3"
            x2="12"
            y2="5"
            className={styles.dialTicks}
            transform={`rotate(${i * 30} 12 12)`}
          />
        ))}

        {/* 다이얼 중심 */}
        <circle cx="12" cy="12" r="3" className={styles.dialCenter} />

        {/* 포인터 */}
        <path
          d="M12 4L13 12H11L12 4z"
          className={cn(
            styles.dialPointer,
            isAnimating && styles.turning,
            isLiked && styles.active
          )}
        />

        {/* 하트 표시 */}
        <path
          d="M12 19l-.7-.64C9.2 16.55 8 15.5 8 14.25c0-1 .8-1.75 1.75-1.75.69 0 1.34.4 1.62.97.18-.36.54-.65.96-.85.28-.13.58-.12.87-.12.95 0 1.8.75 1.8 1.75 0 1.25-1.2 2.3-3.3 4.11L12 19z"
          fill={isLiked ? '#ec4899' : '#d1d5db'}
          style={{ transition: 'fill 0.3s' }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 6. Button Depress - 기계식 버튼
// 버튼이 눌리고 스프링으로 복귀하는 메커니즘
// ============================================

export function LikeButtonDepress({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 450)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.mechanicalBtnContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.mechanicalBtnSvg}>
        {/* 버튼 베이스 */}
        <rect x="4" y="16" width="16" height="4" rx="1" className={styles.btnBase} />

        {/* 버튼 탑 */}
        <rect
          x="5"
          y="6"
          width="14"
          height="10"
          rx="2"
          className={cn(
            styles.btnTop,
            isAnimating && styles.pressing,
            isLiked && styles.pressed
          )}
        />

        {/* 하트 아이콘 */}
        <path
          d="M12 14l-1.8-1.64C8.1 10.63 7 9.55 7 8.25 7 7.01 7.97 6 9.16 6c.67 0 1.31.32 1.72.83.27-.34.63-.59 1.03-.73.28-.1.58-.1.89-.1C14.03 6 15 7.01 15 8.25c0 1.3-1.1 2.38-3.2 4.11L12 14z"
          className={cn(styles.btnIcon, isAnimating && styles.bounce)}
          style={{
            transform: isLiked ? 'translateY(3px)' : 'translateY(0)',
            transition: 'transform 0.1s'
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 7. Valve Release - 밸브 해제
// 밸브가 열리며 증기가 나오는 메커니즘
// ============================================

export function LikeValveRelease({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 1100)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.valveContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.valveSvg}>
        {/* 증기 효과 */}
        <ellipse
          cx="8"
          cy="4"
          rx="2"
          ry="3"
          className={cn(styles.steam, styles.steam1, isAnimating && isLiked && styles.releasing)}
        />
        <ellipse
          cx="12"
          cy="3"
          rx="2.5"
          ry="3.5"
          className={cn(styles.steam, styles.steam2, isAnimating && isLiked && styles.releasing)}
        />
        <ellipse
          cx="16"
          cy="4"
          rx="2"
          ry="3"
          className={cn(styles.steam, styles.steam3, isAnimating && isLiked && styles.releasing)}
        />

        {/* 파이프 */}
        <rect x="4" y="14" width="16" height="6" rx="1" className={styles.valvePipe} />
        <rect x="8" y="10" width="8" height="4" className={styles.valvePipe} />

        {/* 밸브 휠 */}
        <circle
          cx="12"
          cy="10"
          r="4"
          className={cn(
            styles.valveWheel,
            isAnimating && styles.turning,
            isLiked && styles.open
          )}
        />

        {/* 휠 스포크 */}
        <line x1="12" y1="6" x2="12" y2="14" stroke="white" strokeWidth="1"
          style={{
            transform: isLiked ? 'rotate(90deg)' : 'rotate(0deg)',
            transformOrigin: '12px 10px',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
        <line x1="8" y1="10" x2="16" y2="10" stroke="white" strokeWidth="1"
          style={{
            transform: isLiked ? 'rotate(90deg)' : 'rotate(0deg)',
            transformOrigin: '12px 10px',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 8. Magnet Snap - 자석 끌림
// 자석이 철판에 끌려 붙는 메커니즘
// ============================================

export function LikeMagnetSnap({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magnetContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.magnetSvg}>
        {/* 자기장 라인 */}
        <path
          d="M6 14 Q12 10 18 14"
          className={cn(styles.fieldLine, isAnimating && isLiked && styles.active)}
          style={{ '--tx': '0px', '--ty': '-5px' } as React.CSSProperties}
        />
        <path
          d="M4 16 Q12 10 20 16"
          className={cn(styles.fieldLine, isAnimating && isLiked && styles.active)}
          style={{ '--tx': '0px', '--ty': '-8px', animationDelay: '0.1s' } as React.CSSProperties}
        />

        {/* 금속판 */}
        <rect x="4" y="18" width="16" height="3" rx="0.5" className={styles.metalPlate} />

        {/* 자석 그룹 */}
        <g className={cn(
          styles.magnet,
          isAnimating && isLiked && styles.snapping,
          isLiked && styles.attached
        )}>
          {/* 자석 U자 형태 */}
          <path
            d="M7 6h3v8H7zM14 6h3v8h-3z"
            className={styles.magnetBody}
          />
          <path d="M7 6h3v3H7z" className={styles.magnetPoleN} />
          <path d="M14 6h3v3h-3z" className={styles.magnetPoleS} />
          <rect x="7" y="4" width="10" height="3" rx="1" className={styles.magnetBody} />

          {/* 하트 표시 */}
          <path
            d="M12 9l-.6-.55C10.4 7.62 10 7.2 10 6.7c0-.4.35-.7.75-.7.3 0 .55.17.66.42.04-.1.11-.18.19-.25.11-.11.26-.17.4-.17.4 0 .75.3.75.7 0 .5-.4.92-1.4 1.75L12 9z"
            fill="white"
          />
        </g>
      </svg>
    </div>
  )
}

// ============================================
// 9. Gauge Fill - 게이지 충전
// 게이지가 차오르며 바늘이 움직이는 메커니즘
// ============================================

export function LikeGaugeFill({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.gaugeContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.gaugeSvg}>
        {/* 게이지 배경 */}
        <circle cx="12" cy="12" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />

        {/* 게이지 눈금 */}
        <path
          d="M12 2 A10 10 0 0 1 22 12"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M12 2 A10 10 0 0 1 22 12"
          fill="none"
          stroke="#f472b6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="15.7"
          strokeDashoffset={isLiked ? '0' : '15.7'}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 1.5, 0.5, 1)'
          }}
        />

        {/* 게이지 바늘 */}
        <path
          d="M12 12L12 5L13 12z"
          fill="#1f2937"
          className={cn(
            styles.gaugeNeedle,
            isAnimating && styles.moving,
            isLiked && styles.full
          )}
        />

        {/* 게이지 중심 */}
        <circle cx="12" cy="12" r="2" className={styles.gaugeCenter} />

        {/* 하트 아이콘 */}
        <path
          d="M12 19l-.9-.82C8.6 15.9 7 14.45 7 12.75c0-1.24 1-2.25 2.25-2.25.88 0 1.69.51 2.06 1.24.24-.45.62-.82 1.09-1.06.35-.18.74-.18 1.1-.18 1.25 0 2.25 1.01 2.25 2.25 0 1.7-1.6 3.15-4.1 5.43L12 19z"
          fill={isLiked ? '#ec4899' : '#9ca3af'}
          style={{ transition: 'fill 0.3s' }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 10. Capsule Pop - 캡슐 열림
// 캡슐이 열리며 내용물이 튀어나오는 메커니즘
// ============================================

export function LikeCapsulePop({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.capsuleContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.capsuleSvg}>
        {/* 반짝이 */}
        <circle
          cx="6"
          cy="6"
          r="1.5"
          className={cn(styles.capsuleSparkle, styles.sparkle1, isAnimating && isLiked && styles.sparkling)}
          style={{ '--tx': '-8px', '--ty': '-8px' } as React.CSSProperties}
        />
        <circle
          cx="18"
          cy="6"
          r="1"
          className={cn(styles.capsuleSparkle, styles.sparkle2, isAnimating && isLiked && styles.sparkling)}
          style={{ '--tx': '8px', '--ty': '-10px' } as React.CSSProperties}
        />
        <circle
          cx="5"
          cy="12"
          r="1"
          className={cn(styles.capsuleSparkle, styles.sparkle3, isAnimating && isLiked && styles.sparkling)}
          style={{ '--tx': '-10px', '--ty': '0px' } as React.CSSProperties}
        />
        <circle
          cx="19"
          cy="12"
          r="1.2"
          className={cn(styles.capsuleSparkle, styles.sparkle4, isAnimating && isLiked && styles.sparkling)}
          style={{ '--tx': '10px', '--ty': '2px' } as React.CSSProperties}
        />

        {/* 튀어나오는 하트 */}
        <path
          d="M12 10l-1.5-1.35C8.5 6.95 7 5.7 7 4.15 7 2.75 8.1 1.6 9.45 1.6c.95 0 1.85.55 2.28 1.4.27-.52.8-.95 1.42-1.22.42-.18.88-.18 1.35-.18C16.9 1.6 18 2.75 18 4.15c0 1.55-1.5 2.8-3.5 4.5L12 10z"
          className={cn(
            styles.capsuleContent,
            isAnimating && isLiked && styles.popping,
            isLiked && styles.visible
          )}
        />

        {/* 캡슐 하단 */}
        <path
          d="M8 14 L8 20 Q8 22 10 22 L14 22 Q16 22 16 20 L16 14 Z"
          className={styles.capsuleBottom}
        />

        {/* 캡슐 상단 */}
        <path
          d="M8 14 L8 10 Q8 8 10 8 L14 8 Q16 8 16 10 L16 14 Z"
          className={cn(
            styles.capsuleTop,
            isAnimating && isLiked && styles.opening,
            isLiked && styles.open
          )}
        />
      </svg>
    </div>
  )
}

// Export all variants
export const PhysicsLikeButtons = {
  HeartPump: LikeHeartPump,
  StampPress: LikeStampPress,
  ToggleSwitch: LikeToggleSwitch,
  LockClick: LikeLockClick,
  DialTurn: LikeDialTurn,
  ButtonDepress: LikeButtonDepress,
  ValveRelease: LikeValveRelease,
  MagnetSnap: LikeMagnetSnap,
  GaugeFill: LikeGaugeFill,
  CapsulePop: LikeCapsulePop,
}
