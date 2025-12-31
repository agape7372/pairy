'use client'

import { useState, useCallback, useRef } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Binder Clip - 바인더 클립
// 클립 손잡이가 열리고 → 물리며 찰칵 고정
// ============================================

export function BookmarkBinderClip({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [clipOpen, setClipOpen] = useState(false)
  const [showClampEffect, setShowClampEffect] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setClipOpen(true)
      setTimeout(() => {
        setClipOpen(false)
        setShowClampEffect(true)
      }, 200)
      setTimeout(() => setShowClampEffect(false), 500)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 클립 손잡이 */}
      <div className={cn(
        styles.clipHandle,
        clipOpen && styles.clipHandleOpen
      )} />

      {/* 물림 충격 효과 */}
      {showClampEffect && (
        <div className={styles.clampShock} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.clipBite
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.clipIcon
          )}
        />
      </button>

      {/* 고정 표시 */}
      {isBookmarked && !isAnimating && (
        <div className={styles.clipIndicator} />
      )}
    </div>
  )
}

// ============================================
// 2. Corner Fold - 모서리 접기
// 종이가 들려서 접히고 → 그림자 변화
// ============================================

export function BookmarkCornerFold({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [foldPhase, setFoldPhase] = useState<'idle' | 'lift' | 'fold' | 'settle'>('idle')

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setFoldPhase('lift')
      setTimeout(() => setFoldPhase('fold'), 150)
      setTimeout(() => setFoldPhase('settle'), 400)
      setTimeout(() => setFoldPhase('idle'), 600)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 종이 그림자 */}
      <div className={cn(
        styles.paperShadow,
        foldPhase === 'lift' && styles.paperShadowLift,
        foldPhase === 'fold' && styles.paperShadowFold
      )} />

      {/* 접힌 모서리 효과 */}
      {isBookmarked && (
        <div className={styles.foldedCorner} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.foldCorner
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.foldIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. Ribbon Insert - 리본 삽입
// 리본이 위에서 내려와 → 책 사이로 미끄러져 들어감
// ============================================

export function BookmarkRibbonInsert({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [ribbonVisible, setRibbonVisible] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setRibbonVisible(true)
    }

    setTimeout(() => setIsAnimating(false), 650)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 리본 꼬리 */}
      {ribbonVisible && isBookmarked && (
        <div className={cn(
          styles.ribbonTail,
          isAnimating && styles.ribbonTailDrop
        )} />
      )}

      {/* 책 페이지 라인 */}
      <div className={styles.pageLines}>
        <div className={styles.pageLine} />
        <div className={styles.pageLine} />
      </div>

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.ribbonSlide
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.ribbonIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. Sticky Note - 포스트잇
// 포스트잇이 휘어지며 떨어져서 → 붙으며 출렁임
// ============================================

export function BookmarkStickyNote({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showStick, setShowStick] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setTimeout(() => setShowStick(true), 350)
      setTimeout(() => setShowStick(false), 550)
    }

    setTimeout(() => setIsAnimating(false), 550)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 붙는 순간 효과 */}
      {showStick && (
        <div className={styles.stickImpact} />
      )}

      {/* 포스트잇 모서리 */}
      {isBookmarked && (
        <div className={styles.stickyCorner} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.stickySlap
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.stickyIcon
          )}
        />
      </button>

      {/* 그림자 출렁임 */}
      <div className={cn(
        styles.stickyShadow,
        isAnimating && styles.stickyShadowWobble
      )} />
    </div>
  )
}

// ============================================
// 5. Page Turn - 페이지 넘김
// 페이지가 3D로 넘어가며 → 펄럭이다 정착
// ============================================

