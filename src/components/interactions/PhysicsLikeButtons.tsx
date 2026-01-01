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

// ============================================
// 11. Nebula Swirl - 성운 소용돌이
// 우주 성운처럼 빛이 소용돌이치며 퍼짐
// ============================================

export function LikeNebulaSwirl({ className }: PhysicsButtonProps) {
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
      {/* 성운 소용돌이 레이어 */}
      <div className={cn(
        styles.nebulaSwirl,
        isAnimating && styles.nebulaSwirlActive
      )} />
      <div className={cn(
        styles.nebulaCore,
        isLiked && styles.nebulaCoreActive
      )} />

      <button className={cn(styles.magicButton, isAnimating && styles.nebulaPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.nebulaHeartSpin
        )} />
      </button>
    </div>
  )
}

// ============================================
// 12. Pixie Trail - 픽시 자취
// 작은 요정이 지나간 듯한 반짝이는 자취
// ============================================

export function LikePixieTrail({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showTrail, setShowTrail] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowTrail(true)
      setTimeout(() => setShowTrail(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showTrail && (
        <>
          <div className={cn(styles.pixieTrail, styles.pixie1)} />
          <div className={cn(styles.pixieTrail, styles.pixie2)} />
          <div className={cn(styles.pixieTrail, styles.pixie3)} />
          <div className={cn(styles.pixieTrail, styles.pixie4)} />
          <div className={cn(styles.pixieTrail, styles.pixie5)} />
          <div className={cn(styles.pixieTrail, styles.pixie6)} />
        </>
      )}
      <div className={cn(styles.pixieGlow, isLiked && styles.pixieGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.pixiePulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.pixieHeartDance
        )} />
      </button>
    </div>
  )
}

// ============================================
// 13. Enchanted Bubble - 마법 버블
// 투명한 마법 버블이 떠오름
// ============================================

export function LikeEnchantedBubble({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowBubbles(true)
      setTimeout(() => setShowBubbles(false), 1200)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showBubbles && (
        <>
          <div className={cn(styles.magicBubble, styles.bubble1)} />
          <div className={cn(styles.magicBubble, styles.bubble2)} />
          <div className={cn(styles.magicBubble, styles.bubble3)} />
          <div className={cn(styles.magicBubble, styles.bubble4)} />
          <div className={cn(styles.magicBubble, styles.bubble5)} />
        </>
      )}

      <button className={cn(styles.magicButton, isAnimating && styles.bubblePulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.bubbleHeartFloat
        )} />
      </button>
    </div>
  )
}

// ============================================
// 14. Stardust Cascade - 별가루 폭포
// 위에서 별가루가 폭포처럼 쏟아짐
// ============================================

export function LikeStardustCascade({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCascade, setShowCascade] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowCascade(true)
      setTimeout(() => setShowCascade(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showCascade && (
        <div className={styles.cascadeContainer}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className={styles.cascadeStar} style={{
              '--delay': `${i * 0.05}s`,
              '--x': `${(i % 4) * 25 - 37.5}%`
            } as React.CSSProperties}>✦</div>
          ))}
        </div>
      )}
      <div className={cn(styles.cascadeGlow, isLiked && styles.cascadeGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.cascadePulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.cascadeHeartRise
        )} />
      </button>
    </div>
  )
}

// ============================================
// 15. Fairy Ring - 요정의 원
// 마법의 원이 하트를 감싸며 회전
// ============================================

export function LikeFairyRing({ className }: PhysicsButtonProps) {
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
      <div className={cn(
        styles.fairyRingOuter,
        isAnimating && styles.fairyRingRotate
      )}>
        <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
      </div>
      <div className={cn(
        styles.fairyRingInner,
        isAnimating && styles.fairyRingRotateReverse
      )}>
        <span>·</span><span>·</span><span>·</span><span>·</span>
      </div>
      <div className={cn(styles.fairyRingGlow, isLiked && styles.fairyRingGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.fairyRingPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.fairyRingHeartGlow
        )} />
      </button>
    </div>
  )
}

