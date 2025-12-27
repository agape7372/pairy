'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Template, Tag } from '@/types/database.types'

export interface BookmarkedTemplate extends Template {
  tags: Tag[]
  creator: {
    id: string
    display_name: string | null
  } | null
  bookmarked_at: string
}

interface UseBookmarksReturn {
  bookmarks: BookmarkedTemplate[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  addBookmark: (templateId: string) => Promise<boolean>
  removeBookmark: (templateId: string) => Promise<boolean>
  isBookmarked: (templateId: string) => boolean
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<BookmarkedTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBookmarks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBookmarks([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select(`
          created_at,
          template:templates(
            *,
            creator:profiles!templates_creator_id_fkey(id, display_name),
            template_tags(
              tag:tags(*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const transformedData: BookmarkedTemplate[] = (data || [])
        .filter((item: any) => item.template)
        .map((item: any) => ({
          ...item.template,
          tags: item.template.template_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
          creator: item.template.creator,
          bookmarked_at: item.created_at,
        }))

      setBookmarks(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bookmarks'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  // 북마크 추가
  const addBookmark = async (templateId: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          template_id: templateId,
        })

      if (error) throw error

      await fetchBookmarks()
      return true
    } catch (err) {
      console.error('Failed to add bookmark:', err)
      return false
    }
  }

  // 북마크 제거
  const removeBookmark = async (templateId: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('template_id', templateId)

      if (error) throw error

      setBookmarks(prev => prev.filter(b => b.id !== templateId))
      return true
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
      return false
    }
  }

  // 북마크 여부 확인
  const isBookmarked = (templateId: string): boolean => {
    return bookmarks.some(b => b.id === templateId)
  }

  return {
    bookmarks,
    isLoading,
    error,
    refetch: fetchBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  }
}
