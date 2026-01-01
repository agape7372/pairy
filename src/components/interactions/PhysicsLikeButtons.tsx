'use client'

import { useState, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Fairy Dust - 요정 가루
// 하트 주변에 반짝이는 가루가 흩뿌려짐
// ============================================

export function LikeFairyDust({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDust, setShowDust] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setShowDust(true)
      setTimeout(() => setShowDust(false), 1000)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 요정 가루 파티클 */}
      {showDust && (
        <>
          <div className={cn(styles.fairyDust, styles.dust1)} />
          <div className={cn(styles.fairyDust, styles.dust2)} />
          <div className={cn(styles.fairyDust, styles.dust3)} />
          <div className={cn(styles.fairyDust, styles.dust4)} />
          <div className={cn(styles.fairyDust, styles.dust5)} />
          <div className={cn(styles.fairyDust, styles.dust6)} />
          <div className={cn(styles.fairyDust, styles.dust7)} />
          <div className={cn(styles.fairyDust, styles.dust8)} />
        </>
      )}

      {/* 부드러운 글로우 */}
      <div className={cn(
        styles.softGlow,
        isLiked && styles.softGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.fairyPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.fairyHeartPop
          )}
        />
      </button>

      {/* 지속 반짝임 */}
      {isLiked && !isAnimating && (
        <div className={styles.persistentSparkle} />
      )}
    </div>
  )
}

// ============================================
// 2. Magic Wand - 마법 지팡이
// 터치하면 별이 터져나옴
// ============================================