// ============================================
// 16. Celestial Bloom - 천상의 꽃
// 빛으로 된 꽃이 피어나는 효과
// ============================================

export function LikeCelestialBloom({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showBloom, setShowBloom] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowBloom(true)
      setTimeout(() => setShowBloom(false), 800)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showBloom && (
        <div className={styles.celestialBloom}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.celestialPetal} style={{
              transform: `rotate(${i * 60}deg)`
            }} />
          ))}
        </div>
      )}
      <div className={cn(styles.celestialGlow, isLiked && styles.celestialGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.celestialPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.celestialHeartBloom
        )} />
      </button>
    </div>
  )
}

// ============================================
// 17. Mystic Mist - 신비로운 안개
// 부드러운 안개가 피어오름
// ============================================

export function LikeMysticMist({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 1000)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.mysticMist, styles.mist1, isAnimating && styles.mistRise)} />
      <div className={cn(styles.mysticMist, styles.mist2, isAnimating && styles.mistRise)} />
      <div className={cn(styles.mysticMist, styles.mist3, isAnimating && styles.mistRise)} />
      <div className={cn(styles.mistGlow, isLiked && styles.mistGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.mistPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.mistHeartFade
        )} />
      </button>
    </div>
  )
}

// ============================================
// 18. Diamond Sparkle - 다이아몬드 반짝임
// 다이아몬드처럼 날카로운 빛 반사
// ============================================

export function LikeDiamondSparkle({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowSparkles(true)
      setTimeout(() => setShowSparkles(false), 600)
    }
    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showSparkles && (
        <>
          <div className={cn(styles.diamondSparkle, styles.diamond1)}>✧</div>
          <div className={cn(styles.diamondSparkle, styles.diamond2)}>✧</div>
          <div className={cn(styles.diamondSparkle, styles.diamond3)}>✧</div>
          <div className={cn(styles.diamondSparkle, styles.diamond4)}>✧</div>
        </>
      )}
      <div className={cn(styles.diamondGlow, isLiked && styles.diamondGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.diamondPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.diamondHeartShine
        )} />
      </button>
    </div>
  )
}

// ============================================
// 19. Comet Tail - 혜성 꼬리
// 혜성처럼 빛의 꼬리가 휘돌아감
// ============================================

export function LikeCometTail({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.cometTail, isAnimating && styles.cometTailActive)} />
      <div className={cn(styles.cometHead, isAnimating && styles.cometHeadActive)} />
      <div className={cn(styles.cometGlow, isLiked && styles.cometGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.cometPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.cometHeartStreak
        )} />
      </button>
    </div>
  )
}

// ============================================
// 20. Moonbeam - 달빛 광선
// 부드러운 달빛 광선이 내려옴
// ============================================

export function LikeMoonbeam({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showBeams, setShowBeams] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowBeams(true)
      setTimeout(() => setShowBeams(false), 800)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showBeams && (
        <div className={styles.moonbeamContainer}>
          <div className={cn(styles.moonbeam, styles.beam1)} />
          <div className={cn(styles.moonbeam, styles.beam2)} />
          <div className={cn(styles.moonbeam, styles.beam3)} />
        </div>
      )}
      <div className={cn(styles.moonbeamGlow, isLiked && styles.moonbeamGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.moonbeamPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.moonbeamHeartGlow
        )} />
      </button>
    </div>
  )
}

// ============================================
// 21. Enchanted Forest - 마법의 숲
// 숲의 정령처럼 초록빛 마법
// ============================================

export function LikeEnchantedForest({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLeaves, setShowLeaves] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowLeaves(true)
      setTimeout(() => setShowLeaves(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showLeaves && (
        <>
          <div className={cn(styles.forestLeaf, styles.leaf1)}>🍃</div>
          <div className={cn(styles.forestLeaf, styles.leaf2)}>🌿</div>
          <div className={cn(styles.forestLeaf, styles.leaf3)}>🍃</div>
          <div className={cn(styles.forestLeaf, styles.leaf4)}>🌿</div>
        </>
      )}
      <div className={cn(styles.forestGlow, isLiked && styles.forestGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.forestPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.forestHeartGrow
        )} />
      </button>
    </div>
  )
}

