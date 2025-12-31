'use client'

import { useState, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Binder Clip - 바인더 클립
// 클립이 물리며 찰칵 고정되는 느낌
// ============================================

export function BookmarkBinderClip({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.clipBite
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.clipIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 2. Corner Fold - 모서리 접기
// 종이 모서리가 접히는 느낌
// ============================================

export function BookmarkCornerFold({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.foldCorner
        )}
      >
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
// 리본이 책 사이로 들어가는 느낌
// ============================================

export function BookmarkRibbonInsert({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 650)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.ribbonSlide
        )}
      >
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
// 포스트잇이 붙으며 살짝 휘는 느낌
// ============================================

export function BookmarkStickyNote({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 550)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.stickySlap
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.stickyIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 5. Page Turn - 페이지 넘김
// 페이지가 넘어가는 느낌
// ============================================

export function BookmarkPageTurn({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.pageFlip
        )}
      >
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
// 깃발이 펄럭이며 올라가는 느낌
// ============================================

export function BookmarkFlagRaise({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.flagUp
        )}
      >
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
// 핀이 떨어져 박히는 느낌
// ============================================

export function BookmarkPinDrop({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.pinStab
        )}
      >
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
// 서랍이 열리며 넣는 느낌
// ============================================

export function BookmarkDrawerSlide({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 550)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.drawerPull
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400',
            isAnimating && styles.drawerIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. Wax Seal - 왁스 도장
// 왁스가 떨어지고 굳는 느낌
// ============================================

export function BookmarkWaxSeal({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.waxDrip
        )}
      >
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
// 펀치로 구멍 뚫고 탭 끼우는 느낌
// ============================================

export function BookmarkTabPunch({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 450)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.punchHit
        )}
      >
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
