'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Heart Pump - 진짜 심장 펌핑
// 수축 시 옆으로 퍼지고, 이완 시 위로 솟고, 맥박 파동 생성
// ============================================

export function LikeHeartPump({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPulse, setShowPulse] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      // 맥박 파동 생성
      setTimeout(() => setShowPulse(true), 150)
      setTimeout(() => setShowPulse(false), 800)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div
      ref={containerRef}
      className={cn(styles.physicsButtonContainer, className)}
      onClick={handleClick}
    >
      {/* 맥박 파동 레이어 */}
      <div className={cn(
        styles.pulseRing,
        showPulse && styles.pulseRingActive
      )} />
      <div className={cn(
        styles.pulseRing,
        styles.pulseRingDelay,
        showPulse && styles.pulseRingActive
      )} />

      {/* 그림자 레이어 - 눌림에 반응 */}
      <div className={cn(
        styles.buttonShadow,
        isAnimating && styles.shadowSquish
      )} />

      {/* 메인 버튼 */}
      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.heartPumpAnim
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.heartIconPump
          )}
        />
      </button>

      {/* 활성화 시 지속 맥박 */}
      {isLiked && !isAnimating && (
        <div className={styles.heartbeatGlow} />
      )}
    </div>
  )
}

// ============================================
// 2. Stamp Press - 도장 찍기
// 낙하 가속 → 충돌 시 찌그러짐 → 잉크 퍼짐
// ============================================

export function LikeStampPress({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showInk, setShowInk] = useState(false)
  const [impactPhase, setImpactPhase] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      // 충돌 시점에 잉크 퍼짐
      setTimeout(() => {
        setImpactPhase(true)
        setShowInk(true)
      }, 200)
      setTimeout(() => setImpactPhase(false), 400)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 잉크 퍼짐 레이어들 */}
      <div className={cn(
        styles.inkSplat,
        styles.inkSplat1,
        showInk && styles.inkSplatActive
      )} />
      <div className={cn(
        styles.inkSplat,
        styles.inkSplat2,
        showInk && styles.inkSplatActive
      )} />
      <div className={cn(
        styles.inkSplat,
        styles.inkSplat3,
        showInk && styles.inkSplatActive
      )} />

      {/* 충돌 파동 */}
      <div className={cn(
        styles.impactRipple,
        impactPhase && styles.impactRippleActive
      )} />

      {/* 메인 버튼 */}
      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.stampFallAnim
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.stampIconSquish
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. Toggle Switch - 토글 스위치
// 저항 → 스냅 오버 → 오버슈트 정착
// ============================================

export function LikeToggleSwitch({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [resistance, setResistance] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    // 저항 페이즈
    setResistance(true)
    setTimeout(() => {
      setResistance(false)
      setIsLiked(!isLiked)
    }, 100)

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 스위치 트랙 */}
      <div className={cn(
        styles.switchTrack,
        isLiked && styles.switchTrackOn
      )}>
        {/* 스위치 노브 */}
        <div className={cn(
          styles.switchKnob,
          isLiked && styles.switchKnobOn,
          resistance && styles.switchResistance,
          isAnimating && !resistance && styles.switchSnap
        )} />
      </div>

      {/* 아이콘 */}
      <button className={cn(
        styles.physicsButton,
        styles.switchButton,
        isAnimating && styles.switchClickFeedback
      )}>
        <Heart
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. Lock Click - 자물쇠 잠금
// 걸쇠 회전 → 금속 충돌 진동 → 잠금 확정
// ============================================

export function LikeLockClick({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [metalVibrate, setMetalVibrate] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      // 잠금 시 금속 진동
      setTimeout(() => setMetalVibrate(true), 200)
      setTimeout(() => setMetalVibrate(false), 400)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 금속 광택 플래시 */}
      <div className={cn(
        styles.metalFlash,
        metalVibrate && styles.metalFlashActive
      )} />

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.lockRotateAnim,
        metalVibrate && styles.metalVibrate
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.lockIconClamp
          )}
        />
      </button>

      {/* 잠금 표시 */}
      {isLiked && (
        <div className={styles.lockIndicator} />
      )}
    </div>
  )
}

// ============================================
// 5. Dial Turn - 다이얼 회전
// 노치 회전 → 관성으로 오버슈트 → 정착
// ============================================

export function LikeDialTurn({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [notchClick, setNotchClick] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    // 노치 클릭 피드백
    setTimeout(() => setNotchClick(true), 150)
    setTimeout(() => setNotchClick(false), 250)
    setTimeout(() => setNotchClick(true), 300)
    setTimeout(() => setNotchClick(false), 400)

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 다이얼 틱 마크 */}
      <div className={cn(
        styles.dialTicks,
        isLiked && styles.dialTicksActive
      )}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={styles.dialTick}
            style={{ transform: `rotate(${i * 45}deg)` }}
          />
        ))}
      </div>

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.dialSpinAnim,
        notchClick && styles.dialNotchClick
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.dialIconSpin
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. Button Depress - 기계식 버튼
// 눌림 저항 → 바닥 찍힘 → 스프링 반동 오버슈트
// ============================================

