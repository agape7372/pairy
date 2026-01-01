'use client'

import { useState } from 'react'
import { Heart, Bookmark, Sparkles } from 'lucide-react'

// Magic & Fairy themed button variants (1-10)
import {
  LikeFairyDust,
  LikeMagicWand,
  LikeSparkleBurst,
  LikeHeartGlow,
  LikeCrystalShine,
  LikeAuroraWave,
  LikeStarTwinkle,
  LikeMoonPhase,
  LikePetalFloat,
  LikeRainbowShimmer,
  // 11-30
  LikeNebulaSwirl,
  LikePixieTrail,
  LikeEnchantedBubble,
  LikeStardustCascade,
  LikeFairyRing,
  LikeCelestialBloom,
  LikeMysticMist,
  LikeDiamondSparkle,
  LikeCometTail,
  LikeMoonbeam,
  LikeEnchantedForest,
  LikeGlitterStorm,
  LikeFairyWhisper,
  LikeStarlightCascade,
  LikeMagicMirror,
  LikeDreamlight,
  LikeSunburst,
  LikeCrystalGarden,
  LikeCosmicLove,
  LikeEternalFlame,
} from '@/components/interactions/PhysicsLikeButtons'

import {
  BookmarkMagicBookmark,
  BookmarkEnchantSeal,
  BookmarkFairyWing,
  BookmarkStardustTrail,
  BookmarkLightBeam,
  BookmarkCrystalMark,
  BookmarkGlowRibbon,
  BookmarkMagicRune,
  BookmarkFireflyDance,
  BookmarkDreamCatcher,
  // 11-30
  BookmarkNebulaGlow,
  BookmarkPixieDust,
  BookmarkEnchantedScroll,
  BookmarkStarfall,
  BookmarkFairyCircle,
  BookmarkCelestialMark,
  BookmarkMysticVeil,
  BookmarkDiamondHalo,
  BookmarkCometMark,
  BookmarkMoonlit,
  BookmarkForestSpirit,
  BookmarkShimmerWave,
  BookmarkFairyTale,
  BookmarkStardustCloud,
  BookmarkMirrorRealm,
  BookmarkDreamMist,
  BookmarkSunrayMark,
  BookmarkCrystalHeart,
  BookmarkGalaxyMark,
  BookmarkPhoenixFeather,
} from '@/components/interactions/PhysicsBookmarkButtons'

interface ButtonCardProps {
  name: string
  mechanism: string
  children: React.ReactNode
}

function ButtonCard({ name, mechanism, children }: ButtonCardProps) {
  return (
    <div className="group flex flex-col items-center p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all duration-300">
      <div className="mb-4 h-16 flex items-center justify-center">
        {children}
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-xs text-gray-500 text-center leading-relaxed">{mechanism}</p>
    </div>
  )
}

const likeButtons = [
  // 1-10
  { name: 'Fairy Dust', mechanism: '요정 가루가 흩뿌려지는 반짝임', Component: LikeFairyDust },
  { name: 'Magic Wand', mechanism: '마법 지팡이로 터치하면 별 폭발', Component: LikeMagicWand },
  { name: 'Sparkle Burst', mechanism: '중심에서 빛이 방사형으로 퍼짐', Component: LikeSparkleBurst },
  { name: 'Heart Glow', mechanism: '부드러운 빛 발산과 후광 효과', Component: LikeHeartGlow },
  { name: 'Crystal Shine', mechanism: '크리스탈처럼 빛이 굴절되는 효과', Component: LikeCrystalShine },
  { name: 'Aurora Wave', mechanism: '오로라 빛이 물결치듯 퍼짐', Component: LikeAuroraWave },
  { name: 'Star Twinkle', mechanism: '주변에 별들이 반짝반짝 깜빡임', Component: LikeStarTwinkle },
  { name: 'Moon Phase', mechanism: '달빛이 차오르는 효과', Component: LikeMoonPhase },
  { name: 'Petal Float', mechanism: '꽃잎이 부드럽게 떠오름', Component: LikePetalFloat },
  { name: 'Rainbow Shimmer', mechanism: '무지개 색이 일렁이는 효과', Component: LikeRainbowShimmer },
  // 11-20
  { name: 'Nebula Swirl', mechanism: '성운 소용돌이처럼 빛이 퍼짐', Component: LikeNebulaSwirl },
  { name: 'Pixie Trail', mechanism: '픽시 요정의 반짝이는 자취', Component: LikePixieTrail },
  { name: 'Enchanted Bubble', mechanism: '마법 버블이 떠오름', Component: LikeEnchantedBubble },
  { name: 'Stardust Cascade', mechanism: '별가루가 폭포처럼 쏟아짐', Component: LikeStardustCascade },
  { name: 'Fairy Ring', mechanism: '요정의 원이 회전', Component: LikeFairyRing },
  { name: 'Celestial Bloom', mechanism: '천상의 꽃이 피어남', Component: LikeCelestialBloom },
  { name: 'Mystic Mist', mechanism: '신비로운 안개가 피어오름', Component: LikeMysticMist },
  { name: 'Diamond Sparkle', mechanism: '다이아몬드처럼 빛 반사', Component: LikeDiamondSparkle },
  { name: 'Comet Tail', mechanism: '혜성 꼬리가 휘돌아감', Component: LikeCometTail },
  { name: 'Moonbeam', mechanism: '달빛 광선이 내려옴', Component: LikeMoonbeam },
  // 21-30
  { name: 'Enchanted Forest', mechanism: '숲의 정령 마법', Component: LikeEnchantedForest },
  { name: 'Glitter Storm', mechanism: '글리터 폭풍이 휘몰아침', Component: LikeGlitterStorm },
  { name: 'Fairy Whisper', mechanism: '요정의 속삭임과 날개', Component: LikeFairyWhisper },
  { name: 'Starlight Cascade', mechanism: '별빛이 계단식으로 쏟아짐', Component: LikeStarlightCascade },
  { name: 'Magic Mirror', mechanism: '거울에 반사되는 대칭 빛', Component: LikeMagicMirror },
  { name: 'Dreamlight', mechanism: '몽환적인 빛이 물결침', Component: LikeDreamlight },
  { name: 'Sunburst', mechanism: '태양처럼 따뜻한 빛 폭발', Component: LikeSunburst },
  { name: 'Crystal Garden', mechanism: '크리스탈 꽃이 피어남', Component: LikeCrystalGarden },
  { name: 'Cosmic Love', mechanism: '은하수처럼 빛이 휘감음', Component: LikeCosmicLove },
  { name: 'Eternal Flame', mechanism: '따뜻한 마법 불꽃', Component: LikeEternalFlame },
]

