'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { CommentWithUser } from '@/types/database.types'

// Supabase 쿼리 결과 타입
interface CommentQueryResult {
  id: string
  template_id: string
  user_id: string
  parent_id: string | null
  content: string
  like_count: number
  is_edited: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface UseCommentsReturn {
  comments: CommentWithUser[]
  isLoading: boolean
  error: Error | null
  addComment: (content: string, parentId?: string) => Promise<boolean>
  editComment: (commentId: string, content: string) => Promise<boolean>
  deleteComment: (commentId: string) => Promise<boolean>
  likeComment: (commentId: string) => Promise<boolean>
  unlikeComment: (commentId: string) => Promise<boolean>
  refetch: () => void
}

// 데모 모드용 로컬 스토리지 키
const DEMO_COMMENTS_KEY = 'pairy_demo_comments'
const DEMO_COMMENT_LIKES_KEY = 'pairy_demo_comment_likes'

// 데모용 샘플 댓글 데이터
const sampleComments: CommentWithUser[] = [
  {
    id: 'demo-1',
    template_id: '1',
    user_id: 'user-1',
    parent_id: null,
    content: '너무 예쁜 틀이에요! 바로 사용해봤는데 친구랑 같이 채우니까 재밌었어요 ^^',
    like_count: 12,
    is_edited: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: {
      id: 'user-1',
      display_name: '딸기우유',
      avatar_url: null,
    },
    replies: [
      {
        id: 'demo-1-1',
        template_id: '1',
        user_id: 'user-2',
        parent_id: 'demo-1',
        content: '저도 써봤는데 진짜 좋더라구요!',
        like_count: 3,
        is_edited: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        user: {
          id: 'user-2',
          display_name: '민트초코',
          avatar_url: null,
        },
      },
    ],
    isLiked: false,
  },
  {
    id: 'demo-2',
    template_id: '1',
    user_id: 'user-3',
    parent_id: null,
    content: '색감이 너무 예뻐요 감사합니다!',
    like_count: 8,
    is_edited: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user: {
      id: 'user-3',
      display_name: '블루베리',
      avatar_url: null,
    },
    isLiked: false,
  },
]

function getDemoComments(templateId: string): CommentWithUser[] {
  if (typeof window === 'undefined') return sampleComments
  try {
    const stored = localStorage.getItem(DEMO_COMMENTS_KEY)
    const allComments: CommentWithUser[] = stored ? JSON.parse(stored) : sampleComments
    return allComments.filter(c => c.template_id === templateId || c.template_id === '1')
  } catch {
    return sampleComments
  }
}

// NOTE: 데모 댓글 저장 기능 - 향후 데모 모드 댓글 영구 저장 시 사용 예정
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _saveDemoComments(comments: CommentWithUser[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_COMMENTS_KEY, JSON.stringify(comments))
}

function getDemoCommentLikes(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(DEMO_COMMENT_LIKES_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDemoCommentLikes(likes: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_COMMENT_LIKES_KEY, JSON.stringify([...likes]))
}

export function useComments(templateId: string): UseCommentsReturn {
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // 언마운트 후 state 업데이트 방지
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // 댓글 로드
  const loadComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (IS_DEMO_MODE) {
      const demoComments = getDemoComments(templateId)
      const likes = getDemoCommentLikes()

      // 좋아요 상태 반영
      const commentsWithLikes = demoComments.map(c => ({
        ...c,
        isLiked: likes.has(c.id),
        replies: c.replies?.map(r => ({
          ...r,
          isLiked: likes.has(r.id),
        })),
      }))

      // 언마운트 체크
      if (!isMountedRef.current) return
      setComments(commentsWithLikes)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

      // 현재 사용자
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }

      // 댓글 가져오기 (최상위 댓글만)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq('template_id', templateId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (commentsError) throw commentsError

      // 답글 가져오기
      const commentIds = commentsData?.map(c => c.id) || []
      let repliesData: CommentQueryResult[] = []

      if (commentIds.length > 0) {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles!comments_user_id_fkey(id, display_name, avatar_url)
          `)
          .in('parent_id', commentIds)
          .order('created_at', { ascending: true })

        // NOTE: Supabase 타입 추론이 복잡하므로 unknown을 통해 변환
        repliesData = (replies || []) as unknown as CommentQueryResult[]
      }

      // 현재 사용자의 좋아요 확인
      let userLikes: string[] = []
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)

        userLikes = likes?.map(l => l.comment_id) || []
      }

      // 데이터 조합
      // NOTE: Supabase 쿼리 결과를 CommentWithUser로 변환. 타입이 복잡하므로 unknown을 경유
      const transformedComments = ((commentsData || []) as unknown as CommentQueryResult[]).map((comment) => ({
        ...comment,
        isLiked: userLikes.includes(comment.id),
        replies: repliesData
          .filter((r) => r.parent_id === comment.id)
          .map((r) => ({
            ...r,
            isLiked: userLikes.includes(r.id),
          })),
      })) as unknown as CommentWithUser[]

      // 언마운트 체크
      if (!isMountedRef.current) return
      setComments(transformedComments)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err : new Error('Failed to load comments'))
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [templateId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // 댓글 작성
  const addComment = useCallback(async (content: string, parentId?: string): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      const newComment: CommentWithUser = {
        id: `demo-${Date.now()}`,
        template_id: templateId,
        user_id: 'demo-user',
        parent_id: parentId || null,
        content,
        like_count: 0,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 'demo-user',
          display_name: '나',
          avatar_url: null,
        },
        isLiked: false,
      }

      if (parentId) {
        // 답글인 경우
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            }
          }
          return c
        }))
      } else {
        // 새 댓글인 경우
        setComments(prev => [newComment, ...prev])
      }

      return true
    }

    if (!currentUserId) return false

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('comments')
        .insert({
          template_id: templateId,
          user_id: currentUserId,
          parent_id: parentId || null,
          content,
        })

      if (error) throw error

      await loadComments()
      return true
    } catch (err) {
      console.error('Failed to add comment:', err)
      return false
    }
  }, [templateId, currentUserId, loadComments])

  // 댓글 수정
  const editComment = useCallback(async (commentId: string, content: string): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, content, is_edited: true, updated_at: new Date().toISOString() }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? { ...r, content, is_edited: true, updated_at: new Date().toISOString() }
                : r
            ),
          }
        }
        return c
      }))
      return true
    }

    if (!currentUserId) return false

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('comments')
        .update({ content, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', currentUserId)

      if (error) throw error

      await loadComments()
      return true
    } catch (err) {
      console.error('Failed to edit comment:', err)
      return false
    }
  }, [currentUserId, loadComments])

  // 댓글 삭제
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      setComments(prev => {
        // 최상위 댓글인 경우
        const filtered = prev.filter(c => c.id !== commentId)
        // 답글인 경우
        return filtered.map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId),
        }))
      })
      return true
    }

    if (!currentUserId) return false

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId)

      if (error) throw error

      await loadComments()
      return true
    } catch (err) {
      console.error('Failed to delete comment:', err)
      return false
    }
  }, [currentUserId, loadComments])

  // 댓글 좋아요
  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      const likes = getDemoCommentLikes()
      likes.add(commentId)
      saveDemoCommentLikes(likes)

      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: c.like_count + 1, isLiked: true }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? { ...r, like_count: r.like_count + 1, isLiked: true }
                : r
            ),
          }
        }
        return c
      }))
      return true
    }

    if (!currentUserId) return false

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('comment_likes')
        .insert({
          user_id: currentUserId,
          comment_id: commentId,
        })

      if (error) throw error

      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: c.like_count + 1, isLiked: true }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? { ...r, like_count: r.like_count + 1, isLiked: true }
                : r
            ),
          }
        }
        return c
      }))
      return true
    } catch (err) {
      console.error('Failed to like comment:', err)
      return false
    }
  }, [currentUserId])

  // 댓글 좋아요 취소
  const unlikeComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      const likes = getDemoCommentLikes()
      likes.delete(commentId)
      saveDemoCommentLikes(likes)

      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: Math.max(0, c.like_count - 1), isLiked: false }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? { ...r, like_count: Math.max(0, r.like_count - 1), isLiked: false }
                : r
            ),
          }
        }
        return c
      }))
      return true
    }

    if (!currentUserId) return false

    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('comment_id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: Math.max(0, c.like_count - 1), isLiked: false }
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? { ...r, like_count: Math.max(0, r.like_count - 1), isLiked: false }
                : r
            ),
          }
        }
        return c
      }))
      return true
    } catch (err) {
      console.error('Failed to unlike comment:', err)
      return false
    }
  }, [currentUserId])

  return {
    comments,
    isLoading,
    error,
    addComment,
    editComment,
    deleteComment,
    likeComment,
    unlikeComment,
    refetch: loadComments,
  }
}