export function BookmarkPageTurn({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pagePhase, setPagePhase] = useState<'idle' | 'lifting' | 'turning' | 'settling'>('idle')

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setPagePhase('lifting')
      setTimeout(() => setPagePhase('turning'), 150)
      setTimeout(() => setPagePhase('settling'), 450)
      setTimeout(() => setPagePhase('idle'), 700)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 페이지 그림자 */}
      <div className={cn(
        styles.pageTurnShadow,
        pagePhase === 'turning' && styles.pageTurnShadowFlip
      )} />

      {/* 펄럭임 효과 */}
      {pagePhase === 'settling' && (
        <div className={styles.pageFlutter} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.pageFlip
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.pageIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. Flag Raise - 깃발 올리기
// 깃발이 올라가며 → 펄럭이다 정착
// ============================================

export function BookmarkFlagRaise({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [waving, setWaving] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setTimeout(() => setWaving(true), 200)
      setTimeout(() => setWaving(false), 600)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 깃대 */}
      <div className={cn(
        styles.flagPole,
        isBookmarked && styles.flagPoleUp
      )} />

      {/* 펄럭임 */}
      {waving && (
        <div className={styles.flagWave} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.flagUp
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.flagIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. Pin Drop - 핀 낙하
// 핀이 위에서 떨어져 → 박히며 진동
// ============================================

export function BookmarkPinDrop({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showImpact, setShowImpact] = useState(false)
  const [vibrating, setVibrating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setTimeout(() => {
        setShowImpact(true)
        setVibrating(true)
      }, 250)
      setTimeout(() => setShowImpact(false), 450)
      setTimeout(() => setVibrating(false), 500)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 충돌 파동 */}
      {showImpact && (
        <div className={styles.pinImpactRipple} />
      )}

      {/* 박힌 구멍 효과 */}
      {isBookmarked && (
        <div className={styles.pinHole} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.pinStab,
        vibrating && styles.pinVibrate
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.pinIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. Drawer Slide - 서랍 열기
// 서랍이 열리며 → 안에 넣고 닫힘
// ============================================

export function BookmarkDrawerSlide({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setDrawerOpen(true)
      setTimeout(() => setDrawerOpen(false), 350)
    }

    setTimeout(() => setIsAnimating(false), 550)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 서랍 프레임 */}
      <div className={cn(
        styles.drawerFrame,
        drawerOpen && styles.drawerFrameOpen
      )}>
        <div className={styles.drawerHandle} />
      </div>

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.drawerPull
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.drawerIcon
          )}
        />
      </button>

      {/* 서랍 그림자 */}
      <div className={cn(
        styles.drawerShadow,
        drawerOpen && styles.drawerShadowOpen
      )} />
    </div>
  )
}

// ============================================
// 9. Wax Seal - 왁스 도장
// 왁스가 떨어지고 → 펴지며 굳음
// ============================================

export function BookmarkWaxSeal({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [waxPhase, setWaxPhase] = useState<'idle' | 'dripping' | 'spreading' | 'cooling'>('idle')

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setWaxPhase('dripping')
      setTimeout(() => setWaxPhase('spreading'), 250)
      setTimeout(() => setWaxPhase('cooling'), 500)
      setTimeout(() => setWaxPhase('idle'), 700)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 왁스 퍼짐 */}
      <div className={cn(
        styles.waxSpread,
        waxPhase === 'spreading' && styles.waxSpreadActive,
        waxPhase === 'cooling' && styles.waxCooling
      )} />

      {/* 광택 효과 */}
      {isBookmarked && (
        <div className={styles.waxShine} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.waxDrip
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.waxIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. Tab Punch - 탭 펀칭
// 펀치로 뚫고 → 탭 끼우기
// ============================================

export function BookmarkTabPunch({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [punchHit, setPunchHit] = useState(false)
  const [showHole, setShowHole] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setTimeout(() => {
        setPunchHit(true)
        setShowHole(true)
      }, 150)
      setTimeout(() => setPunchHit(false), 300)
    }

    setTimeout(() => setIsAnimating(false), 450)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 펀치 효과 */}
      {punchHit && (
        <>
          <div className={styles.punchImpact} />
          <div className={cn(styles.paperChip, styles.chip1)} />
          <div className={cn(styles.paperChip, styles.chip2)} />
        </>
      )}

      {/* 뚫린 구멍 */}
      {showHole && isBookmarked && (
        <div className={styles.punchedHole} />
      )}

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.punchHit
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.punchIcon
          )}
        />
      </button>
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
