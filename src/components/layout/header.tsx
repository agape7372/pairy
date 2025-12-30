'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, Library, Sparkles, PenTool, Heart, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useUser } from '@/hooks/useUser'
import { NotificationBell } from '@/components/notifications/NotificationPanel'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

// 허브 중심 네비게이션
const navLinks = [
  { href: '/templates', label: '자료 허브', icon: Library },
  { href: '/my/library', label: '내 서재', icon: Heart },
  { href: '/editor/new', label: '에디터', icon: PenTool },
  { href: '/premium', label: '프리미엄', icon: Sparkles },
  { href: '/about', label: '소개', icon: Info },
]

// 티어별 배지 색상
const tierBadgeColors: Record<string, string> = {
  free: '',
  premium: 'bg-gradient-to-r from-primary-400 to-accent-400',
  duo: 'bg-gradient-to-r from-pink-400 to-rose-400',
  creator: 'bg-gradient-to-r from-amber-400 to-orange-400',
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { user, profile, isLoading, signOut } = useUser()
  const { subscription } = useSubscriptionStore()

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">
              <span className="text-primary-400">Pair</span>
              <span className="text-accent-400">y</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary-400',
                    isActive ? 'text-primary-400' : 'text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* User Avatar with Tier Badge */}
                <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary-300 transition-all"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                  )}
                  {/* Tier Badge */}
                  {subscription.tier !== 'free' && (
                    <span className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold border-2 border-white',
                      tierBadgeColors[subscription.tier]
                    )}>
                      {subscription.tier === 'duo' ? '2' : subscription.tier === 'creator' ? 'C' : 'P'}
                    </span>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-slide-up">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900 truncate">
                          {profile?.display_name || '사용자'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/my"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" strokeWidth={1.5} />
                        마이페이지
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        로그아웃
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/login">시작하기</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <Menu className="w-6 h-6" strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
            {/* User Info (if logged in) */}
            {user && (
              <div className="flex items-center gap-3 px-4 pb-4 mb-4 border-b border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.display_name || '사용자'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {link.label}
                  </Link>
                )
              })}
              {user && (
                <Link
                  href="/my"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/my'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" strokeWidth={1.5} />
                  마이페이지
                </Link>
              )}
            </nav>

            <div className="flex gap-2 mt-4 px-4">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 !text-red-600"
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  로그아웃
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" asChild>
                    <Link href="/login">시작하기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