// ============================================
// 22. Glitter Storm - 글리터 폭풍
// 반짝이 조각들이 휘몰아침
// ============================================

export function LikeGlitterStorm({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showGlitter, setShowGlitter] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowGlitter(true)
      setTimeout(() => setShowGlitter(false), 900)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showGlitter && (
        <div className={styles.glitterStorm}>
          {[...Array(15)].map((_, i) => (
            <div key={i} className={styles.glitterPiece} style={{
              '--angle': `${i * 24}deg`,
              '--delay': `${i * 0.03}s`,
              '--distance': `${20 + (i % 3) * 10}px`
            } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className={cn(styles.glitterGlow, isLiked && styles.glitterGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.glitterPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.glitterHeartShine
        )} />
      </button>
    </div>
  )
}

// ============================================
// 23. Fairy Whisper - 요정의 속삭임
// 작은 요정 날개와 속삭이는 빛
// ============================================

export function LikeFairyWhisper({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.whisperWing, styles.wingLeft, isAnimating && styles.wingFlutter)} />
      <div className={cn(styles.whisperWing, styles.wingRight, isAnimating && styles.wingFlutter)} />
      <div className={cn(styles.whisperGlow, isLiked && styles.whisperGlowActive)} />
      {isAnimating && <div className={styles.whisperSparkles}>✨</div>}

      <button className={cn(styles.magicButton, isAnimating && styles.whisperPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.whisperHeartFloat
        )} />
      </button>
    </div>
  )
}

// ============================================
// 24. Starlight Cascade - 별빛 캐스케이드
// 계단식으로 쏟아지는 별빛
// ============================================

export function LikeStarlightCascade({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCascade, setShowCascade] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowCascade(true)
      setTimeout(() => setShowCascade(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showCascade && (
        <div className={styles.starlightCascade}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.starlightStep} style={{
              '--step': i,
              '--delay': `${i * 0.08}s`
            } as React.CSSProperties}>★</div>
          ))}
        </div>
      )}
      <div className={cn(styles.starlightGlow, isLiked && styles.starlightGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.starlightPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.starlightHeartShine
        )} />
      </button>
    </div>
  )
}

// ============================================
// 25. Magic Mirror - 마법 거울
// 거울에 반사되듯 대칭 빛 효과
// ============================================

export function LikeMagicMirror({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.mirrorReflect, styles.reflectTop, isAnimating && styles.reflectActive)} />
      <div className={cn(styles.mirrorReflect, styles.reflectBottom, isAnimating && styles.reflectActive)} />
      <div className={cn(styles.mirrorFrame, isAnimating && styles.mirrorFrameGlow)} />
      <div className={cn(styles.mirrorGlow, isLiked && styles.mirrorGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.mirrorPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.mirrorHeartReflect
        )} />
      </button>
    </div>
  )
}

// ============================================
// 26. Dreamlight - 꿈빛
// 몽환적인 빛이 물결침
// ============================================

export function LikeDreamlight({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.dreamWave, styles.wave1, isAnimating && styles.dreamWaveActive)} />
      <div className={cn(styles.dreamWave, styles.wave2, isAnimating && styles.dreamWaveActive)} />
      <div className={cn(styles.dreamWave, styles.wave3, isAnimating && styles.dreamWaveActive)} />
      <div className={cn(styles.dreamGlow, isLiked && styles.dreamGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.dreamPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.dreamHeartFloat
        )} />
      </button>
    </div>
  )
}

// ============================================
// 27. Sunburst - 태양광 폭발
// 태양처럼 따뜻한 빛이 폭발
// ============================================

