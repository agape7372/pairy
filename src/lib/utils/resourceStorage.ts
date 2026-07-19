/**
 * 자료 게시글(업로드) localStorage 저장소
 *
 * @description
 * 데모 모드에서 사용자가 올린 자료(이메레스/트레틀/페어틀/세션로그/코코포리아/프로그램)
 * 게시글을 localStorage에 저장/불러오는 유틸리티.
 *
 * 주의: 데모(백엔드 없음)에서는 실제 파일 호스팅이 불가하므로
 * - 이미지 미리보기는 data URL로 저장(소형만)
 * - 대용량/프로그램 파일은 외부 배포 링크(externalUrl)를 권장
 */

import type { ResourceCategory, LicenseType } from '@/types/resources'

// ============================================
// 타입
// ============================================

/** 업로드된 파일 메타 */
export interface ResourceFileMeta {
  name: string
  sizeKB: number
  /** 소형 파일만 data URL로 인라인 저장 (데모 한계) */
  dataUrl?: string
}

/** 저장되는 자료 게시글 */
export interface ResourcePost {
  id: string
  title: string
  description: string
  category: ResourceCategory
  tags: string[]
  license: LicenseType
  /** license === 'paid'인 경우 가격(원) */
  price?: number
  /** 미리보기 썸네일 (data URL) — media 카테고리 */
  thumbnail?: string
  /** 첨부 파일 메타 */
  file?: ResourceFileMeta
  /** 외부 다운로드/배포 링크 (대용량·프로그램) */
  externalUrl?: string
  createdAt: string
  updatedAt: string
}

interface StorageData {
  posts: ResourcePost[]
  version: number
}

// ============================================
// 상수
// ============================================

const STORAGE_KEY = 'pairy-resource-posts'
const STORAGE_VERSION = 1

/** localStorage에 인라인 저장할 파일 최대 크기 (약 2MB). 초과 시 dataUrl 생략 */
export const MAX_INLINE_FILE_KB = 2048

// ============================================
// 내부 유틸
// ============================================

function generateResourceId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getStorageData(): StorageData {
  if (typeof window === 'undefined') {
    return { posts: [], version: STORAGE_VERSION }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { posts: [], version: STORAGE_VERSION }
    return JSON.parse(raw) as StorageData
  } catch (err) {
    console.warn('Failed to read resource posts:', err)
    return { posts: [], version: STORAGE_VERSION }
  }
}

function saveStorageData(data: StorageData): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    // QuotaExceededError 등 (대용량 data URL)
    console.error('Failed to save resource posts:', err)
    return false
  }
}

// ============================================
// 공개 API
// ============================================

/** 모든 자료 게시글 */
export function getResourcePosts(): ResourcePost[] {
  return getStorageData().posts
}

/** 카테고리별 자료 게시글 */
export function getResourcePostsByCategory(category: ResourceCategory): ResourcePost[] {
  return getStorageData().posts.filter((p) => p.category === category)
}

/** ID로 조회 */
export function getResourcePostById(id: string): ResourcePost | null {
  return getStorageData().posts.find((p) => p.id === id) || null
}

/** 저장 */
export function saveResourcePost(
  post: Omit<ResourcePost, 'id' | 'createdAt' | 'updatedAt'>
): { success: boolean; postId?: string; error?: string } {
  try {
    const data = getStorageData()
    const now = new Date().toISOString()
    const newPost: ResourcePost = {
      ...post,
      id: generateResourceId(),
      createdAt: now,
      updatedAt: now,
    }
    data.posts.unshift(newPost)

    if (saveStorageData(data)) {
      return { success: true, postId: newPost.id }
    }
    return {
      success: false,
      error: '저장 공간이 부족합니다. 파일 대신 외부 배포 링크를 사용해보세요.',
    }
  } catch (err) {
    console.error('Save resource post error:', err)
    return { success: false, error: '저장 중 오류가 발생했습니다.' }
  }
}

/** 삭제 */
export function deleteResourcePost(id: string): boolean {
  const data = getStorageData()
  const filtered = data.posts.filter((p) => p.id !== id)
  if (filtered.length === data.posts.length) return false
  data.posts = filtered
  return saveStorageData(data)
}

/** 자료 게시글 ID인지 확인 */
export function isResourcePostId(id: string): boolean {
  return id.startsWith('res_')
}

// ============================================
// 아카이브 목록용 뷰모델 변환 (F-16b read-path)
// ============================================

import type { Resource } from '@/types/resources'

/**
 * 데모 업로드(ResourcePost) → 아카이브 목록(Resource) 뷰모델.
 * 데모 모드에서 사용자가 올린 자료가 /templates 아카이브에 보이도록 한다
 * (이전에는 write-only — 올려도 어디에도 표시되지 않았다).
 */
export function toResourceViewModel(post: ResourcePost): Resource {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags,
    creator: {
      id: 'demo-me',
      displayName: '나 (데모 업로드)',
      username: 'me',
      isVerified: false,
    },
    fileInfo: {
      format: [],
      width: 0,
      height: 0,
      sizeKB: post.file?.sizeKB ?? 0,
      hasTransparency: false,
    },
    license: post.license,
    price: post.price,
    stats: { views: 0, downloads: 0, likes: 0, uses: 0 },
    thumbnailUrl: post.thumbnail ?? '',
    previewUrls: post.thumbnail ? [post.thumbnail] : [],
    downloadUrl: post.file?.dataUrl,
    externalUrl: post.externalUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isPremium: false,
  }
}
