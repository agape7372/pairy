'use client'

/**
 * 자료 허브 서버 훅 (M5)
 * - 목록/단건 조회: resources 테이블 + 작성자 프로필 조인 → UI Resource 타입으로 매핑
 * - 게시: 썸네일/파일을 resources 버킷({uid}/... 경로 규약)에 업로드 후 insert
 * 데모 모드는 기존 localStorage(resourceStorage) 경로를 페이지 쪽에서 유지한다.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ResourceRow } from '@/types/database.types'
import type { Resource, ResourceCategory, LicenseType, FileFormat } from '@/types/resources'

// 자료 파일 업로드 상한 (스토리지 낭비 방지)
export const MAX_RESOURCE_FILE_MB = 20

interface ResourceRowWithAuthor extends ResourceRow {
  author: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

const KNOWN_FORMATS: FileFormat[] = ['png', 'jpg', 'psd', 'clip', 'svg', 'webp']

function extToFormat(fileName: string | null): FileFormat[] {
  if (!fileName) return []
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return []
  const normalized = ext === 'jpeg' ? 'jpg' : ext
  return KNOWN_FORMATS.includes(normalized as FileFormat)
    ? [normalized as FileFormat]
    : []
}

/** 서버 row → UI Resource 매핑 */
export function mapRowToResource(row: ResourceRowWithAuthor): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as ResourceCategory,
    tags: row.tags ?? [],
    creator: {
      id: row.author?.id ?? row.author_id,
      displayName: row.author?.display_name ?? row.author?.username ?? '알 수 없음',
      username: row.author?.username ?? '',
      avatarUrl: row.author?.avatar_url ?? undefined,
      isVerified: false,
    },
    fileInfo: {
      format: extToFormat(row.file_name),
      width: 0,
      height: 0,
      sizeKB: row.file_size_kb ?? 0,
      hasTransparency: false,
    },
    license: row.license as LicenseType,
    price: row.price > 0 ? row.price : undefined,
    stats: {
      views: row.view_count,
      downloads: row.download_count,
      likes: 0,
      uses: 0,
    },
    thumbnailUrl: row.thumbnail_url ?? '',
    previewUrls: row.thumbnail_url ? [row.thumbnail_url] : [],
    downloadUrl: row.file_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPremium: false,
  }
}

const AUTHOR_SELECT = '*, author:profiles!resources_author_id_fkey(id, display_name, username, avatar_url)'

/** 자료 목록 (허브) */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('resources')
        .select(AUTHOR_SELECT)
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setResources(((data ?? []) as unknown as ResourceRowWithAuthor[]).map(mapRowToResource))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('자료를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  return { resources, isLoading, error, refetch: fetchResources }
}

/** 자료 단건 조회 */
export function useResource(id: string | null) {
  const [resource, setResource] = useState<Resource | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const { data } = await supabase
          .from('resources')
          .select(AUTHOR_SELECT)
          .eq('id', id)
          .maybeSingle()
        if (!cancelled) {
          setResource(data ? mapRowToResource(data as unknown as ResourceRowWithAuthor) : null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  return { resource, isLoading }
}

// ============================================
// 게시
// ============================================

export interface CreateResourceInput {
  title: string
  description: string
  category: ResourceCategory
  tags: string[]
  license: LicenseType
  price?: number
  /** 미리보기 (data URL) */
  thumbnailDataUrl?: string
  /** 첨부 파일 */
  file?: File
  externalUrl?: string
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** 자료 게시 — 업로드 후 insert. 성공 시 resource id 반환. */
export async function createResource(
  input: CreateResourceInput
): Promise<{ success: boolean; resourceId?: string; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '로그인이 필요해요.' }

    const stamp = Date.now()

    // 썸네일 업로드 (이미지)
    let thumbnailUrl: string | null = null
    if (input.thumbnailDataUrl) {
      const blob = dataUrlToBlob(input.thumbnailDataUrl)
      const ext = blob.type.split('/')[1] ?? 'png'
      const path = `${user.id}/thumbs/${stamp}.${ext}`
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(path, blob, { cacheControl: '3600', upsert: false })
      if (error) return { success: false, error: `미리보기 업로드 실패: ${error.message}` }
      thumbnailUrl = supabase.storage.from('resources').getPublicUrl(data.path).data.publicUrl
    }

    // 첨부 파일 업로드 (임의 형식, 크기 상한)
    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSizeKB: number | null = null
    if (input.file) {
      if (input.file.size > MAX_RESOURCE_FILE_MB * 1024 * 1024) {
        return {
          success: false,
          error: `파일은 ${MAX_RESOURCE_FILE_MB}MB 이하만 업로드할 수 있어요. 대용량은 외부 배포 링크를 사용해주세요.`,
        }
      }
      const path = `${user.id}/files/${stamp}_${input.file.name}`
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(path, input.file, { cacheControl: '3600', upsert: false })
      if (error) return { success: false, error: `파일 업로드 실패: ${error.message}` }
      fileUrl = supabase.storage.from('resources').getPublicUrl(data.path).data.publicUrl
      fileName = input.file.name
      fileSizeKB = Math.round(input.file.size / 1024)
    }

    const { data: inserted, error: insertError } = await supabase
      .from('resources')
      .insert({
        author_id: user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags,
        license: input.license,
        price: input.license === 'paid' ? (input.price ?? 0) : 0,
        thumbnail_url: thumbnailUrl,
        file_url: fileUrl,
        file_name: fileName,
        file_size_kb: fileSizeKB,
        external_url: input.externalUrl ?? null,
      })
      .select('id')
      .single()

    if (insertError) return { success: false, error: insertError.message }
    return { success: true, resourceId: inserted.id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '게시 중 오류가 발생했습니다.',
    }
  }
}
