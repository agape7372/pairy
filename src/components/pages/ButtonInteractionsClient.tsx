'use client'

import { useState } from 'react'
import { Heart, Bookmark, Sparkles } from 'lucide-react'

// 좋아요 버튼 variants
import {
  LikeStarBurst,
  LikeHeartFountain,
  LikeSparkleTrail,
  LikeBubblePop,
  LikeRibbonWave,
  LikeBounceJump,
  LikeScalePulse,
  LikeRotationSpin,
  LikeSliceParticle,
  LikeWaveRing,
  LikeFlowerBloom,
  LikeSnowflake,
  LikeConfettiShower,
  LikeSpringBounce,
  LikeMagicDust,
} from '@/components/interactions/LikeButtonVariants'

// 북마크 버튼 variants
import {
  BookmarkPageFold,
  BookmarkStamp,
  BookmarkRibbonTie,
  BookmarkFlagWave,
  BookmarkPaperClip,
  BookmarkStarMark,
  BookmarkHighlight,
  BookmarkAnchorDrop,
  BookmarkPinDrop,
  BookmarkTape,
  BookmarkSealStamp,
  BookmarkSticker,
  BookmarkShootingStar,
  BookmarkInkDrop,
  BookmarkMagicLink,
} from '@/components/interactions/BookmarkButtonVariants'

interface ButtonCardProps {
  name: string
  description: string
  children: React.ReactNode
}

function ButtonCard({ name, description, children }: ButtonCardProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 h-16 flex items-center justify-center">
        {children}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-xs text-gray-500 text-center">{description}</p>
    </div>
  )
}

const likeButtons = [
  { name: 'Star Burst', description: '4점 별 방사형 폭발', Component: LikeStarBurst },
  { name: 'Heart Fountain', description: '하트 분수 효과', Component: LikeHeartFountain },
  { name: 'Sparkle Trail', description: '반짝이 회전 잔상', Component: LikeSparkleTrail },
  { name: 'Bubble Pop', description: '거품 팝 효과', Component: LikeBubblePop },
  { name: 'Ribbon Wave', description: '리본 물결', Component: LikeRibbonWave },
  { name: 'Bounce Jump', description: '통통 튀는 점프', Component: LikeBounceJump },
  { name: 'Scale Pulse', description: '펄스 파동', Component: LikeScalePulse },
  { name: 'Rotation Spin', description: '별 궤도 회전', Component: LikeRotationSpin },
  { name: 'Slice Particle', description: '조각 폭발', Component: LikeSliceParticle },
  { name: 'Wave Ring', description: '동심원 파동', Component: LikeWaveRing },
  { name: 'Flower Bloom', description: '꽃잎 피어남', Component: LikeFlowerBloom },
  { name: 'Snowflake', description: '눈결정 흩날림', Component: LikeSnowflake },
  { name: 'Confetti Shower', description: '색종이 샤워', Component: LikeConfettiShower },
  { name: 'Spring Bounce', description: '스프링 바운스', Component: LikeSpringBounce },
  { name: 'Magic Dust', description: '마법 가루', Component: LikeMagicDust },
]

const bookmarkButtons = [
  { name: 'Page Fold', description: '종이 접힘 효과', Component: BookmarkPageFold },
  { name: 'Stamp', description: '쿵 스탬프', Component: BookmarkStamp },
  { name: 'Ribbon Tie', description: '리본 묶기', Component: BookmarkRibbonTie },
  { name: 'Flag Wave', description: '깃발 펄럭임', Component: BookmarkFlagWave },
  { name: 'Paper Clip', description: '클립 끼우기', Component: BookmarkPaperClip },
  { name: 'Star Mark', description: '별 마크', Component: BookmarkStarMark },
  { name: 'Highlight', description: '형광펜 칠하기', Component: BookmarkHighlight },
  { name: 'Anchor Drop', description: '닻 내리기', Component: BookmarkAnchorDrop },
  { name: 'Pin Drop', description: '핀 꽂기', Component: BookmarkPinDrop },
  { name: 'Tape', description: '테이프 붙이기', Component: BookmarkTape },
  { name: 'Seal Stamp', description: '왁스 도장', Component: BookmarkSealStamp },
  { name: 'Sticker', description: '스티커 붙이기', Component: BookmarkSticker },
  { name: 'Shooting Star', description: '별똥별 효과', Component: BookmarkShootingStar },
  { name: 'Ink Drop', description: '잉크 번짐', Component: BookmarkInkDrop },
  { name: 'Magic Link', description: '체인 연결', Component: BookmarkMagicLink },
]

export default function ButtonInteractionsClient() {
  const [activeTab, setActiveTab] = useState<'like' | 'bookmark' | 'all'>('all')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-pink-100 to-amber-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                버튼 인터랙션 데모
              </h1>
              <p className="text-sm text-gray-500">
                yui540 스타일 - 키치하고 귀여운 클릭 반응
              </p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 (30)
            </button>
            <button
              onClick={() => setActiveTab('like')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'like'
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              좋아요 (15)
            </button>
            <button
              onClick={() => setActiveTab('bookmark')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'bookmark'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              북마크 (15)
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 좋아요 섹션 */}
        {(activeTab === 'all' || activeTab === 'like') && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-bold text-gray-900">좋아요 버튼</h2>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">
                15개
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {likeButtons.map(({ name, description, Component }) => (
                <ButtonCard key={name} name={name} description={description}>
                  <Component />
                </ButtonCard>
              ))}
            </div>
          </section>
        )}

        {/* 북마크 섹션 */}
        {(activeTab === 'all' || activeTab === 'bookmark') && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">북마크 버튼</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                15개
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bookmarkButtons.map(({ name, description, Component }) => (
                <ButtonCard key={name} name={name} description={description}>
                  <Component />
                </ButtonCard>
              ))}
            </div>
          </section>
        )}

        {/* 사용법 안내 */}
        <section className="bg-gradient-to-br from-pink-50 to-amber-50 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">사용법</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 font-bold text-xs">1</span>
              </div>
              <p>각 버튼을 클릭하면 해당 인터랙션 효과를 확인할 수 있습니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 font-bold text-xs">2</span>
              </div>
              <p>버튼을 다시 클릭하면 상태가 토글되고, 활성화 시에만 파티클 효과가 나타납니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 font-bold text-xs">3</span>
              </div>
              <p>모든 효과는 CSS 애니메이션 기반으로 GPU 가속을 활용합니다.</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/60 rounded-xl">
            <p className="text-xs text-gray-500 font-mono">
              컴포넌트 경로: <span className="text-pink-600">@/components/interactions/LikeButtonVariants</span><br />
              <span className="text-gray-400 ml-[5.5rem]">@/components/interactions/BookmarkButtonVariants</span>
            </p>
          </div>
        </section>

        {/* 크레딧 */}
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>
            Inspired by{' '}
            <a
              href="https://yui540.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:underline"
            >
              yui540
            </a>
            {' '}• CSS 애니메이션 전문가
          </p>
        </footer>
      </main>
    </div>
  )
}
