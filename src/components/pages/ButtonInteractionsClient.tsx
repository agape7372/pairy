'use client'

import { useState } from 'react'
import { Heart, Bookmark, Sparkles } from 'lucide-react'

// 좋아요 버튼 variants (1-15)
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
  // 16-45
  LikeHeartJiggle,
  LikeFloatUp,
  LikeFunkyPulse,
  LikeTwist,
  LikeDrumBeat,
  LikeSwing,
  LikeRubberBand,
  LikeTumble,
  LikeBubblePop2,
  LikeSlideIn,
  LikePartyPop,
  LikeWave2,
  LikeSpiral,
  LikeFlip,
  LikeSquish,
  LikeHeartFloat,
  LikePulsate,
  LikeShake,
  LikeTada,
  LikeHeartbeat,
  LikeBounce2,
  LikeFlash,
  LikeZoomIn,
  LikeRotateIn,
  LikeSlideUp,
  LikeExpandContract,
  LikeGlowPulse,
  LikeSpinPop,
  LikeJellyWobble,
  LikeBreathe,
} from '@/components/interactions/LikeButtonVariants'

// 북마크 버튼 variants (1-15)
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
  // 16-45
  BookmarkFoldPop,
  BookmarkTabFlip,
  BookmarkMarkerDrop,
  BookmarkLabelSwing,
  BookmarkBookOpen,
  BookmarkNoteFlip,
  BookmarkTagWiggle,
  BookmarkCardPop,
  BookmarkClipSwing,
  BookmarkPinBounce,
  BookmarkSaveSlide,
  BookmarkMarkPush,
  BookmarkFlagRaise,
  BookmarkRibbonTwist,
  BookmarkGlow,
  BookmarkPageTurn,
  BookmarkTabSlide,
  BookmarkCornerFold,
  BookmarkStampPress,
  BookmarkSealMark,
  BookmarkClipAttach,
  BookmarkPaperPush,
  BookmarkFoldReveal,
  BookmarkTagDangle,
  BookmarkRibbonWrap,
  BookmarkArchiveDrop,
  BookmarkIndexSlide,
  BookmarkNotchClick,
  BookmarkCornerPeel,
  BookmarkFloat,
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
  // 1-15
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
  // 16-45
  { name: 'Heart Jiggle', description: '하트 흔들흔들', Component: LikeHeartJiggle },
  { name: 'Float Up', description: '둥실 떠오름', Component: LikeFloatUp },
  { name: 'Funky Pulse', description: '펑키 펄스', Component: LikeFunkyPulse },
  { name: 'Twist', description: '비틀기 회전', Component: LikeTwist },
  { name: 'Drum Beat', description: '드럼 비트', Component: LikeDrumBeat },
  { name: 'Swing', description: '스윙 흔들림', Component: LikeSwing },
  { name: 'Rubber Band', description: '고무줄 탄성', Component: LikeRubberBand },
  { name: 'Tumble', description: '뒹굴뒹굴', Component: LikeTumble },
  { name: 'Bubble Pop 2', description: '버블팝 변형', Component: LikeBubblePop2 },
  { name: 'Slide In', description: '슬라이드 인', Component: LikeSlideIn },
  { name: 'Party Pop', description: '파티 팝', Component: LikePartyPop },
  { name: 'Wave 2', description: '웨이브 변형', Component: LikeWave2 },
  { name: 'Spiral', description: '나선 회전', Component: LikeSpiral },
  { name: 'Flip', description: '뒤집기', Component: LikeFlip },
  { name: 'Squish', description: '찌그러짐', Component: LikeSquish },
  { name: 'Heart Float', description: '하트 부유', Component: LikeHeartFloat },
  { name: 'Pulsate', description: '맥동 효과', Component: LikePulsate },
  { name: 'Shake', description: '흔들흔들', Component: LikeShake },
  { name: 'Tada', description: '짜잔 효과', Component: LikeTada },
  { name: 'Heartbeat', description: '심장박동', Component: LikeHeartbeat },
  { name: 'Bounce 2', description: '바운스 변형', Component: LikeBounce2 },
  { name: 'Flash', description: '번쩍 플래시', Component: LikeFlash },
  { name: 'Zoom In', description: '줌인 효과', Component: LikeZoomIn },
  { name: 'Rotate In', description: '회전 등장', Component: LikeRotateIn },
  { name: 'Slide Up', description: '슬라이드 업', Component: LikeSlideUp },
  { name: 'Expand Contract', description: '확장 수축', Component: LikeExpandContract },
  { name: 'Glow Pulse', description: '발광 펄스', Component: LikeGlowPulse },
  { name: 'Spin Pop', description: '스핀 팝', Component: LikeSpinPop },
  { name: 'Jelly Wobble', description: '젤리 흔들림', Component: LikeJellyWobble },
  { name: 'Breathe', description: '숨쉬기 효과', Component: LikeBreathe },
]

