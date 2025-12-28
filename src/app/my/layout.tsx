'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, FileText, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUser } from '@/hooks/useUser'

const tabs = [
  { href: '/my', label: '프로필', icon: User, exact: true },
  { href: '/my/works', label: '내 작업', icon: FileText },
  { href: '/my/bookmarks', label: '북마크', icon: Bookmark },
  { href: '/my/settings', label: '설정', icon: Settings },
]

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
        <p className="text-gray-500 mb-6">마이페이지는 로그인 후 이용할 수 있어요.</p>
        <Link
          href="/login?redirectTo=/my"
          className="px-6 py-3 bg-primary-400 text-white rounded-full font-semibold hover:bg-primary-500 transition-colors"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Profile Header */}
      <section className="bg-gradient-to-b from-primary-100 to-white py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.display_name || '사용자'}
              </h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-[65px] z-40">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href)
              const Icon = tab.icon

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    isActive
                      ? 'border-primary-400 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
