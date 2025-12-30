/**
 * 404 Not Found Page
 *
 * UX 서사: "길을 잃어도 괜찮아요. 때로는 헤매는 것도 여행의 일부.
 *          우리가 다시 집으로 데려다줄게요."
 *
 * 404 페이지는 실패가 아니라 새로운 탐험의 시작입니다.
 */

import Link from 'next/link'
import { Home, Search, Compass, Map, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 떠다니는 별들 */}
        <div
          className="absolute top-[10%] left-[15%] text-2xl animate-float opacity-40"
          style={{ animationDelay: '0s' }}
        >
          ✦
        </div>
        <div
          className="absolute top-[25%] right-[20%] text-lg animate-float opacity-30"
          style={{ animationDelay: '0.5s' }}
        >
          ✧
        </div>
        <div
          className="absolute bottom-[30%] left-[10%] text-xl animate-float opacity-35"
          style={{ animationDelay: '1s' }}
        >
          ❋
        </div>
        <div
          className="absolute bottom-[20%] right-[15%] text-2xl animate-float opacity-40"
          style={{ animationDelay: '1.5s' }}
        >
          ✦
        </div>
        <div
          className="absolute top-[40%] left-[5%] text-sm animate-float opacity-25"
          style={{ animationDelay: '2s' }}
        >
          ✧
        </div>

        {/* 부드러운 원형 그라데이션들 */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-accent-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-lg w-full text-center relative z-10">
        {/* 일러스트레이션 */}
        <div className="relative mb-8">
          {/* 메인 SVG 일러스트 */}
          <svg
            className="w-48 h-48 mx-auto animate-float"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 지도 배경 */}
            <rect x="40" y="50" width="120" height="100" rx="12" className="fill-white stroke-gray-200" strokeWidth="2" />
            <rect x="50" y="60" width="100" height="80" rx="8" className="fill-primary-50" />

            {/* 지도 패턴 (점선 경로) */}
            <path
              d="M60 90 Q80 70, 100 90 T140 90"
              className="stroke-primary-200"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
            <path
              d="M60 110 Q90 130, 120 110 T140 120"
              className="stroke-accent-200"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />

            {/* X 마크 (목적지) */}
            <g className="animate-pulse" style={{ animationDuration: '2s' }}>
              <circle cx="100" cy="100" r="12" className="fill-primary-100" />
              <path d="M95 95 L105 105 M105 95 L95 105" className="stroke-primary-400" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* 물음표 핀 */}
            <g transform="translate(100, 40)">
              <path d="M0 10 L-6 25 L6 25 Z" className="fill-rose-400" />
              <circle cx="0" cy="0" r="15" className="fill-rose-400" />
              <text x="0" y="6" className="fill-white text-lg font-bold" textAnchor="middle">?</text>
            </g>

            {/* 나침반 */}
            <g transform="translate(155, 125)">
              <circle cx="0" cy="0" r="18" className="fill-white stroke-gray-200" strokeWidth="2" />
              <circle cx="0" cy="0" r="14" className="fill-none stroke-gray-100" strokeWidth="1" />
              <polygon points="0,-10 -4,4 0,2 4,4" className="fill-rose-400" />
              <polygon points="0,10 -4,-4 0,-2 4,-4" className="fill-gray-300" />
              <circle cx="0" cy="0" r="3" className="fill-gray-100 stroke-gray-300" strokeWidth="1" />
            </g>

            {/* 404 텍스트 */}
            <text x="100" y="175" className="fill-gray-300 text-2xl font-bold" textAnchor="middle">404</text>
          </svg>

          {/* 작은 반짝이 장식 */}
          <Sparkles
            className="absolute top-0 right-1/4 w-5 h-5 text-amber-300 animate-twinkle"
            style={{ animationDelay: '0.3s' }}
          />
          <Sparkles
            className="absolute bottom-1/4 left-1/4 w-4 h-4 text-pink-300 animate-twinkle"
            style={{ animationDelay: '0.8s' }}
          />
        </div>

        {/* 메시지 */}
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            <span className="text-gradient">앗,</span> 길을 잃었나봐요
          </h1>
          <p className="text-gray-500 leading-relaxed">
            찾으시는 페이지가 숨어버렸어요.<br />
            하지만 괜찮아요, 다시 시작하면 되니까요!
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild variant="primary" className="btn-cute-primary group">
            <Link href="/">
              <Home className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
              홈으로 돌아가기
            </Link>
          </Button>
          <Button asChild variant="outline" className="btn-cute group">
            <Link href="/templates">
              <Search className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              자료 둘러보기
            </Link>
          </Button>
        </div>

        {/* 추가 안내 */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
          <Link
            href="/about"
            className="flex items-center gap-1 hover:text-primary-500 transition-colors link-underline"
          >
            <Compass className="w-4 h-4" />
            서비스 소개
          </Link>
          <span className="text-gray-200">|</span>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-primary-500 transition-colors link-underline"
          >
            <Map className="w-4 h-4" />
            메인 페이지
          </Link>
        </div>
      </div>
    </div>
  )
}
