import { createClient, IS_DEMO_MODE } from './client'

export type StorageBucket =
  | 'avatars'
  | 'works'
  | 'templates'
  | 'editor-assets'

interface UploadOptions {
  bucket: StorageBucket
  path: string
  file: File
  upsert?: boolean
}

interface UploadResult {
  url: string | null
  error: Error | null
}

export interface EditorImageUploadResult {
  url: string | null
  path: string | null
  error: Error | null
}

const EDITOR_IMAGE_MAX_SIZE = 10 * 1024 * 1024
const EDITOR_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

function sanitizeStorageSegment(value: string, fallback: string): string {
  const sanitized = value
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  return sanitized || fallback
}

function createUploadNonce(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 14)
}

/**
 * 에디터 이미지를 새로고침과 기기 간 협업에서도 유효한 공개 URL로 저장한다.
 *
 * 첫 경로 세그먼트는 RLS가 auth.uid()와 대조하므로 userId를 변형하지 않는다.
 */
export async function uploadEditorImage(
  userId: string,
  documentId: string,
  slotId: string,
  blob: Blob
): Promise<EditorImageUploadResult> {
  if (IS_DEMO_MODE) {
    return {
      url: null,
      path: null,
      error: new Error('에디터 이미지 저장소를 사용할 수 없습니다.'),
    }
  }

  const extension = EDITOR_IMAGE_EXTENSIONS[blob.type]
  if (!extension) {
    return {
      url: null,
      path: null,
      error: new Error('지원하지 않는 이미지 형식입니다.'),
    }
  }

  if (blob.size <= 0 || blob.size > EDITOR_IMAGE_MAX_SIZE) {
    return {
      url: null,
      path: null,
      error: new Error('이미지 파일은 10MB 이하여야 합니다.'),
    }
  }

  if (!userId || userId.includes('/')) {
    return {
      url: null,
      path: null,
      error: new Error('유효하지 않은 사용자 경로입니다.'),
    }
  }

  const safeDocumentId = sanitizeStorageSegment(documentId, 'document')
  const safeSlotId = sanitizeStorageSegment(slotId, 'slot')
  const path =
    `${userId}/${safeDocumentId}/` +
    `${safeSlotId}_${Date.now()}_${createUploadNonce()}.${extension}`

  try {
    const supabase = createClient()
    const bucket = supabase.storage.from('editor-assets')
    const { data, error } = await bucket.upload(path, blob, {
      cacheControl: '31536000',
      upsert: false,
      contentType: blob.type,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path,
      error: null,
    }
  } catch (error) {
    return {
      url: null,
      path: null,
      error:
        error instanceof Error
          ? error
          : new Error('에디터 이미지 업로드에 실패했습니다.'),
    }
  }
}

/** 업로드가 늦게 끝나 더 이상 사용되지 않는 에디터 이미지를 정리한다. */
export async function deleteEditorImage(path: string): Promise<boolean> {
  if (!path || IS_DEMO_MODE) return false
  return deleteFile('editor-assets', path)
}

/**
 * 파일 업로드
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, path, file, upsert = true } = options

  // 데모 모드: 로컬 Blob URL 반환
  // 주의: Blob URL은 페이지 언로드 시 자동 해제됨
  // 장기 세션에서는 수동 해제 필요할 수 있음
  if (IS_DEMO_MODE) {
    const url = URL.createObjectURL(file)
    // 세션 종료 시 자동 정리되지만, 명시적 revoke를 위한 추적 가능
    if (typeof window !== 'undefined') {
      // 페이지 언로드 시 정리 (선택적)
      const cleanup = () => URL.revokeObjectURL(url)
      window.addEventListener('beforeunload', cleanup, { once: true })
    }
    return { url, error: null }
  }

  try {
    const supabase = createClient()

    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    if (!fileExt || !allowedExts.includes(fileExt)) {
      throw new Error('지원하지 않는 파일 형식입니다. (jpg, png, gif, webp만 가능)')
    }

    // 파일 크기 확인 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.')
    }

    // 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert,
      })

    if (error) throw error

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error('업로드에 실패했습니다.'),
    }
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  // 데모 모드: 항상 성공 반환
  if (IS_DEMO_MODE) {
    return true
  }

  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error

    return true
  } catch (err) {
    console.error('Failed to delete file:', err)
    return false
  }
}

/**
 * 아바타 업로드
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/avatar.${fileExt}`

  return uploadFile({
    bucket: 'avatars',
    path,
    file,
    upsert: true,
  })
}

/**
 * 작업 이미지 업로드
 */
export async function uploadWorkImage(
  workId: string,
  slotId: string,
  file: File
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const path = `${workId}/${slotId}_${timestamp}.${fileExt}`

  return uploadFile({
    bucket: 'works',
    path,
    file,
    upsert: false,
  })
}

/**
 * 작업 썸네일 업로드
 */
export async function uploadWorkThumbnail(
  workId: string,
  file: File
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop() || 'jpg'
  const path = `${workId}/thumbnail.${fileExt}`

  return uploadFile({
    bucket: 'works',
    path,
    file,
    upsert: true,
  })
}

/**
 * 이미지 리사이즈 (캔버스 사용)
 */
export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // 비율 유지하며 리사이즈
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.readAsDataURL(file)
  })
}
