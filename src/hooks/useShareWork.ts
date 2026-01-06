'use client'

/**
 * 작품 공유 훅 (Production-Ready)
 *
 * 기능:
 * - 공유 링크 생성 (nanoid 기반)
 * - 공유 상태 관리 (private/unlisted/public)
 * - OG 이미지 URL 설정
 * - 조회수 증가
 * - 공유된 작품 조회
 *
 * @example
 * const { generateShareLink, updateShareStatus, getSharedWork } = useShareWork()
 */

import { useState, useCallback, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { Work, ShareStatus } from '@/types/database.types'
import { SHARE_ID_LENGTH } from '@/types/database.types'

// ============================================
// 상수 정의
// ============================================

const DEMO_STORAGE_KEY = 'pairy_shared_works'

/** 공유 ID 문자셋 (URL-safe) */
const SHARE_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// ============================================
// 타입 정의
// ============================================

export interface ShareWorkData {
  shareId: string
  shareUrl: string
  shareStatus: ShareStatus
  ogImageUrl: string | null
  viewCount: number
  publishedAt: string | null
}

export interface UseShareWorkReturn {
  /** 현재 작업 중 여부 */
  isProcessing: boolean
  /** 에러 메시지 */
  error: string | null
  /** 공유 링크 생성 */
  generateShareLink: (workId: string) => Promise<ShareWorkData | null>
  /** 공유 상태 변경 */
  updateShareStatus: (workId: string, status: ShareStatus) => Promise<boolean>
  /** OG 이미지 URL 설정 */
  setOgImage: (workId: string, imageUrl: string) => Promise<boolean>
  /** 공유된 작품 조회 (shareId로) */
  getSharedWork: (shareId: string) => Promise<Work | null>
  /** 조회수 증가 */
  incrementViewCount: (shareId: string) => Promise<boolean>
  /** 공유 정보 조회 */
  getShareInfo: (workId: string) => Promise<ShareWorkData | null>
  /** 공유 해제 (링크 삭제) */
  revokeShare: (workId: string) => Promise<boolean>
  /** 에러 초기화 */
  clearError: () => void
}

// ============================================
// 유틸리티 함수
// ============================================

/** URL-safe 공유 ID 생성 */
function generateShareId(length: number = SHARE_ID_LENGTH): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map((byte) => SHARE_ID_CHARS[byte % SHARE_ID_CHARS.length])
      .join('')
  }
  // Fallback
  let result = ''
  for (let i = 0; i < length; i++) {
    result += SHARE_ID_CHARS[Math.floor(Math.random() * SHARE_ID_CHARS.length)]
  }
  return result
}