export function LikeButtonDepress({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsPressed(true)

    setTimeout(() => {
      setIsPressed(false)
      setIsLiked(!isLiked)
    }, 150)

    setTimeout(() => setIsAnimating(false), 550)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 버튼 베이스 (고정) */}
      <div className={styles.mechanicalBase} />

      {/* 버튼 바디 (움직임) */}
      <button className={cn(
        styles.mechanicalBody,
        isPressed && styles.mechanicalPressed,
        isAnimating && !isPressed && styles.mechanicalSpringBack
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.mechanicalIconBounce
          )}
        />
      </button>

      {/* 눌림 그림자 */}
      <div className={cn(
        styles.pressureShadow,
        isPressed && styles.pressureShadowPressed
      )} />
    </div>
  )
}

// ============================================
// 7. Valve Release - 밸브 해제
// 회전 저항 → 해제 시 압력 분출 → 증기 효과
// ============================================

export function LikeValveRelease({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [steamBurst, setSteamBurst] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      setTimeout(() => setSteamBurst(true), 300)
      setTimeout(() => setSteamBurst(false), 1000)
    }

    setTimeout(() => setIsAnimating(false), 900)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 증기 파티클 */}
      {steamBurst && (
        <>
          <div className={cn(styles.steamParticle, styles.steam1)} />
          <div className={cn(styles.steamParticle, styles.steam2)} />
          <div className={cn(styles.steamParticle, styles.steam3)} />
          <div className={cn(styles.steamParticle, styles.steam4)} />
          <div className={cn(styles.steamParticle, styles.steam5)} />
        </>
      )}

      {/* 압력 게이지 배경 */}
      <div className={cn(
        styles.pressureGauge,
        isLiked && styles.pressureReleased
      )} />

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.valveTurnAnim
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            steamBurst && styles.valveIconRelease
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. Magnet Snap - 자석 끌림
// 느린 시작 → 가속 끌림 → 충돌 진동 → 붙음
// ============================================

export function LikeMagnetSnap({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [magnetPhase, setMagnetPhase] = useState<'idle' | 'attract' | 'impact' | 'stuck'>('idle')

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked

    if (newLiked) {
      setMagnetPhase('attract')
      setTimeout(() => setMagnetPhase('impact'), 350)
      setTimeout(() => {
        setMagnetPhase('stuck')
        setIsLiked(true)
      }, 450)
    } else {
      setMagnetPhase('idle')
      setIsLiked(false)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 자기장 라인 */}
      <div className={cn(
        styles.magnetField,
        magnetPhase === 'attract' && styles.magnetFieldActive
      )}>
        <div className={styles.fieldLine} />
        <div className={styles.fieldLine} />
        <div className={styles.fieldLine} />
      </div>

      {/* 충돌 스파크 */}
      {magnetPhase === 'impact' && (
        <div className={styles.magnetSpark} />
      )}

      <button className={cn(
        styles.physicsButton,
        magnetPhase === 'attract' && styles.magnetAttract,
        magnetPhase === 'impact' && styles.magnetImpact,
        magnetPhase === 'stuck' && styles.magnetStuck
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. Gauge Fill - 게이지 충전
// 바늘 스윙 → 관성 오버슈트 → 오실레이션 → 정착
// ============================================

export function LikeGaugeFill({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fillLevel, setFillLevel] = useState(0)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      // 점진적 채움 애니메이션
      let level = 0
      const interval = setInterval(() => {
        level += 10
        setFillLevel(level)
        if (level >= 100) clearInterval(interval)
      }, 50)
    } else {
      setFillLevel(0)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 게이지 배경 */}
      <div className={styles.gaugeBackground}>
        <div
          className={styles.gaugeFillBar}
          style={{ width: `${fillLevel}%` }}
        />
      </div>

      {/* 게이지 바늘 */}
      <div className={cn(
        styles.gaugeNeedle,
        isAnimating && styles.needleSwing
      )} style={{
        transform: `rotate(${isLiked ? 90 : -90}deg)`
      }} />

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.gaugePulse
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            isAnimating && styles.gaugeIconFill
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. Capsule Pop - 캡슐 열림
// 압력 빌드업 → 팝 폭발 → 내용물 분출
// ============================================

export function LikeCapsulePop({ className }: PhysicsButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pressure, setPressure] = useState(0)
  const [popped, setPopped] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked) {
      // 압력 빌드업
      let p = 0
      const interval = setInterval(() => {
        p += 20
        setPressure(p)
        if (p >= 100) {
          clearInterval(interval)
          setPopped(true)
          setTimeout(() => setPopped(false), 500)
        }
      }, 40)
    } else {
      setPressure(0)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div className={cn(styles.physicsButtonContainer, className)} onClick={handleClick}>
      {/* 폭발 파티클 */}
      {popped && (
        <>
          <div className={cn(styles.popParticle, styles.pop1)} />
          <div className={cn(styles.popParticle, styles.pop2)} />
          <div className={cn(styles.popParticle, styles.pop3)} />
          <div className={cn(styles.popParticle, styles.pop4)} />
          <div className={cn(styles.popParticle, styles.pop5)} />
          <div className={cn(styles.popParticle, styles.pop6)} />
        </>
      )}

      {/* 압력 표시 링 */}
      <div
        className={styles.pressureRing}
        style={{
          transform: `scale(${1 + pressure * 0.003})`,
          opacity: pressure > 0 ? 0.5 + pressure * 0.005 : 0
        }}
      />

      <button className={cn(
        styles.physicsButton,
        isAnimating && styles.capsulePressure,
        popped && styles.capsuleExplode
      )}>
        <Heart
          className={cn(
            'w-6 h-6 transition-colors duration-200',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400',
            popped && styles.capsuleIconPop
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
