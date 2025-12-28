import { createClient, IS_DEMO_MODE } from './client'

export type StorageBucket = 'avatars' | 'works' | 'templates'

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

/**
 * 파일 업로드
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, path, file, upsert = true } = options

  // 데모 모드: 로컬 Blob URL 반환
  if (IS_DEMO_MODE) {
    const url = URL.createObjectURL(file)
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
  const fileExt = file.name.split('.').pop()
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
  const fileExt = file.name.split('.').pop()
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
  const fileExt = file.name.split('.').pop()
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