const bookmarkButtons = [
  // 1-10
  { name: 'Magic Bookmark', mechanism: '마법의 빛이 감싸며 빛남', Component: BookmarkMagicBookmark },
  { name: 'Enchant Seal', mechanism: '마법진이 나타나며 회전', Component: BookmarkEnchantSeal },
  { name: 'Fairy Wing', mechanism: '요정 날개가 펄럭이는 효과', Component: BookmarkFairyWing },
  { name: 'Stardust Trail', mechanism: '별가루가 흩뿌려지는 자취', Component: BookmarkStardustTrail },
  { name: 'Light Beam', mechanism: '위에서 빛줄기가 내려옴', Component: BookmarkLightBeam },
  { name: 'Crystal Mark', mechanism: '크리스탈처럼 빛나는 마크', Component: BookmarkCrystalMark },
  { name: 'Glow Ribbon', mechanism: '부드럽게 빛나는 리본 효과', Component: BookmarkGlowRibbon },
  { name: 'Magic Rune', mechanism: '마법 룬 문자가 나타남', Component: BookmarkMagicRune },
  { name: 'Firefly Dance', mechanism: '반딧불이가 춤추는 효과', Component: BookmarkFireflyDance },
  { name: 'Dream Catcher', mechanism: '드림캐처처럼 빛이 엮임', Component: BookmarkDreamCatcher },
  // 11-20
  { name: 'Nebula Glow', mechanism: '성운처럼 여러 색이 섞인 글로우', Component: BookmarkNebulaGlow },
  { name: 'Pixie Dust', mechanism: '픽시 가루가 흩날림', Component: BookmarkPixieDust },
  { name: 'Enchanted Scroll', mechanism: '마법 두루마리가 펼쳐짐', Component: BookmarkEnchantedScroll },
  { name: 'Starfall', mechanism: '별들이 위에서 떨어짐', Component: BookmarkStarfall },
  { name: 'Fairy Circle', mechanism: '요정의 원이 회전', Component: BookmarkFairyCircle },
  { name: 'Celestial Mark', mechanism: '천상의 마크가 새겨짐', Component: BookmarkCelestialMark },
  { name: 'Mystic Veil', mechanism: '신비로운 베일이 감쌈', Component: BookmarkMysticVeil },
  { name: 'Diamond Halo', mechanism: '다이아몬드 같은 후광', Component: BookmarkDiamondHalo },
  { name: 'Comet Mark', mechanism: '혜성 꼬리가 있는 마크', Component: BookmarkCometMark },
  { name: 'Moonlit', mechanism: '부드러운 달빛이 비침', Component: BookmarkMoonlit },
  // 21-30
  { name: 'Forest Spirit', mechanism: '숲 정령의 자연 빛', Component: BookmarkForestSpirit },
  { name: 'Shimmer Wave', mechanism: '반짝이가 파도처럼 퍼짐', Component: BookmarkShimmerWave },
  { name: 'Fairy Tale', mechanism: '동화책 마법 페이지', Component: BookmarkFairyTale },
  { name: 'Stardust Cloud', mechanism: '별먼지 구름 효과', Component: BookmarkStardustCloud },
  { name: 'Mirror Realm', mechanism: '거울에 반사되는 효과', Component: BookmarkMirrorRealm },
  { name: 'Dream Mist', mechanism: '몽환적인 안개 효과', Component: BookmarkDreamMist },
  { name: 'Sunray Mark', mechanism: '따뜻한 태양광 효과', Component: BookmarkSunrayMark },
  { name: 'Crystal Heart', mechanism: '크리스탈 하트가 떠오름', Component: BookmarkCrystalHeart },
  { name: 'Galaxy Mark', mechanism: '은하수처럼 휘감기는 효과', Component: BookmarkGalaxyMark },
  { name: 'Phoenix Feather', mechanism: '불사조 깃털 따뜻한 빛', Component: BookmarkPhoenixFeather },
]

