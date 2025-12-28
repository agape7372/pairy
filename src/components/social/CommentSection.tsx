'use client'

import { useState } from 'react'
import { MessageCircle, Heart, CornerDownRight, MoreHorizontal, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useComments } from '@/hooks/useComments'
import { cn } from '@/lib/utils/cn'
import type { CommentWithUser } from '@/types/database.types'

interface CommentSectionProps {
  templateId: string
  className?: string
}

export function CommentSection({ templateId, className }: CommentSectionProps) {
  const {
    comments,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    likeComment,
    unlikeComment,
  } = useComments(templateId)

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    const success = await addComment(newComment.trim())
    if (success) {
      setNewComment('')
    }
    setIsSubmitting(false)
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          댓글 <span className="text-primary-400">{comments.length}</span>
        </h3>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-lg shrink-0">
            👤
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성해주세요..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '댓글 등록'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={addComment}
              onEdit={editComment}
              onDelete={deleteComment}
              onLike={likeComment}
              onUnlike={unlikeComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 개별 댓글 아이템
interface CommentItemProps {
  comment: CommentWithUser
  onReply: (content: string, parentId: string) => Promise<boolean>
  onEdit: (commentId: string, content: string) => Promise<boolean>
  onDelete: (commentId: string) => Promise<boolean>
  onLike: (commentId: string) => Promise<boolean>
  onUnlike: (commentId: string) => Promise<boolean>
  isReply?: boolean
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  isReply = false,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    const success = await onReply(replyContent.trim(), comment.id)
    if (success) {
      setReplyContent('')
      setShowReplyInput(false)
    }
    setIsSubmitting(false)
  }

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    const success = await onEdit(comment.id, editContent.trim())
    if (success) {
      setIsEditing(false)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (confirm('댓글을 삭제하시겠어요?')) {
      await onDelete(comment.id)
    }
  }

  const handleLikeToggle = async () => {
    if (comment.isLiked) {
      await onUnlike(comment.id)
    } else {
      await onLike(comment.id)
    }
  }

  // 상대 시간 포맷
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className={cn('', isReply && 'ml-12 mt-4')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn(
          'rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center shrink-0',
          isReply ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'
        )}>
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt=""
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이모지로 대체
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.textContent = '👤'
              }}
            />
          ) : (
            '👤'
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">
              {comment.user.display_name || '익명'}
            </span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
          </div>

          {/* Edit mode or display mode */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleEdit} disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : '저장'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLikeToggle}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                comment.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              )}
            >
              <Heart className={cn('w-4 h-4', comment.isLiked && 'fill-current')} />
              <span>{comment.like_count}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-400 transition-colors"
              >
                <CornerDownRight className="w-4 h-4" />
                <span>답글</span>
              </button>
            )}

            {/* Menu */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[100px]">
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      수정
                    </button>
                    <button
                      onClick={() => {
                        handleDelete()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 작성해주세요..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply()
                  }
                }}
              />
              <Button size="sm" onClick={handleReply} disabled={isSubmitting}>
                {isSubmitting ? '...' : '등록'}
              </Button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-4 mt-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onUnlike={onUnlike}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
