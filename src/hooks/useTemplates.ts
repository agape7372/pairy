'use client'

/**
 * 템플릿 목록 조회 훅
 * [FIXED: 무한루프 방지 - fetchTemplates를 useCallback으로 래핑하여 안정적인 참조 보장]
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Template, Tag } from '@/types/database.types'
import type { Resource } from '@/types/resources'

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

      // 기본 템플릿 쿼리 (크리에이터 표시 정보 조인 — 카드/상세 by-line 용)
      let query = supabase
        .from('templates')
        .select('*, creator:profiles!creator_id(id, display_name, avatar_url)')
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
        ...(template as unknown as Template & { creator: TemplateWithDetails['creator'] }),
        tags: [], // TODO: 태그 데이터 별도 로드
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

// 단일 템플릿 가져오기 (id=null 이면 조회하지 않음 — 조건부 폴백용)
export function useTemplate(id: string | null) {
  const [template, setTemplate] = useState<TemplateWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setTemplate(null)
      setIsLoading(false)
      return
    }

    const fetchTemplate = async () => {
      try {
        setError(null)

        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('templates')
          .select('*, creator:profiles!creator_id(id, display_name, avatar_url)')
          .eq('id', id)
          .maybeSingle()

        if (fetchError) throw fetchError

        setTemplate(
          data
            ? {
                ...(data as unknown as Template & { creator: TemplateWithDetails['creator'] }),
                tags: [],
              }
            : null
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch template'))
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchTemplate()
  }, [id])

  return { template, isLoading, error }
}

/**
 * 서버 templates 행 → 아카이브/상세가 쓰는 Resource 뷰모델 (F-16a read-path).
 * 배경: 업로드는 templates 테이블에 저장되는데 /templates 아카이브·상세가
 * 이 테이블을 읽지 않아 게시한 틀이 어디에도 보이지 않았다 (2026-07-19 리포트).
 */
export function templateToResource(t: TemplateWithDetails): Resource {
  const price = Number(t.price ?? 0)
  const isPaid = t.pricing_type === 'paid' && price > 0
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    category: 'pairtl',
    tags: t.tags.map((tag) => tag.name),
    creator: {
      id: t.creator?.id ?? t.creator_id ?? '',
      displayName: t.creator?.display_name ?? '크리에이터',
      username: t.creator?.id ?? '',
      avatarUrl: t.creator?.avatar_url ?? undefined,
      isVerified: false,
    },
    fileInfo: { format: [], width: 0, height: 0, sizeKB: 0, hasTransparency: false },
    license: isPaid ? 'paid' : 'free',
    price: isPaid ? price : undefined,
    stats: {
      views: 0,
      downloads: t.use_count ?? 0,
      likes: t.like_count ?? 0,
      uses: t.use_count ?? 0,
    },
    thumbnailUrl: t.preview_url,
    previewUrls: t.preview_url ? [t.preview_url] : [],
    createdAt: t.created_at ?? new Date().toISOString(),
    updatedAt: t.updated_at ?? t.created_at ?? new Date().toISOString(),
    isPremium: t.is_premium ?? false,
  }
}
