'use client'

import Link from 'next/link'
import { Heart, Bookmark, BookmarkX } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { getIcon, getIconColor, type IconName } from '@/lib/utils/icons'

// 샘플 데이터
const sampleBookmarks = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    icon: 'heart' as IconName,
  },
  {
    id: '4',
    title: '베프 케미 틀',
    creator: '민트초코',
    likeCount: 2341,
    tags: ['친구', '2인용'],
    icon: 'clover' as IconName,
  },
  {
    id: '7',
    title: '팬아트 커플 틀',
    creator: '체리블라썸',
    likeCount: 3456,
    tags: ['팬아트', '커플', '2인용'],
    icon: 'flower' as IconName,
  },
]

export default function MyBookmarksPage() {
  const handleRemoveBookmark = (id: string) => {
    // TODO: Implement bookmark removal
    console.log('Remove bookmark:', id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-bold text-gray-900">북마크한 틀</h2>
        <span className="text-sm text-gray-500">({sampleBookmarks.length})</span>
      </div>

      {/* Bookmarks Grid */}
      {sampleBookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleBookmarks.map((template) => {
            const IconComponent = getIcon(template.icon)
            const iconColor = getIconColor(template.icon)
            return (
              <div
                key={template.id}
                className="bg-white rounded-[20px] border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Preview */}
                <Link href={`/templates/${template.id}`}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                    <IconComponent className={`w-12 h-12 ${iconColor}`} strokeWidth={1.5} />
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/templates/${template.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-400 transition-colors">
                      {template.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" strokeWidth={1.5} />
                      {template.likeCount.toLocaleString()}
                    </span>
                    <span>by {template.creator}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag, idx) => (
                        <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
                          {tag}
                        </Tag>
                      ))}
                    </div>

                    <button
                      onClick={() => handleRemoveBookmark(template.id)}
                      className="p-2 text-accent-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="북마크 해제"
                    >
                      <Bookmark className="w-5 h-5 fill-current" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-[20px]">
          <div className="w-16 h-16 mx-auto mb-4">
            <BookmarkX className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            북마크한 틀이 없어요
          </h3>
          <p className="text-gray-500 mb-6">
            마음에 드는 틀을 북마크해서 저장해보세요!
          </p>
          <Button asChild>
            <Link href="/templates">틀 둘러보기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