/** 공유 URL 생성 */
function buildShareUrl(shareId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/share/${shareId}`
  }
  return `/share/${shareId}`
}

/** 데모 모드 스토리지에서 로드 */
function loadDemoStorage(): Record<string, Partial<Work>> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/** 데모 모드 스토리지에 저장 */
function saveDemoStorage(data: Record<string, Partial<Work>>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('[useShareWork] localStorage 저장 실패:', error)
  }
}

// ============================================
// 훅 구현
// ============================================

export function useShareWork(): UseShareWorkReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const processingRef = useRef(false)

  const clearError = useCallback(() => setError(null), [])

  /**
   * 공유 링크 생성
   * - 이미 공유 링크가 있으면 기존 링크 반환
   * - 없으면 새로 생성
   */
  const generateShareLink = useCallback(async (
    workId: string
  ): Promise<ShareWorkData | null> => {
    if (processingRef.current) return null
    processingRef.current = true
    setIsProcessing(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage 사용
        const storage = loadDemoStorage()
        const existing = storage[workId]

        if (existing?.share_id) {
          // 기존 공유 링크 반환
          return {
            shareId: existing.share_id,
            shareUrl: buildShareUrl(existing.share_id),
            shareStatus: (existing.share_status as ShareStatus) || 'unlisted',
            ogImageUrl: existing.og_image_url || null,
            viewCount: existing.view_count || 0,
            publishedAt: existing.published_at || null,
          }
        }

        // 새 공유 링크 생성
        const shareId = generateShareId()
        const now = new Date().toISOString()
        storage[workId] = {
          ...existing,
          share_id: shareId,
          share_status: 'unlisted',
          view_count: 0,
          published_at: now,
        }
        saveDemoStorage(storage)

        return {
          shareId,
          shareUrl: buildShareUrl(shareId),
          shareStatus: 'unlisted',
          ogImageUrl: null,
          viewCount: 0,
          publishedAt: now,
        }
      }

      // Supabase 모드
      const supabase = createClient()

      // 기존 공유 정보 확인
      const { data: existing, error: fetchError } = await supabase
        .from('works')
        .select('share_id, share_status, og_image_url, view_count, published_at')
        .eq('id', workId)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      if (existing?.share_id) {
        // 기존 공유 링크 반환
        return {
          shareId: existing.share_id,
          shareUrl: buildShareUrl(existing.share_id),
          shareStatus: existing.share_status as ShareStatus,
          ogImageUrl: existing.og_image_url,
          viewCount: existing.view_count,
          publishedAt: existing.published_at,
        }
      }

      // 새 공유 ID 생성 (중복 체크)
      let shareId: string
      let attempts = 0
      const maxAttempts = 5

      do {
        shareId = generateShareId()
        const { data: duplicate } = await supabase
          .from('works')
          .select('id')
          .eq('share_id', shareId)
          .maybeSingle()

        if (!duplicate) break
        attempts++
      } while (attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        throw new Error('공유 링크 생성에 실패했습니다. 다시 시도해주세요.')
      }

      // 공유 정보 업데이트
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('works')
        .update({
          share_id: shareId,
          share_status: 'unlisted',
          published_at: now,
          updated_at: now,
        })
        .eq('id', workId)

      if (updateError) throw new Error(updateError.message)

      return {
        shareId,
        shareUrl: buildShareUrl(shareId),
        shareStatus: 'unlisted',
        ogImageUrl: null,
        viewCount: 0,
        publishedAt: now,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '공유 링크 생성에 실패했습니다.'
      setError(message)
      console.error('[useShareWork] generateShareLink error:', err)
      return null
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [])

  /**
   * 공유 상태 변경
   */
  const updateShareStatus = useCallback(async (
    workId: string,
    status: ShareStatus
  ): Promise<boolean> => {
    if (processingRef.current) return false
    processingRef.current = true
    setIsProcessing(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        const storage = loadDemoStorage()
        storage[workId] = {
          ...storage[workId],
          share_status: status,
        }
        saveDemoStorage(storage)
        return true
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('works')
        .update({
          share_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workId)

      if (updateError) throw new Error(updateError.message)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '공유 상태 변경에 실패했습니다.'
      setError(message)
      console.error('[useShareWork] updateShareStatus error:', err)
      return false
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [])

  /**
   * OG 이미지 URL 설정
   */
  const setOgImage = useCallback(async (
    workId: string,
    imageUrl: string
  ): Promise<boolean> => {
    if (processingRef.current) return false
    processingRef.current = true
    setIsProcessing(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        const storage = loadDemoStorage()
        storage[workId] = {
          ...storage[workId],
          og_image_url: imageUrl,
        }
        saveDemoStorage(storage)
        return true
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('works')
        .update({
          og_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workId)

      if (updateError) throw new Error(updateError.message)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OG 이미지 설정에 실패했습니다.'
      setError(message)
      console.error('[useShareWork] setOgImage error:', err)
      return false
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [])

  /**
   * 공유된 작품 조회 (shareId로)
   */
  const getSharedWork = useCallback(async (shareId: string): Promise<Work | null> => {
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: 전체 스토리지에서 검색
        const storage = loadDemoStorage()
        const entry = Object.entries(storage).find(
          ([, data]) => data.share_id === shareId
        )

        if (!entry) return null

        // 데모용 가짜 Work 데이터 반환
        const [workId, shareData] = entry
        return {
          id: workId,
          user_id: 'demo-user',
          template_id: 'demo-template',
          title: '데모 작품',
          thumbnail_url: null,
          editor_data: {},
          is_complete: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          share_id: shareData.share_id || null,
          share_status: (shareData.share_status as ShareStatus) || 'private',
          og_image_url: shareData.og_image_url || null,
          view_count: shareData.view_count || 0,
          published_at: shareData.published_at || null,
          character_ids: [],
        } as Work
      }

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('works')
        .select('*')
        .eq('share_id', shareId)
        .neq('share_status', 'private') // private은 조회 불가
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // 결과 없음
          return null
        }
        throw new Error(fetchError.message)
      }

      return data as Work
    } catch (err) {
      const message = err instanceof Error ? err.message : '작품을 불러오지 못했습니다.'
      setError(message)
      console.error('[useShareWork] getSharedWork error:', err)
      return null
    }
  }, [])

  /**
   * 조회수 증가 (중복 방지는 서버에서 처리)
   */
  const incrementViewCount = useCallback(async (shareId: string): Promise<boolean> => {
    try {
      if (IS_DEMO_MODE) {
        const storage = loadDemoStorage()
        const entry = Object.entries(storage).find(
          ([, data]) => data.share_id === shareId
        )

        if (entry) {
          const [workId, data] = entry
          storage[workId] = {
            ...data,
            view_count: (data.view_count || 0) + 1,
          }
          saveDemoStorage(storage)
        }
        return true
      }

      const supabase = createClient()

      // 조회수 증가 (단순 read-then-write 방식)
      // 참고: 동시성 이슈가 발생할 수 있지만, 조회수의 경우 약간의 오차는 허용 가능
      const { data } = await supabase
        .from('works')
        .select('view_count')
        .eq('share_id', shareId)
        .single()

      if (data) {
        await supabase
          .from('works')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('share_id', shareId)
      }

      return true
    } catch (err) {
      console.error('[useShareWork] incrementViewCount error:', err)
      return false
    }
  }, [])

  /**
   * 공유 정보 조회
   */
  const getShareInfo = useCallback(async (workId: string): Promise<ShareWorkData | null> => {
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        const storage = loadDemoStorage()
        const data = storage[workId]

        if (!data?.share_id) return null

        return {
          shareId: data.share_id,
          shareUrl: buildShareUrl(data.share_id),
          shareStatus: (data.share_status as ShareStatus) || 'private',
          ogImageUrl: data.og_image_url || null,
          viewCount: data.view_count || 0,
          publishedAt: data.published_at || null,
        }
      }

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('works')
        .select('share_id, share_status, og_image_url, view_count, published_at')
        .eq('id', workId)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      if (!data?.share_id) return null

      return {
        shareId: data.share_id,
        shareUrl: buildShareUrl(data.share_id),
        shareStatus: data.share_status as ShareStatus,
        ogImageUrl: data.og_image_url,
        viewCount: data.view_count,
        publishedAt: data.published_at,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '공유 정보를 불러오지 못했습니다.'
      setError(message)
      console.error('[useShareWork] getShareInfo error:', err)
      return null
    }
  }, [])

  /**
   * 공유 해제 (링크 삭제)
   */
  const revokeShare = useCallback(async (workId: string): Promise<boolean> => {
    if (processingRef.current) return false
    processingRef.current = true
    setIsProcessing(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        const storage = loadDemoStorage()
        if (storage[workId]) {
          delete storage[workId].share_id
          storage[workId].share_status = 'private'
          storage[workId].published_at = null
          saveDemoStorage(storage)
        }
        return true
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('works')
        .update({
          share_id: null,
          share_status: 'private',
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workId)

      if (updateError) throw new Error(updateError.message)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '공유 해제에 실패했습니다.'
      setError(message)
      console.error('[useShareWork] revokeShare error:', err)
      return false
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    error,
    generateShareLink,
    updateShareStatus,
    setOgImage,
    getSharedWork,
    incrementViewCount,
    getShareInfo,
    revokeShare,
    clearError,
  }
}

export default useShareWork
