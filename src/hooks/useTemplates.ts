'use client'

/**
 * 템플릿 목록 조회 훅
 * [FIXED: 무한루프 방지 - fetchTemplates를 useCallback으로 래핑하여 안정적인 참조 보장]
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Template, Tag } from '@/types/database.types'

export interface TemplateWithDetails extends Template {
  tags: Tag[]
  creator: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface UseTemplatesOptions {
  tag?: string
  search?: string
  limit?: number
  sortBy?: 'popular' | 'recent' | 'likes'
}

interface UseTemplatesReturn {
  templates: TemplateWithDetails[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  hasMore: boolean
  loadMore: () => void
}

export function useTemplates(options: UseTemplatesOptions = {}): UseTemplatesReturn {
  const { tag, search, limit = 12, sortBy = 'popular' } = options
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // [FIXED: 무한루프 방지 - offset을 ref로 추적하여 useCallback 의존성에서 제거]
  const offsetRef = useRef(offset)
  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  // [FIXED: useCallback으로 래핑하여 안정적인 참조 보장]
  const fetchTemplates = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offsetRef.current

    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // 기본 템플릿 쿼리
      let query = supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .range(currentOffset, currentOffset + limit - 1)

      // 정렬
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'likes') {
        query = query.order('like_count', { ascending: false })
      } else {
        query = query.order('like_count', { ascending: false })
      }

      // 검색
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // 템플릿에 대한 추가 데이터 가져오기 (필요시)
      const transformedData: TemplateWithDetails[] = (data || []).map((template) => ({
        ...template,
        tags: [], // TODO: 태그 데이터 별도 로드
        creator: null, // TODO: 크리에이터 데이터 별도 로드
      }))

      // 태그 필터링 (클라이언트 측)
      const filteredData = tag && tag !== '전체'
        ? transformedData.filter(t => t.tags.some(tg => tg.name === tag))
        : transformedData

      if (reset) {
        setTemplates(filteredData)
        setOffset(limit)
      } else {
        setTemplates(prev => [...prev, ...filteredData])
        setOffset(prev => prev + limit)
      }

      setHasMore(filteredData.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch templates'))
    } finally {
      setIsLoading(false)
    }
  }, [tag, search, sortBy, limit])

  // [FIXED: fetchTemplates가 안정적이므로 ESLint 경고 없음]
  useEffect(() => {
    fetchTemplates(true)
  }, [fetchTemplates])

  const refetch = useCallback(() => fetchTemplates(true), [fetchTemplates])
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTemplates(false)
    }
  }, [isLoading, hasMore, fetchTemplates])

  return { templates, isLoading, error, refetch, hasMore, loadMore }
}

// 단일 템플릿 가져오기
export function useTemplate(id: string) {
  const [template, setTemplate] = useState<TemplateWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('templates')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        const transformedData: TemplateWithDetails = {
          ...data,
          tags: [], // TODO: 태그 데이터 별도 로드
          creator: null, // TODO: 크리에이터 데이터 별도 로드
        }

        setTemplate(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch template'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchTemplate()
    }
  }, [id])

  return { template, isLoading, error }
}