const bookmarkButtons = [
  // 1-15
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
  // 16-45
  { name: 'Fold Pop', description: '접기 팝', Component: BookmarkFoldPop },
  { name: 'Tab Flip', description: '탭 뒤집기', Component: BookmarkTabFlip },
  { name: 'Marker Drop', description: '마커 드롭', Component: BookmarkMarkerDrop },
  { name: 'Label Swing', description: '라벨 스윙', Component: BookmarkLabelSwing },
  { name: 'Book Open', description: '책 펼치기', Component: BookmarkBookOpen },
  { name: 'Note Flip', description: '노트 뒤집기', Component: BookmarkNoteFlip },
  { name: 'Tag Wiggle', description: '태그 흔들림', Component: BookmarkTagWiggle },
  { name: 'Card Pop', description: '카드 팝', Component: BookmarkCardPop },
  { name: 'Clip Swing', description: '클립 스윙', Component: BookmarkClipSwing },
  { name: 'Pin Bounce', description: '핀 바운스', Component: BookmarkPinBounce },
  { name: 'Save Slide', description: '저장 슬라이드', Component: BookmarkSaveSlide },
  { name: 'Mark Push', description: '마크 푸시', Component: BookmarkMarkPush },
  { name: 'Flag Raise', description: '깃발 올리기', Component: BookmarkFlagRaise },
  { name: 'Ribbon Twist', description: '리본 비틀기', Component: BookmarkRibbonTwist },
  { name: 'Glow', description: '발광 효과', Component: BookmarkGlow },
  { name: 'Page Turn', description: '페이지 넘김', Component: BookmarkPageTurn },
  { name: 'Tab Slide', description: '탭 슬라이드', Component: BookmarkTabSlide },
  { name: 'Corner Fold', description: '모서리 접기', Component: BookmarkCornerFold },
  { name: 'Stamp Press', description: '스탬프 누르기', Component: BookmarkStampPress },
  { name: 'Seal Mark', description: '도장 찍기', Component: BookmarkSealMark },
  { name: 'Clip Attach', description: '클립 붙이기', Component: BookmarkClipAttach },
  { name: 'Paper Push', description: '종이 밀기', Component: BookmarkPaperPush },
  { name: 'Fold Reveal', description: '펼쳐 보이기', Component: BookmarkFoldReveal },
  { name: 'Tag Dangle', description: '태그 달랑', Component: BookmarkTagDangle },
  { name: 'Ribbon Wrap', description: '리본 감기', Component: BookmarkRibbonWrap },
  { name: 'Archive Drop', description: '아카이브 드롭', Component: BookmarkArchiveDrop },
  { name: 'Index Slide', description: '인덱스 슬라이드', Component: BookmarkIndexSlide },
  { name: 'Notch Click', description: '노치 클릭', Component: BookmarkNotchClick },
  { name: 'Corner Peel', description: '모서리 벗기기', Component: BookmarkCornerPeel },
  { name: 'Float', description: '떠다니기', Component: BookmarkFloat },
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
                키치하고 귀여운 클릭 반응 인터랙션
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
              전체 (90)
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
              좋아요 (45)
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
              북마크 (45)
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
                45개
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
                45개
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
            CSS 애니메이션 기반 인터랙션 데모
          </p>
        </footer>
      </main>
    </div>
  )
}
