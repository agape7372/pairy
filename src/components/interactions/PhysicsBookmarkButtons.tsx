'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Binder Clip - 바인더 클립
// 손잡이를 누르면 클립이 종이를 무는 메커니즘
// ============================================

export function BookmarkBinderClip({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.binderClipContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.binderClipSvg}>
        {/* 종이 */}
        <rect
          x="6"
          y="14"
          width="12"
          height="8"
          rx="1"
          className={cn(styles.clipPaper, isAnimating && styles.clamped)}
        />

        {/* 클립 입 (물리는 부분) */}
        <path
          d="M8 12h8v4H8z"
          className={cn(styles.clipMouth, isAnimating && styles.biting)}
        />

        {/* 클립 본체 */}
        <path
          d="M7 10h10a1 1 0 011 1v2H6v-2a1 1 0 011-1z"
          className={styles.clipBody}
        />

        {/* 좌측 손잡이 */}
        <path
          d="M6 10L3 6"
          fill="none"
          stroke="#374151"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            styles.clipHandleLeft,
            isAnimating && styles.pressing,
            isBookmarked && styles.clamped
          )}
        />

        {/* 우측 손잡이 */}
        <path
          d="M18 10L21 6"
          fill="none"
          stroke="#374151"
          strokeWidth="2"
          strokeLinecap="round"
          className={cn(
            styles.clipHandleRight,
            isAnimating && styles.pressing,
            isBookmarked && styles.clamped
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 2. Corner Fold - 모서리 접기
// 종이 모서리가 접히며 북마크 표시되는 메커니즘
// ============================================

export function BookmarkCornerFold({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.cornerFoldContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.cornerFoldSvg}>
        {/* 종이 본체 */}
        <path
          d="M4 4h16v16H4z"
          className={styles.foldPaper}
        />

        {/* 접힌 그림자 */}
        <path
          d="M14 4L20 10L14 10z"
          className={cn(styles.foldShadow, isBookmarked && styles.visible)}
        />

        {/* 접힌 모서리 */}
        <path
          d="M20 4L20 4L20 4z"
          className={cn(
            styles.foldedCorner,
            isAnimating && isBookmarked && styles.folding,
            isBookmarked && styles.folded
          )}
          style={{
            d: isBookmarked
              ? 'path("M14 4L20 4L20 10L14 10z")'
              : 'path("M20 4L20 4L20 4z")'
          }}
        />

        {/* 북마크 아이콘 */}
        <path
          d="M9 8v8l3-2 3 2V8z"
          className={cn(
            styles.foldIcon,
            isAnimating && isBookmarked && styles.appearing,
            isBookmarked && styles.visible
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 3. Ribbon Insert - 리본 삽입
// 리본이 책 사이로 들어가는 메커니즘
// ============================================

export function BookmarkRibbonInsert({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.ribbonContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.ribbonSvg}>
        {/* 책 페이지 */}
        <rect x="5" y="6" width="14" height="14" className={styles.ribbonBookPages} />

        {/* 책 표지 */}
        <path d="M4 5h16v16H4z" fill="none" stroke="#78350f" strokeWidth="2" />
        <rect x="4" y="5" width="2" height="16" className={styles.ribbonBook} />

        {/* 리본 */}
        <rect
          x="11"
          y={isBookmarked ? "2" : "-8"}
          width="2"
          height="12"
          rx="0.5"
          className={cn(
            styles.ribbon,
            isAnimating && isBookmarked && styles.inserting,
            isBookmarked && styles.inserted
          )}
          fill="#ef4444"
        />

        {/* 리본 끝 (V 모양) */}
        <path
          d="M11 20L12 22L13 20"
          fill="#ef4444"
          className={cn(
            styles.ribbonTail,
            isAnimating && isBookmarked && styles.showing,
            isBookmarked && styles.visible
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 4. Sticky Note - 포스트잇
// 포스트잇이 붙으며 모서리가 말리는 메커니즘
// ============================================

export function BookmarkStickyNote({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.stickyContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.stickySvg}>
        {/* 포스트잇 본체 */}
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="1"
          className={cn(styles.stickyNote, isAnimating && styles.sticking)}
        />

        {/* 말린 모서리 */}
        <path
          d="M16 16Q18 16 20 18L20 20L16 20z"
          className={cn(styles.stickyCurl, isBookmarked && styles.curled)}
          fill="#fde047"
        />

        {/* 북마크 심볼 */}
        <path
          d="M9 7v10l3-2 3 2V7z"
          className={cn(
            styles.stickySymbol,
            isAnimating && isBookmarked && styles.drawn,
            isBookmarked && styles.visible
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 5. Page Turn - 페이지 넘김
// 페이지가 넘어가며 북마크가 드러나는 메커니즘
// ============================================

export function BookmarkPageTurn({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.pageTurnContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.pageTurnSvg}>
        {/* 책 베이스 */}
        <rect x="3" y="3" width="18" height="18" rx="1" className={styles.pageBook} />

        {/* 페이지 스택 */}
        <rect x="4" y="4" width="16" height="16" className={styles.pageStack} />

        {/* 숨겨진 북마크 */}
        <path
          d="M15 6v8l-2-1.5-2 1.5V6z"
          className={cn(styles.hiddenBookmark, isBookmarked && styles.revealed)}
        />

        {/* 넘어가는 페이지 */}
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          className={cn(
            styles.turningPage,
            isAnimating && isBookmarked && styles.turning,
            isBookmarked && styles.turned
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 6. Flag Raise - 깃발 올리기
// 깃발이 올라가며 펄럭이는 메커니즘
// ============================================

export function BookmarkFlagRaise({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.flagContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.flagSvg}>
        {/* 깃대 */}
        <rect x="5" y="4" width="2" height="18" rx="0.5" className={styles.flagPole} />

        {/* 밧줄 */}
        <line
          x1="6"
          y1={isBookmarked ? "6" : "20"}
          x2="6"
          y2="20"
          className={cn(styles.flagRope, isAnimating && styles.pulling)}
          style={{
            transition: 'y1 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />

        {/* 깃발 */}
        <path
          d="M7 6h10l-3 4 3 4H7z"
          className={cn(
            styles.flag,
            isAnimating && isBookmarked && styles.raising,
            isBookmarked && styles.raised,
            isBookmarked && !isAnimating && styles.waving
          )}
        />

        {/* 깃발 안 별 */}
        <path
          d="M11 10l.5 1.5H13l-1.2.9.5 1.5-1.3-1-1.3 1 .5-1.5-1.2-.9h1.5z"
          fill="white"
          style={{
            transform: isBookmarked ? 'translateY(-15px)' : 'translateY(0)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </svg>
    </div>
  )
}

// ============================================
// 7. Pin Drop - 핀 낙하
// 핀이 떨어져 보드에 박히는 메커니즘
// ============================================

export function BookmarkPinDrop({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.pinDropContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.pinDropSvg}>
        {/* 코르크 보드 */}
        <rect x="2" y="10" width="20" height="12" rx="2" className={styles.corkBoard} />

        {/* 박힌 그림자 */}
        <ellipse
          cx="12"
          cy="14"
          rx="3"
          ry="1"
          className={cn(styles.pinShadow, isBookmarked && styles.visible)}
        />

        {/* 핀 */}
        <g className={cn(
          styles.pin,
          isAnimating && isBookmarked && styles.dropping,
          isBookmarked && styles.pinned
        )}>
          {/* 핀 바늘 */}
          <path d="M12 12L12 16" className={styles.pinNeedle} strokeWidth="1" stroke="#6b7280" />

          {/* 핀 머리 */}
          <circle cx="12" cy="10" r="4" className={styles.pinHead} />

          {/* 북마크 심볼 */}
          <path
            d="M10 8v4l2-1.5 2 1.5V8z"
            fill="white"
          />
        </g>
      </svg>
    </div>
  )
}

// ============================================
// 8. Drawer Slide - 서랍 열기
// 서랍이 열리며 파일이 보이는 메커니즘
// ============================================

export function BookmarkDrawerSlide({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.drawerContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.drawerSvg}>
        {/* 캐비넷 */}
        <rect x="3" y="3" width="18" height="18" rx="2" className={styles.cabinet} />

        {/* 파일 (서랍 안) */}
        <g className={cn(
          styles.file,
          isAnimating && isBookmarked && styles.appearing,
          isBookmarked && styles.visible
        )}>
          <rect x="7" y="10" width="10" height="6" rx="0.5" fill="#fef3c7" />
          <rect x="13" y="9" width="3" height="2" rx="0.5" className={styles.fileTab} />
        </g>

        {/* 서랍 */}
        <rect
          x="5"
          y="6"
          width="14"
          height="8"
          rx="1"
          className={cn(
            styles.drawer,
            isAnimating && isBookmarked && styles.opening,
            isBookmarked && styles.open
          )}
        />

        {/* 서랍 손잡이 */}
        <rect x="10" y="9" width="4" height="2" rx="0.5" className={styles.drawerHandle} />
      </svg>
    </div>
  )
}

// ============================================
// 9. Wax Seal - 왁스 도장
// 왁스가 떨어지고 도장이 찍히는 메커니즘
// ============================================

export function BookmarkWaxSeal({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 1200)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.waxSealContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.waxSealSvg}>
        {/* 봉투 */}
        <path d="M2 6h20v14H2z" className={styles.envelope} />
        <path d="M2 6l10 7 10-7" fill="none" stroke="#fcd34d" strokeWidth="1" />

        {/* 왁스 물방울 */}
        <ellipse
          cx="12"
          cy="14"
          rx="2"
          ry="3"
          className={cn(styles.waxDrop, isAnimating && isBookmarked && styles.dropping)}
        />

        {/* 왁스 퍼짐 */}
        <circle
          cx="12"
          cy="14"
          r="5"
          className={cn(
            styles.waxPool,
            isAnimating && isBookmarked && styles.spreading,
            isBookmarked && styles.set
          )}
        />

        {/* 도장 마크 */}
        <path
          d="M10 12v4l2-1.5 2 1.5v-4z"
          className={cn(
            styles.sealMark,
            isAnimating && isBookmarked && styles.stamping,
            isBookmarked && styles.visible
          )}
        />
      </svg>
    </div>
  )
}

// ============================================
// 10. Tab Punch - 탭 펀칭
// 종이에 구멍을 뚫고 탭을 붙이는 메커니즘
// ============================================

export function BookmarkTabPunch({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.tabPunchContainer, className)} onClick={handleClick}>
      <svg viewBox="0 0 24 24" className={styles.tabPunchSvg}>
        {/* 종이 조각 (펀칭 시 날아감) */}
        <circle
          cx="6"
          cy="10"
          r="2"
          className={cn(styles.punchChad, isAnimating && isBookmarked && styles.flying)}
          style={{ '--tx': '-10px', '--ty': '15px' } as React.CSSProperties}
        />

        {/* 종이 */}
        <rect x="4" y="4" width="16" height="18" rx="1" className={styles.punchPaper} />

        {/* 펀칭된 구멍 */}
        <circle
          cx="6"
          cy="10"
          r="2"
          className={cn(
            styles.punchHole,
            isAnimating && isBookmarked && styles.punching,
            isBookmarked && styles.visible
          )}
        />

        {/* 인덱스 탭 */}
        <path
          d="M18 8h4v6h-4z"
          className={cn(
            styles.indexTab,
            isAnimating && isBookmarked && styles.attaching,
            isBookmarked && styles.attached
          )}
          style={{
            transform: isBookmarked ? 'translateX(0)' : 'translateX(10px)',
            opacity: isBookmarked ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s'
          }}
        />

        {/* 탭 안 텍스트 */}
        <text
          x="20"
          y="12"
          fontSize="4"
          fill="white"
          textAnchor="middle"
          style={{
            transform: isBookmarked ? 'translateX(0)' : 'translateX(10px)',
            opacity: isBookmarked ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, opacity 0.2s 0.1s'
          }}
        >
          ★
        </text>
      </svg>
    </div>
  )
}

// Export all variants
export const PhysicsBookmarkButtons = {
  BinderClip: BookmarkBinderClip,
  CornerFold: BookmarkCornerFold,
  RibbonInsert: BookmarkRibbonInsert,
  StickyNote: BookmarkStickyNote,
  PageTurn: BookmarkPageTurn,
  FlagRaise: BookmarkFlagRaise,
  PinDrop: BookmarkPinDrop,
  DrawerSlide: BookmarkDrawerSlide,
  WaxSeal: BookmarkWaxSeal,
  TabPunch: BookmarkTabPunch,
}
