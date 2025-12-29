'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Moon,
  Sun,
  Heart,
  Star,
  Check,
  Zap,
  Palette,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { AnimationProvider, useAnimation, DOODLE_SPRING, PREMIUM_EASE } from '@/contexts/AnimationContext'
import { DoodleStars, InlineSparkle } from '@/components/ui/sparkles'
import { WordReveal, TextReveal } from '@/components/ui/text-reveal'
import { useMagnetic, useTilt, springPresets } from '@/hooks/useAdvancedInteractions'
import { useScrollReveal, useCountUp } from '@/hooks/useScrollReveal'
import { useCursorTrail, useConfetti, useSuccessPulse, useMouseGlow } from '@/hooks/useDoodleEffects'
import { cn } from '@/lib/utils/cn'

// ============================================
// 메인 데모 컨텐츠
// ============================================

function DemoContent() {
  const { mode, toggleMode, transition } = useAnimation()
  const [showModal, setShowModal] = useState(false)
  const [successTriggered, setSuccessTriggered] = useState(false)

  // 효과 훅들
  const { TrailDots } = useCursorTrail({ doodleOnly: true })
  const { trigger: triggerConfetti, ConfettiContainer } = useConfetti()
  const { trigger: triggerPulse, className: pulseClassName } = useSuccessPulse()
  const { ref: magneticRef, x: magneticX, y: magneticY } = useMagnetic({ strength: 0.3 })
  const { ref: tiltRef, rotateX, rotateY } = useTilt({ maxTilt: 8 })
  const { ref: glowRef, className: glowClassName } = useMouseGlow()

  // 성공 효과 트리거
  const handleSuccess = useCallback((e: React.MouseEvent) => {
    setSuccessTriggered(true)
    triggerConfetti(e.clientX, e.clientY)
    triggerPulse()
    setTimeout(() => setSuccessTriggered(false), 1000)
  }, [triggerConfetti, triggerPulse])

  // 현재 모드 라벨
  const modeLabel = mode === 'doodle' ? 'Organic Doodle' : 'Quantum Shimmer'
  const modeIcon = mode === 'doodle' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 커서 트레일 */}
      <TrailDots />

      {/* Confetti 컨테이너 */}
      <ConfettiContainer />

      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Animation Demo
            </h1>
            <p className="text-sm text-gray-500">
              현재 모드: <span className="font-medium text-primary-500">{modeLabel}</span>
            </p>
          </div>

          {/* 모드 토글 버튼 */}
          <motion.button
            onClick={toggleMode}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors',
              mode === 'doodle'
                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={transition.fast}
          >
            {modeIcon}
            <span>{mode === 'doodle' ? 'Premium으로' : 'Doodle로'}</span>
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">
        {/* 섹션 1: 버튼 효과 */}
        <section>
          <SectionHeader
            title="버튼 인터랙션"
            description="호버, 클릭 시 모드별 다른 피드백"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 기본 버튼 */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={transition.fast}
            >
              <Button className="w-full btn-mode">
                기본 버튼
              </Button>
            </motion.div>

            {/* Magnetic 버튼 */}
            <motion.div
              ref={magneticRef as React.RefObject<HTMLDivElement>}
              style={{ x: magneticX, y: magneticY }}
            >
              <Button className="w-full" variant="primary">
                <Zap className="w-4 h-4 mr-2" />
                Magnetic
              </Button>
            </motion.div>

            {/* 성공 버튼 */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={transition.fast}
              className={pulseClassName}
            >
              <Button
                className="w-full"
                variant="primary"
                onClick={handleSuccess}
              >
                <Check className="w-4 h-4 mr-2" />
                성공 효과
              </Button>
            </motion.div>

            {/* Rough Stroke 버튼 (Doodle) */}
            <div className="rough-stroke">
              <Button className="w-full" variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Rough Stroke
              </Button>
            </div>
          </div>
        </section>

        {/* 섹션 2: 카드 효과 */}
        <section>
          <SectionHeader
            title="카드 호버 효과"
            description="Doodle: 손그림 테두리 / Premium: 글로우 시머"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {/* 기본 카드 */}
            <motion.div
              className="card-mode bg-white rounded-2xl p-6 border shadow-sm"
              whileHover={mode === 'doodle'
                ? { y: -6, rotate: -0.5 }
                : { y: -4 }
              }
              transition={transition.default}
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">웹에서 바로 편집</h3>
              <p className="text-sm text-gray-500">
                포토샵 없이도 예쁜 결과물을 만들 수 있어요
              </p>
            </motion.div>

            {/* 3D Tilt 카드 */}
            <motion.div
              ref={tiltRef as React.RefObject<HTMLDivElement>}
              className="bg-white rounded-2xl p-6 border shadow-sm tilt-card"
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center mb-4 tilt-card-content">
                <Users className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 tilt-card-content">
                실시간 협업
              </h3>
              <p className="text-sm text-gray-500 tilt-card-content">
                친구와 함께 동시에 편집할 수 있어요
              </p>
            </motion.div>

            {/* Mouse Glow 카드 (Premium) */}
            <div
              ref={glowRef as React.RefObject<HTMLDivElement>}
              className={cn(
                'bg-white rounded-2xl p-6 border shadow-sm relative overflow-hidden',
                glowClassName
              )}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">고화질 저장</h3>
                <p className="text-sm text-gray-500">
                  완성된 작품을 PNG로 다운로드해요
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: 텍스트 효과 */}
        <section>
          <SectionHeader
            title="텍스트 애니메이션"
            description="글자 단위 등장 / 형광펜 하이라이트"
          />

          <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-8">
            {/* WordReveal */}
            <div>
              <p className="text-sm text-gray-400 mb-2">WordReveal</p>
              <h2 className="text-3xl font-bold text-gray-900">
                <WordReveal text="함께 채우는 우리만의 이야기" wordDelay={0.08} />
              </h2>
            </div>

            {/* TextReveal */}
            <div>
              <p className="text-sm text-gray-400 mb-2">TextReveal (글자 단위)</p>
              <p className="text-xl text-gray-700">
                <TextReveal text="페어리가 여러분의 이야기를 기다리고 있어요" charDelay={0.02} />
              </p>
            </div>

            {/* 하이라이터 */}
            <div>
              <p className="text-sm text-gray-400 mb-2">형광펜 하이라이트</p>
              <p className="text-lg text-gray-700">
                자캐 페어틀을{' '}
                <span className="highlighter">웹에서 바로 편집</span>
                하고, 친구와{' '}
                <span className="highlighter-accent">실시간으로 함께</span>
                {' '}완성해요.
              </p>
            </div>

            {/* Doodle 언더라인 */}
            <div>
              <p className="text-sm text-gray-400 mb-2">손그림 언더라인 (hover)</p>
              <p className="text-lg text-gray-700">
                이 문장의{' '}
                <span className="doodle-underline">중요한 부분</span>
                에 마우스를 올려보세요
              </p>
            </div>
          </div>
        </section>

        {/* 섹션 4: 스크롤 효과 */}
        <section>
          <SectionHeader
            title="스크롤 등장 효과"
            description="Doodle: 젤리 팝 / Premium: 안개 페이드"
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <ScrollRevealCard key={i} index={i} />
            ))}
          </div>
        </section>

        {/* 섹션 5: 숫자 카운터 */}
        <section>
          <SectionHeader
            title="카운터 애니메이션"
            description="스크롤 시 숫자가 롤업됨"
          />

          <div className="flex justify-center gap-16">
            <CounterDemo value={1200} label="틀 템플릿" />
            <CounterDemo value={8500} label="완성된 작품" />
            <CounterDemo value={3200} label="크리에이터" />
          </div>
        </section>

        {/* 섹션 6: 모달 */}
        <section>
          <SectionHeader
            title="모달 트랜지션"
            description="Doodle: 바운스 팝 / Premium: 블러 페이드"
          />

          <div className="flex justify-center">
            <Button onClick={() => setShowModal(true)} variant="primary" size="lg">
              모달 열기
            </Button>
          </div>

          <AnimatePresence>
            {showModal && (
              <DemoModal onClose={() => setShowModal(false)} />
            )}
          </AnimatePresence>
        </section>

        {/* 섹션 7: 별 장식 */}
        <section>
          <SectionHeader
            title="Doodle Stars 장식"
            description="손그림 스타일 별들이 배경에서 깜빡임"
          />

          <div className="relative bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-12 min-h-[200px] overflow-hidden">
            <DoodleStars count={20} />
            <div className="relative z-10 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                <InlineSparkle className="mr-2" />
                마법 같은 순간
                <InlineSparkle className="ml-2" />
              </h3>
              <p className="text-gray-600">
                배경에서 반짝이는 별들을 확인해보세요
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          Animation System Demo - Doodle vs Premium 모드 비교
        </div>
      </footer>
    </div>
  )
}

