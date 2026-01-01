'use client'

/**
 * 작업 관리 훅
 * [FIXED: useRef로 race condition 방지 - 빠른 더블클릭 시 중복 요청 방지]
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Work, Json } from '@/types/database.types'

export interface WorkWithTemplate extends Work {
  template: {
    id: string
    title: string
    preview_url: string
  } | null
}

interface UseWorksOptions {
  status?: 'all' | 'completed' | 'draft'
}

interface UseWorksReturn {
  works: WorkWithTemplate[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  createWork: (templateId: string, title: string) => Promise<string | null>
  updateWork: (id: string, data: Partial<Work>) => Promise<boolean>
  deleteWork: (id: string) => Promise<boolean>
}

export function useWorks(options: UseWorksOptions = {}): UseWorksReturn {
  const { status = 'all' } = options
  const [works, setWorks] = useState<WorkWithTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // [FIXED: useRef로 동기적 체크 - 상태는 비동기라 race condition 발생 가능]
  const isProcessingRef = useRef(false)

  const fetchWorks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorks([])
        return
      }

      let query = supabase
        .from('works')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      // 상태 필터
      if (status === 'completed') {
        query = query.eq('is_complete', true)
      } else if (status === 'draft') {
        query = query.eq('is_complete', false)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // 템플릿 정보는 별도로 로드 (TODO: 필요시 구현)
      const transformedData: WorkWithTemplate[] = (data || []).map((work) => ({
        ...work,
        template: null, // TODO: 템플릿 데이터 별도 로드
      }))

      setWorks(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch works'))
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchWorks()
  }, [fetchWorks])

  // 새 작업 생성
  const createWork = async (templateId: string, title: string): Promise<string | null> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return null
    isProcessingRef.current = true

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        isProcessingRef.current = false
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('works')
        .insert({
          user_id: user.id,
          template_id: templateId,
          title,
          editor_data: {},
          is_complete: false,
        })
        .select('id')
        .single()

      if (error) throw error

      await fetchWorks()
      return data.id
    } catch (err) {
      console.error('Failed to create work:', err)
      return null
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }

  // 작업 업데이트
  const updateWork = async (id: string, updateData: Partial<Work>): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('works')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await fetchWorks()
      return true
    } catch (err) {
      console.error('Failed to update work:', err)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }

  // 작업 삭제
  const deleteWork = async (id: string): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', id)

      if (error) throw error

      setWorks(prev => prev.filter(w => w.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete work:', err)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }

  return {
    works,
    isLoading,
    error,
    refetch: fetchWorks,
    createWork,
    updateWork,
    deleteWork,
  }
}

// 단일 작업 가져오기
export function useWork(id: string) {
  const [work, setWork] = useState<WorkWithTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // [FIXED: useRef로 동기적 체크 - 상태는 비동기라 race condition 발생 가능]
  const isProcessingRef = useRef(false)

  const fetchWork = useCallback(async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('works')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // 템플릿 정보는 별도로 로드
      const transformedData: WorkWithTemplate = {
        ...data,
        template: null, // TODO: 템플릿 데이터 별도 로드
      }

      setWork(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch work'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchWork()
  }, [fetchWork])

  // 작업 저장
  const saveWork = async (editorData: Json, options?: { isComplete?: boolean }) => {
    if (!id) return false

    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('works')
        .update({
          editor_data: editorData,
          is_complete: options?.isComplete ?? work?.is_complete,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await fetchWork()
      return true
    } catch (err) {
      console.error('Failed to save work:', err)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }

  return { work, isLoading, error, refetch: fetchWork, saveWork }
}