export function LikeMagicWand({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showStars, setShowStars] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setShowStars(true)
      setTimeout(() => setShowStars(false), 800)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 별 폭발 */}
      {showStars && (
        <>
          <div className={cn(styles.magicStar, styles.star1)}>✦</div>
          <div className={cn(styles.magicStar, styles.star2)}>✧</div>
          <div className={cn(styles.magicStar, styles.star3)}>✦</div>
          <div className={cn(styles.magicStar, styles.star4)}>✧</div>
          <div className={cn(styles.magicStar, styles.star5)}>✦</div>
          <div className={cn(styles.magicStar, styles.star6)}>✧</div>
        </>
      )}

      {/* 마법 원형 파동 */}
      <div className={cn(
        styles.magicRing,
        isAnimating && styles.magicRingExpand
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.wandTouch
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.wandHeartBurst
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. Sparkle Burst - 빛 파티클 방사
// 중심에서 빛이 방사형으로 퍼져나감
// ============================================

export function LikeSparkleBurst({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showBurst, setShowBurst] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 600)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 빛 방사선 */}
      {showBurst && (
        <div className={styles.sparkleRays}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={styles.sparkleRay}
              style={{ transform: `rotate(${i * 45}deg)` }}
            />
          ))}
        </div>
      )}

      {/* 중심 플래시 */}
      <div className={cn(
        styles.centerFlash,
        showBurst && styles.centerFlashActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.burstPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.burstHeartGlow
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. Heart Glow - 부드러운 빛 발산
// 하트가 부드럽게 빛나며 후광 효과
// ============================================

export function LikeHeartGlow({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 다중 후광 레이어 */}
      <div className={cn(
        styles.haloLayer,
        styles.haloLayer1,
        isLiked && styles.haloActive
      )} />
      <div className={cn(
        styles.haloLayer,
        styles.haloLayer2,
        isLiked && styles.haloActive
      )} />
      <div className={cn(
        styles.haloLayer,
        styles.haloLayer3,
        isLiked && styles.haloActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.glowPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-500',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.glowHeartFloat
          )}
        />
      </button>

      {/* 부드러운 빛 파동 */}
      {isAnimating && <div className={styles.glowWave} />}
    </div>
  )
}

// ============================================
// 5. Crystal Shine - 크리스탈 빛 굴절
// 다이아몬드처럼 빛이 굴절되는 효과
// ============================================

export function LikeCrystalShine({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRefract, setShowRefract] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setShowRefract(true)
      setTimeout(() => setShowRefract(false), 700)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 굴절된 빛 */}
      {showRefract && (
        <>
          <div className={cn(styles.crystalLight, styles.refract1)} />
          <div className={cn(styles.crystalLight, styles.refract2)} />
          <div className={cn(styles.crystalLight, styles.refract3)} />
        </>
      )}

      {/* 크리스탈 프리즘 효과 */}
      <div className={cn(
        styles.prismEffect,
        isLiked && styles.prismActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.crystalPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.crystalHeartShine
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. Aurora Wave - 오로라 물결
// 부드러운 오로라 빛이 물결치듯 퍼짐
// ============================================

export function LikeAuroraWave({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 오로라 레이어 */}
      <div className={cn(
        styles.auroraLayer,
        isAnimating && styles.auroraWave
      )} />

      {/* 부드러운 그라데이션 글로우 */}
      <div className={cn(
        styles.auroraGlow,
        isLiked && styles.auroraGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.auroraPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.auroraHeartFloat
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. Star Twinkle - 별빛 깜빡임
// 주변에 별들이 반짝반짝 깜빡임
// ============================================

export function LikeStarTwinkle({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 반짝이는 별들 */}
      <div className={cn(styles.twinkleStar, styles.twinkle1, isAnimating && styles.twinkleActive)}>✦</div>
      <div className={cn(styles.twinkleStar, styles.twinkle2, isAnimating && styles.twinkleActive)}>✧</div>
      <div className={cn(styles.twinkleStar, styles.twinkle3, isAnimating && styles.twinkleActive)}>✦</div>
      <div className={cn(styles.twinkleStar, styles.twinkle4, isAnimating && styles.twinkleActive)}>✧</div>

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.twinklePulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.twinkleHeartGlow
          )}
        />
      </button>

      {/* 지속 반짝임 */}
      {isLiked && <div className={styles.persistentTwinkle} />}
    </div>
  )
}

// ============================================
// 8. Moon Phase - 달빛 차오름
// 달처럼 빛이 차오르는 효과
// ============================================

export function LikeMoonPhase({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fillLevel, setFillLevel] = useState(0)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      let level = 0
      const interval = setInterval(() => {
        level += 10
        setFillLevel(level)
        if (level >= 100) clearInterval(interval)
      }, 50)
    } else {
      setFillLevel(0)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 달빛 차오름 */}
      <div className={styles.moonFillContainer}>
        <div
          className={styles.moonFill}
          style={{ height: `${fillLevel}%` }}
        />
      </div>

      {/* 달빛 후광 */}
      <div className={cn(
        styles.moonGlow,
        isLiked && styles.moonGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.moonPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.moonHeartRise
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. Petal Float - 꽃잎 떠오름
// 부드럽게 꽃잎이 떠오르는 효과
// ============================================

export function LikePetalFloat({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPetals, setShowPetals] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setShowPetals(true)
      setTimeout(() => setShowPetals(false), 1200)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 떠오르는 꽃잎 */}
      {showPetals && (
        <>
          <div className={cn(styles.petal, styles.petal1)}>🌸</div>
          <div className={cn(styles.petal, styles.petal2)}>🌸</div>
          <div className={cn(styles.petal, styles.petal3)}>🌸</div>
          <div className={cn(styles.petal, styles.petal4)}>🌸</div>
          <div className={cn(styles.petal, styles.petal5)}>🌸</div>
        </>
      )}

      {/* 부드러운 핑크 글로우 */}
      <div className={cn(
        styles.petalGlow,
        isLiked && styles.petalGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.petalPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.petalHeartBloom
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. Rainbow Shimmer - 무지개빛 일렁임
// 무지개 색이 일렁이는 효과
// ============================================

export function LikeRainbowShimmer({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 무지개 링 */}
      <div className={cn(
        styles.rainbowRing,
        isAnimating && styles.rainbowShimmer
      )} />

      {/* 무지개 글로우 */}
      <div className={cn(
        styles.rainbowGlow,
        isLiked && styles.rainbowGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.rainbowPulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
            isAnimating && styles.rainbowHeartShine
          )}
        />
      </button>

      {/* 지속 무지개 효과 */}
      {isLiked && <div className={styles.persistentRainbow} />}
    </div>
  )
}

// Export all variants
export const PhysicsLikeButtons = {
  FairyDust: LikeFairyDust,
  MagicWand: LikeMagicWand,
  SparkleBurst: LikeSparkleBurst,
  HeartGlow: LikeHeartGlow,
  CrystalShine: LikeCrystalShine,
  AuroraWave: LikeAuroraWave,
  StarTwinkle: LikeStarTwinkle,
  MoonPhase: LikeMoonPhase,
  PetalFloat: LikePetalFloat,
  RainbowShimmer: LikeRainbowShimmer,
}
