'use client'

/**
 * 라이브러리 폴더 CRUD 훅 (M3)
 * useWorks/useBookmarks 관례를 따름 — Supabase 단일 소스, useRef 로 중복 요청 방지.
 * 폴더 수 상한은 서버 트리거(P0001)가 최종 강제 — 클라 검사는 UX 용.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LibraryFolder } from '@/types/database.types'
import { FOLDER_NAME_MAX_LENGTH } from '@/types/database.types'

interface UseLibraryFoldersReturn {
  folders: LibraryFolder[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createFolder: (name: string, emoji?: string) => Promise<LibraryFolder | null>
  renameFolder: (id: string, name: string) => Promise<boolean>
  deleteFolder: (id: string) => Promise<boolean>
}

function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return '폴더 이름을 입력해주세요.'
  if (trimmed.length > FOLDER_NAME_MAX_LENGTH)
    return `폴더 이름은 ${FOLDER_NAME_MAX_LENGTH}자 이하로 입력해주세요.`
  return null
}

export function useLibraryFolders(): UseLibraryFoldersReturn {
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isProcessingRef = useRef(false)

  const fetchFolders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setFolders([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('library_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setFolders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('폴더를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const createFolder = async (name: string, emoji = '📁'): Promise<LibraryFolder | null> => {
    if (isProcessingRef.current) return null
    isProcessingRef.current = true

    try {
      const validationError = validateName(name)
      if (validationError) throw new Error(validationError)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const { data, error: insertError } = await supabase
        .from('library_folders')
        .insert({ user_id: user.id, name: name.trim(), emoji })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setFolders(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Failed to create folder:', err)
      setError(err instanceof Error ? err : new Error('폴더 생성에 실패했습니다.'))
      return null
    } finally {
      isProcessingRef.current = false
    }
  }

  const renameFolder = async (id: string, name: string): Promise<boolean> => {
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    try {
      const validationError = validateName(name)
      if (validationError) throw new Error(validationError)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const { error: updateError } = await supabase
        .from('library_folders')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw new Error(updateError.message)

      setFolders(prev => prev.map(f => (f.id === id ? { ...f, name: name.trim() } : f)))
      return true
    } catch (err) {
      console.error('Failed to rename folder:', err)
      setError(err instanceof Error ? err : new Error('이름 변경에 실패했습니다.'))
      return false
    } finally {
      isProcessingRef.current = false
    }
  }

  const deleteFolder = async (id: string): Promise<boolean> => {
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const { error: deleteError } = await supabase
        .from('library_folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw new Error(deleteError.message)

      setFolders(prev => prev.filter(f => f.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete folder:', err)
      setError(err instanceof Error ? err : new Error('폴더 삭제에 실패했습니다.'))
      return false
    } finally {
      isProcessingRef.current = false
    }
  }

  return {
    folders,
    isLoading,
    error,
    refetch: fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  }
}
