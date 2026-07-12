'use client'

import { Suspense, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileUp,
  Link2,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { ImageUpload } from '@/components/ui/image-upload'
import { cn } from '@/lib/utils/cn'
import {
  RESOURCE_CATEGORIES,
  CATEGORY_TAGS,
  LICENSE_INFO,
  type ResourceCategory,
  type LicenseType,
} from '@/types/resources'
import {
  saveResourcePost,
  MAX_INLINE_FILE_KB,
  type ResourceFileMeta,
} from '@/lib/utils/resourceStorage'
import { createResource, MAX_RESOURCE_FILE_MB } from '@/hooks/useResources'
import { IS_DEMO_MODE } from '@/lib/supabase/client'

const CATEGORY_KEYS = Object.keys(RESOURCE_CATEGORIES) as ResourceCategory[]
const LICENSE_KEYS = Object.keys(LICENSE_INFO) as LicenseType[]

/** File → data URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function NewResourceForm() {
  const router = useRouter()
  const toast = useToast()
  const searchParams = useSearchParams()

  // 카테고리 프리셋 (?category=)
  const presetCategory = searchParams.get('category') as ResourceCategory | null
  const initialCategory: ResourceCategory | null =
    presetCategory && CATEGORY_KEYS.includes(presetCategory) ? presetCategory : null

  const [category, setCategory] = useState<ResourceCategory | null>(initialCategory)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [file, setFile] = useState<ResourceFileMeta | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null) // 프로덕션 스토리지 업로드용 원본
  const [externalUrl, setExternalUrl] = useState('')
  const [license, setLicense] = useState<LicenseType>('free')
  const [price, setPrice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const uploadMode = category ? RESOURCE_CATEGORIES[category].uploadMode : null
  const availableTags = category ? CATEGORY_TAGS[category] : []

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // 카테고리 변경 시 카테고리 종속 상태 초기화
  const handleCategoryChange = (next: ResourceCategory) => {
    setCategory(next)
    setSelectedTags([])
    setFileError(null)
  }

  const handleThumbnailUpload = useCallback(async (f: File) => {
    return fileToDataUrl(f)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileError(null)

    const sizeKB = Math.round(f.size / 1024)
    const meta: ResourceFileMeta = { name: f.name, sizeKB }

    if (!IS_DEMO_MODE) {
      // 프로덕션: 스토리지 업로드 — 원본 File 만 들고 있으면 됨
      if (sizeKB > MAX_RESOURCE_FILE_MB * 1024) {
        setFileError(
          `파일이 ${MAX_RESOURCE_FILE_MB}MB를 초과해요. 대용량은 외부 배포 링크를 사용해주세요.`
        )
        setRawFile(null)
        setFile(null)
        return
      }
      setRawFile(f)
      setFile(meta)
      return
    }

    // 데모: 소형 파일만 인라인 저장, 대용량은 외부 링크 권장
    if (sizeKB <= MAX_INLINE_FILE_KB) {
      try {
        meta.dataUrl = await fileToDataUrl(f)
      } catch {
        setFileError('파일을 읽지 못했습니다.')
        return
      }
    } else {
      setFileError(
        `파일이 ${MAX_INLINE_FILE_KB / 1024}MB를 초과해 데모에선 직접 저장할 수 없어요. 외부 배포 링크를 입력해주세요.`
      )
    }
    setFile(meta)
  }, [])

  // 유효성
  const trimmedUrl = externalUrl.trim()
  const hasFilePayload = IS_DEMO_MODE ? Boolean(file?.dataUrl) : Boolean(rawFile)
  const hasDeliverable = Boolean(thumbnail || hasFilePayload || trimmedUrl)
  const urlValid = trimmedUrl === '' || isValidUrl(trimmedUrl)
  const canSubmit =
    Boolean(category) &&
    title.trim().length > 0 &&
    hasDeliverable &&
    urlValid &&
    (license !== 'paid' || Number(price) > 0) &&
    !isSaving

  const handleSubmit = async () => {
    if (!category) {
      toast.error('카테고리를 선택해주세요.')
      return
    }
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    if (!urlValid) {
      toast.error('올바른 링크(http/https)를 입력해주세요.')
      return
    }
    if (!hasDeliverable) {
      toast.error(
        uploadMode === 'media'
          ? '미리보기 이미지나 파일, 링크 중 하나는 필요해요.'
          : '파일 또는 외부 배포 링크가 필요해요.'
      )
      return
    }
    if (license === 'paid' && !(Number(price) > 0)) {
      toast.error('유료 자료는 가격을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // 프로덕션: resources 테이블 + 스토리지 (M5)
      if (!IS_DEMO_MODE) {
        const result = await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          tags: selectedTags,
          license,
          price: license === 'paid' ? Number(price) : undefined,
          thumbnailDataUrl: thumbnail || undefined,
          file: rawFile || undefined,
          externalUrl: trimmedUrl || undefined,
        })
        if (result.success) {
          toast.success('자료가 업로드되었어요!')
          router.push('/templates')
        } else {
          toast.error(result.error || '업로드에 실패했습니다.')
        }
        return
      }

      // 데모: localStorage
      const result = saveResourcePost({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: selectedTags,
        license,
        price: license === 'paid' ? Number(price) : undefined,
        thumbnail: thumbnail || undefined,
        file: file || undefined,
        externalUrl: trimmedUrl || undefined,
      })

      if (result.success) {
        toast.success('자료가 업로드되었어요!')
        router.push('/templates')
      } else {
        toast.error(result.error || '업로드에 실패했습니다.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/templates"
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="뒤로"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 truncate">자료 업로드</h1>
          </div>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="shrink-0">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                게시하기
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* 안내 */}
        <p className="text-sm text-gray-500">
          이미지 자료(이메레스·트레틀·페어틀)는 미리보기와 함께, 프로그램·세션 파일(세션로그·코코포리아·프로그램)은
          파일이나 배포 링크로 올려주세요.{' '}
          <Link href="/templates/new" className="text-accent-600 font-medium hover:underline">
            페어틀 템플릿을 직접 제작
          </Link>
          하려면 템플릿 만들기로 가세요.
        </p>

        {/* 1. 카테고리 선택 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            1. 자료 종류 <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORY_KEYS.map((key) => {
              const info = RESOURCE_CATEGORIES[key]
              const active = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
                    active
                      ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300'
                      : 'border-gray-200 bg-white hover:border-primary-200'
                  )}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span className="font-semibold text-gray-900 text-sm">{info.nameKo}</span>
                  <span className="text-[11px] text-gray-500 line-clamp-2">{info.description}</span>
                  <span
                    className={cn(
                      'mt-1 text-[10px] px-1.5 py-0.5 rounded-full',
                      info.uploadMode === 'media'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {info.uploadMode === 'media' ? '이미지+파일' : '파일 전용'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {category && (
          <>
            {/* 2. 기본 정보 */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">2. 기본 정보</h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="자료 이름을 입력하세요"
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="자료 소개, 사용법, 주의사항 등"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm resize-none"
                />
              </div>
            </section>

            {/* 3. 업로드 */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">
                3. {uploadMode === 'media' ? '이미지 & 파일' : '파일'}
              </h2>

              {uploadMode === 'media' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    미리보기 이미지
                  </label>
                  <ImageUpload
                    value={thumbnail}
                    onChange={setThumbnail}
                    onUpload={handleThumbnailUpload}
                    size="lg"
                    placeholder="미리보기 업로드"
                  />
                </div>
              )}

              {/* 파일 첨부 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  파일 {uploadMode === 'file' && <span className="text-red-500">*</span>}
                  {uploadMode === 'media' && <span className="text-gray-400"> (선택)</span>}
                </label>
                {file ? (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileUp className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {file.sizeKB >= 1024
                          ? `${(file.sizeKB / 1024).toFixed(1)}MB`
                          : `${file.sizeKB}KB`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setRawFile(null)
                        setFileError(null)
                      }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      aria-label="파일 제거"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer text-sm text-gray-500">
                    <Upload className="w-4 h-4" />
                    파일 선택
                    <input type="file" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
                {fileError && <p className="text-xs text-amber-600 mt-1">{fileError}</p>}
              </div>

              {/* 외부 배포 링크 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  외부 배포 링크
                  {uploadMode === 'file' && (
                    <span className="text-gray-400"> (대용량·프로그램 권장)</span>
                  )}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://github.com/... , 배포 페이지 등"
                    className={cn(
                      'w-full pl-9 pr-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm',
                      urlValid ? 'border-gray-200' : 'border-red-300'
                    )}
                  />
                </div>
                {!urlValid && (
                  <p className="text-xs text-red-500 mt-1">http:// 또는 https:// 링크만 가능해요.</p>
                )}
              </div>
            </section>

            {/* 4. 태그 */}
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">4. 태그</h2>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm border transition-colors',
                        active
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 5. 라이선스 */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">5. 라이선스</h2>
              <div className="grid grid-cols-2 gap-2">
                {LICENSE_KEYS.map((key) => {
                  const info = LICENSE_INFO[key]
                  const active = license === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLicense(key)}
                      className={cn(
                        'flex items-start gap-2 p-3 rounded-xl border text-left transition-all',
                        active
                          ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300'
                          : 'border-gray-200 bg-white hover:border-primary-200'
                      )}
                    >
                      <span className="text-lg leading-none">{info.icon}</span>
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{info.name}</span>
                        <span className="block text-[11px] text-gray-500">{info.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {license === 'paid' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    가격 (원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1000"
                    className="w-40 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                  />
                </div>
              )}
            </section>

            {/* 하단 게시 버튼 */}
            <div className="pt-2">
              <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    게시하기
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function NewResourcePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <NewResourceForm />
    </Suspense>
  )
}
