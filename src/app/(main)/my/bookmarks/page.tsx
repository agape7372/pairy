'use client'

import Link from 'next/link'
import { Heart, Bookmark, BookmarkX } from 'lucide-react'
import { Button, Tag, useToast } from '@/components/ui'
import { useBookmarks } from '@/hooks/useBookmarks'

export default function MyBookmarksPage() {
  const { bookmarks, isLoading, removeBookmark } = useBookmarks()
  const toast = useToast()

  const handleRemoveBookmark = async (templateId: string) => {
    const success = await removeBookmark(templateId)
    if (!success) {
      toast.error('북마크 해제에 실패했어요.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-bold text-gray-900">북마크한 틀</h2>
        <span className="text-sm text-gray-500">({bookmarks.length})</span>
      </div>

      {/* Bookmarks Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-transparent" />
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-[20px] border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Preview */}
              <Link href={`/templates/${template.id}`}>
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl overflow-hidden">
                  {template.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={template.preview_url} alt={template.title} className="w-full h-full object-cover" />
                  ) : (
                    '🎨'
                  )}
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
                    <Heart className="w-4 h-4" />
                    {(template.like_count || 0).toLocaleString()}
                  </span>
                  {template.creator?.display_name && <span>by {template.creator.display_name}</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag, idx) => (
                      <Tag key={tag.id} variant={idx === 0 ? 'primary' : 'accent'}>
                        {tag.name}
                      </Tag>
                    ))}
                  </div>

                  <button
                    onClick={() => handleRemoveBookmark(template.id)}
                    className="p-2 text-accent-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="북마크 해제"
                  >
                    <Bookmark className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-[20px]">
          <div className="text-6xl mb-4">
            <BookmarkX className="w-16 h-16 mx-auto text-gray-300" />
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