export default function PhysicsButtonsClient() {
  const [activeTab, setActiveTab] = useState<'like' | 'bookmark' | 'all'>('all')

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-pink-400 to-violet-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                Magic & Fairy Interactions
              </h1>
              <p className="text-sm text-gray-500">
                페어리, 마법, 빛, 반짝임 테마의 인터랙션
              </p>
            </div>
          </div>

          {/* 디자인 원칙 배너 */}
          <div className="mb-4 p-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl text-white text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">Design Principles:</span>
            </div>
            <div className="flex flex-wrap gap-3 text-pink-100">
              <span>✨ Fairy Dust & Sparkles</span>
              <span>🌙 Soft Glow & Light</span>
              <span>🌈 Rainbow & Aurora Effects</span>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 (60)
            </button>
            <button
              onClick={() => setActiveTab('like')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'like'
                  ? 'bg-pink-500 text-white shadow-lg'
                  : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              좋아요 (30)
            </button>
            <button
              onClick={() => setActiveTab('bookmark')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'bookmark'
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              북마크 (30)
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
              <div className="p-1.5 bg-pink-100 rounded-lg">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">좋아요 버튼</h2>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-bold rounded-full">
                30개
              </span>
              <span className="text-xs text-gray-400 ml-2">
                각 버튼을 클릭해서 마법 효과를 확인하세요
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {likeButtons.map(({ name, mechanism, Component }) => (
                <ButtonCard key={name} name={name} mechanism={mechanism}>
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
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-violet-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">북마크 버튼</h2>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs font-bold rounded-full">
                30개
              </span>
              <span className="text-xs text-gray-400 ml-2">
                각 버튼을 클릭해서 마법 효과를 확인하세요
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bookmarkButtons.map(({ name, mechanism, Component }) => (
                <ButtonCard key={name} name={name} mechanism={mechanism}>
                  <Component />
                </ButtonCard>
              ))}
            </div>
          </section>
        )}

        {/* 기술 스펙 */}
        <section className="bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl p-8 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Magic Animation Specs
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-pink-200 mb-2">Magic Easing</h4>
              <ul className="space-y-1 text-pink-100 font-mono text-xs">
                <li>--magic-soft: 부드러운 마법</li>
                <li>--fairy-flutter: 요정 날개짓</li>
                <li>--glow-fade: 빛 페이드</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-violet-200 mb-2">Effect Types</h4>
              <ul className="space-y-1 text-pink-100 text-xs">
                <li>• Fairy Dust - 반짝이는 입자</li>
                <li>• Glow & Halo - 부드러운 후광</li>
                <li>• Rainbow Shimmer - 무지개빛</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">Theme Colors</h4>
              <ul className="space-y-1 text-pink-100 text-xs">
                <li>• Pink (#f472b6) - 하트/사랑</li>
                <li>• Violet (#a78bfa) - 마법/신비</li>
                <li>• Gold (#fbbf24) - 별빛/반짝임</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="mt-8 bg-white rounded-2xl p-8 border-2 border-pink-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">✨ 페어리 테마 특징</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧚</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Fairy Dust & Sparkles</h4>
                  <p className="text-sm text-gray-600">요정 가루와 반짝이는 입자 효과</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌙</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Soft Glow</h4>
                  <p className="text-sm text-gray-600">부드럽게 빛나는 후광과 글로우</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌈</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Rainbow & Aurora</h4>
                  <p className="text-sm text-gray-600">무지개와 오로라 색상 효과</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌸</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Petal & Nature</h4>
                  <p className="text-sm text-gray-600">꽃잎과 자연 요소 애니메이션</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent font-semibold">
            Magic & Fairy Theme • Pairy Platform
          </p>
          <p className="mt-1 text-xs">
            페어리, 마법, 빛, 반짝임 - 플랫폼 테마에 맞는 인터랙션
          </p>
        </footer>
      </main>
    </div>
  )
}
