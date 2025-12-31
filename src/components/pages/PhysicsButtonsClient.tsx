'use client'

import { useState } from 'react'
import { Heart, Bookmark, Cog } from 'lucide-react'

// Physics-based button variants
import {
  LikeHeartPump,
  LikeStampPress,
  LikeToggleSwitch,
  LikeLockClick,
  LikeDialTurn,
  LikeButtonDepress,
  LikeValveRelease,
  LikeMagnetSnap,
  LikeGaugeFill,
  LikeCapsulePop,
} from '@/components/interactions/PhysicsLikeButtons'

import {
  BookmarkBinderClip,
  BookmarkCornerFold,
  BookmarkRibbonInsert,
  BookmarkStickyNote,
  BookmarkPageTurn,
  BookmarkFlagRaise,
  BookmarkPinDrop,
  BookmarkDrawerSlide,
  BookmarkWaxSeal,
  BookmarkTabPunch,
} from '@/components/interactions/PhysicsBookmarkButtons'

interface ButtonCardProps {
  name: string
  mechanism: string
  children: React.ReactNode
}

function ButtonCard({ name, mechanism, children }: ButtonCardProps) {
  return (
    <div className="group flex flex-col items-center p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      <div className="mb-4 h-16 flex items-center justify-center">
        {children}
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-xs text-gray-500 text-center leading-relaxed">{mechanism}</p>
    </div>
  )
}

const likeButtons = [
  { name: 'Heart Pump', mechanism: '심장 수축/이완 + 혈액 충전', Component: LikeHeartPump },
  { name: 'Stamp Press', mechanism: '도장 낙하 + 잉크 번짐', Component: LikeStampPress },
  { name: 'Toggle Switch', mechanism: '금속 스위치 토글', Component: LikeToggleSwitch },
  { name: 'Lock Click', mechanism: '자물쇠 걸쇠 맞물림', Component: LikeLockClick },
  { name: 'Dial Turn', mechanism: '다이얼 회전 + 눈금 정렬', Component: LikeDialTurn },
  { name: 'Button Depress', mechanism: '기계식 버튼 눌림 + 스프링', Component: LikeButtonDepress },
  { name: 'Valve Release', mechanism: '밸브 열림 + 증기 분출', Component: LikeValveRelease },
  { name: 'Magnet Snap', mechanism: '자석 끌림 + 철판 붙음', Component: LikeMagnetSnap },
  { name: 'Gauge Fill', mechanism: '게이지 충전 + 바늘 이동', Component: LikeGaugeFill },
  { name: 'Capsule Pop', mechanism: '캡슐 열림 + 내용물 튀어나옴', Component: LikeCapsulePop },
]

const bookmarkButtons = [
  { name: 'Binder Clip', mechanism: '손잡이 누름 + 클립 물림', Component: BookmarkBinderClip },
  { name: 'Corner Fold', mechanism: '종이 모서리 접힘', Component: BookmarkCornerFold },
  { name: 'Ribbon Insert', mechanism: '리본 삽입 + 책 사이 끼임', Component: BookmarkRibbonInsert },
  { name: 'Sticky Note', mechanism: '포스트잇 붙임 + 모서리 말림', Component: BookmarkStickyNote },
  { name: 'Page Turn', mechanism: '페이지 넘김 + 북마크 노출', Component: BookmarkPageTurn },
  { name: 'Flag Raise', mechanism: '깃발 올림 + 펄럭임', Component: BookmarkFlagRaise },
  { name: 'Pin Drop', mechanism: '핀 낙하 + 보드에 박힘', Component: BookmarkPinDrop },
  { name: 'Drawer Slide', mechanism: '서랍 열림 + 파일 삽입', Component: BookmarkDrawerSlide },
  { name: 'Wax Seal', mechanism: '왁스 떨어짐 + 도장 찍힘', Component: BookmarkWaxSeal },
  { name: 'Tab Punch', mechanism: '인덱스 탭 펀칭', Component: BookmarkTabPunch },
]

export default function PhysicsButtonsClient() {
  const [activeTab, setActiveTab] = useState<'like' | 'bookmark' | 'all'>('all')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl shadow-lg">
              <Cog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Physics-Based Interactions
              </h1>
              <p className="text-sm text-slate-500">
                Skeuomorphism 2.0 - 실제 기계처럼 작동하는 버튼
              </p>
            </div>
          </div>

          {/* 디자인 원칙 배너 */}
          <div className="mb-4 p-3 bg-slate-800 rounded-xl text-white text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold">Design Principles:</span>
            </div>
            <div className="flex flex-wrap gap-3 text-slate-300">
              <span>🔧 Materiality & Mechanism</span>
              <span>📐 Structural Depth (SVG)</span>
              <span>⚡ Physics Simulation (Spring, Gravity, Inertia)</span>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 (20)
            </button>
            <button
              onClick={() => setActiveTab('like')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'like'
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              좋아요 (10)
            </button>
            <button
              onClick={() => setActiveTab('bookmark')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'bookmark'
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              북마크 (10)
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
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">좋아요 버튼</h2>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">
                10개
              </span>
              <span className="text-xs text-slate-400 ml-2">
                각 버튼을 클릭해서 메커니즘을 확인하세요
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
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">북마크 버튼</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
                10개
              </span>
              <span className="text-xs text-slate-400 ml-2">
                각 버튼을 클릭해서 메커니즘을 확인하세요
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
        <section className="bg-slate-800 rounded-2xl p-8 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Cog className="w-5 h-5" />
            Technical Specifications
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-amber-400 mb-2">Physics Easing</h4>
              <ul className="space-y-1 text-slate-300 font-mono text-xs">
                <li>--spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)</li>
                <li>--gravity-fall: cubic-bezier(0.55, 0, 1, 0.45)</li>
                <li>--inertia-slow: cubic-bezier(0.16, 1, 0.3, 1)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-rose-400 mb-2">SVG Structure</h4>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• 부품별 path 분리 (Body, Chamber, Valve...)</li>
                <li>• 개별 transform-origin 설정</li>
                <li>• z-index 레이어링으로 입체감 표현</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400 mb-2">Animation Types</h4>
              <ul className="space-y-1 text-slate-300 text-xs">
                <li>• Spring: 탄성 튕김 효과</li>
                <li>• Gravity: 낙하 가속 효과</li>
                <li>• Pressure: 압력 반응 효과</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 비교 섹션 */}
        <section className="mt-8 bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Before vs After</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border-2 border-red-200">
              <h4 className="font-semibold text-red-600 mb-2">❌ 기존 방식</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 이모지 텍스트로 파티클 생성</li>
                <li>• 단순 scale/rotate 애니메이션</li>
                <li>• linear/ease-out 이징 함수</li>
                <li>• 물리적 근거 없는 움직임</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-green-200">
              <h4 className="font-semibold text-green-600 mb-2">✅ 새로운 방식</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• SVG path로 구조적 애니메이션</li>
                <li>• 실제 기계 메커니즘 시뮬레이션</li>
                <li>• Spring/Gravity 물리 이징</li>
                <li>• 촉각적 피드백 제공</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="mt-12 text-center text-sm text-slate-400">
          <p>
            Skeuomorphism 2.0 • Physics-Based UI Interactions
          </p>
          <p className="mt-1 text-xs">
            "와, 진짜 기계가 움직이는 것 같네?" - 목표 달성 체크리스트
          </p>
        </footer>
      </main>
    </div>
  )
}