// ============================================
// 서브 컴포넌트들
// ============================================

function SectionHeader({ title, description }: { title: string; description: string }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'mb-8 scroll-reveal',
        isVisible && 'is-visible'
      )}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}

function ScrollRevealCard({ index }: { index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 })
  const icons = [Heart, Star, Sparkles]
  const Icon = icons[(index - 1) % icons.length]

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'bg-white rounded-2xl p-6 border shadow-sm scroll-reveal',
        isVisible && 'is-visible'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Icon className="w-8 h-8 text-primary-400 mb-4" />
      <h3 className="font-semibold text-gray-900 mb-2">카드 {index}</h3>
      <p className="text-sm text-gray-500">
        스크롤하면 순차적으로 나타납니다
      </p>
    </div>
  )
}

function CounterDemo({ value, label }: { value: number; label: string }) {
  const { ref, count } = useCountUp(value, { duration: 2000, easing: 'easeOut' })

  return (
    <div className="text-center">
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="text-4xl font-bold text-primary-500"
      >
        {count.toLocaleString()}+
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function DemoModal({ onClose }: { onClose: () => void }) {
  const { mode, transition } = useAnimation()

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const modalVariants = mode === 'doodle'
    ? {
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: -10 },
      }
    : {
        hidden: { opacity: 0, filter: 'blur(8px)', y: 10 },
        visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
        exit: { opacity: 0, filter: 'blur(4px)', y: -5 },
      }

  return (
    <>
      {/* 백드롭 */}
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />

      {/* 모달 */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={mode === 'doodle' ? DOODLE_SPRING.wobble : PREMIUM_EASE.smooth}
      >
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl pointer-events-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {mode === 'doodle' ? '🎨 Doodle 모달' : '✨ Premium 모달'}
          </h3>
          <p className="text-gray-600 mb-6">
            {mode === 'doodle'
              ? '쫀득하게 튀어나오는 Spring 애니메이션'
              : '안개 속에서 선명해지는 Ease 애니메이션'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button variant="primary" onClick={onClose} className="flex-1">
              확인
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ============================================
// 메인 컴포넌트 (Provider 래핑)
// ============================================

export default function AnimationDemoClient() {
  return (
    <AnimationProvider defaultMode="doodle">
      <DemoContent />
    </AnimationProvider>
  )
}
