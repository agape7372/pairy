'use client'

import { useState, useCallback, useRef } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Heart Pump - 심장 펌프
// 하트가 수축/이완하며 펌핑하는 느낌
// ============================================

export function LikeHeartPump({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.pumpPress,
          isLiked && styles.liked
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.pumpIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 2. Stamp Press - 도장 찍기
// 위에서 아래로 쿵 찍히는 느낌
// ============================================

export function LikeStampPress({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.stampDown
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.stampIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. Toggle Switch - 토글 스위치
// 딸깍 넘어가는 스위치 느낌
// ============================================

export function LikeToggleSwitch({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 350)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.toggleClick
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.toggleIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. Lock Click - 자물쇠 잠금
// 철컥 걸리는 금속성 느낌
// ============================================

export function LikeLockClick({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.lockSnap
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.lockIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 5. Dial Turn - 다이얼 회전
// 다이얼이 돌아가며 맞춰지는 느낌
// ============================================

export function LikeDialTurn({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.dialSpin
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.dialIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. Button Depress - 기계식 버튼
// 눌렸다가 스프링으로 튀어오르는 느낌
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
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          styles.mechanicalButton,
          isAnimating && styles.buttonDepressAnim
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.depressIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. Valve Release - 밸브 해제
// 압력이 풀리며 해제되는 느낌
// ============================================

export function LikeValveRelease({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.valveTwist
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.valveIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. Magnet Snap - 자석 끌림
// 자석에 철판이 달라붙는 느낌
// ============================================

export function LikeMagnetSnap({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.magnetPull
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.magnetIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. Gauge Fill - 게이지 충전
// 게이지가 차오르며 완료되는 느낌
// ============================================

export function LikeGaugeFill({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.gaugeFillAnim
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.gaugeIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. Capsule Pop - 캡슐 열림
// 캡슐이 팝 하고 터지는 느낌
// ============================================

export function LikeCapsulePop({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 550)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      <button
        className={cn(
          styles.physicsButton,
          isAnimating && styles.capsuleBurst
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.capsuleIcon
          )}
        />
      </button>
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