export function LikeSunburst({ className }: PhysicsButtonProps) {
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
      setTimeout(() => setShowBurst(false), 700)
    }
    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showBurst && (
        <div className={styles.sunburstRays}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className={styles.sunRay} style={{
              transform: `rotate(${i * 30}deg)`
            }} />
          ))}
        </div>
      )}
      <div className={cn(styles.sunCore, isAnimating && styles.sunCoreActive)} />
      <div className={cn(styles.sunGlow, isLiked && styles.sunGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.sunPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.sunHeartRadiate
        )} />
      </button>
    </div>
  )
}

// ============================================
// 28. Crystal Garden - 크리스탈 정원
// 크리스탈 꽃이 피어나는 효과
// ============================================

export function LikeCrystalGarden({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCrystals, setShowCrystals] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    if (newLiked) {
      setShowCrystals(true)
      setTimeout(() => setShowCrystals(false), 900)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showCrystals && (
        <div className={styles.crystalGarden}>
          <div className={cn(styles.crystalFlower, styles.crystal1)}>💎</div>
          <div className={cn(styles.crystalFlower, styles.crystal2)}>💎</div>
          <div className={cn(styles.crystalFlower, styles.crystal3)}>💎</div>
          <div className={cn(styles.crystalFlower, styles.crystal4)}>💎</div>
          <div className={cn(styles.crystalFlower, styles.crystal5)}>💎</div>
        </div>
      )}
      <div className={cn(styles.gardenGlow, isLiked && styles.gardenGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.gardenPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.gardenHeartBloom
        )} />
      </button>
    </div>
  )
}

// ============================================
// 29. Cosmic Love - 우주적 사랑
// 은하수처럼 빛이 휘감음
// ============================================

export function LikeCosmicLove({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsLiked(!isLiked)
    setTimeout(() => setIsAnimating(false), 1000)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.cosmicSpiral, isAnimating && styles.cosmicSpiralActive)} />
      <div className={cn(styles.cosmicStars, isAnimating && styles.cosmicStarsActive)}>
        <span>✦</span><span>✧</span><span>✦</span>
      </div>
      <div className={cn(styles.cosmicGlow, isLiked && styles.cosmicGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.cosmicPulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.cosmicHeartOrbit
        )} />
      </button>
    </div>
  )
}

// ============================================
// 30. Eternal Flame - 영원한 불꽃
// 따뜻한 마법 불꽃이 타오름
// ============================================

export function LikeEternalFlame({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.eternalFlame, styles.flame1, isAnimating && styles.flameActive)} />
      <div className={cn(styles.eternalFlame, styles.flame2, isAnimating && styles.flameActive)} />
      <div className={cn(styles.eternalFlame, styles.flame3, isAnimating && styles.flameActive)} />
      <div className={cn(styles.flameGlow, isLiked && styles.flameGlowActive)} />
      {isLiked && <div className={styles.flamePersist} />}

      <button className={cn(styles.magicButton, isAnimating && styles.flamePulse)}>
        <Heart className={cn(
          'w-6 h-6 transition-all duration-300',
          isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400',
          isAnimating && styles.flameHeartBurn
        )} />
      </button>
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
  // New 20 buttons (11-30)
  NebulaSwirl: LikeNebulaSwirl,
  PixieTrail: LikePixieTrail,
  EnchantedBubble: LikeEnchantedBubble,
  StardustCascade: LikeStardustCascade,
  FairyRing: LikeFairyRing,
  CelestialBloom: LikeCelestialBloom,
  MysticMist: LikeMysticMist,
  DiamondSparkle: LikeDiamondSparkle,
  CometTail: LikeCometTail,
  Moonbeam: LikeMoonbeam,
  EnchantedForest: LikeEnchantedForest,
  GlitterStorm: LikeGlitterStorm,
  FairyWhisper: LikeFairyWhisper,
  StarlightCascade: LikeStarlightCascade,
  MagicMirror: LikeMagicMirror,
  Dreamlight: LikeDreamlight,
  Sunburst: LikeSunburst,
  CrystalGarden: LikeCrystalGarden,
  CosmicLove: LikeCosmicLove,
  EternalFlame: LikeEternalFlame,
}
