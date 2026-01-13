'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  X,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { IS_DEMO_MODE } from '@/lib/supabase/client'
import { saveCustomTemplate } from '@/lib/utils/customTemplateStorage'
import PSDUploader from '@/components/editor/psd/PSDUploader'
import PSDCanvas from '@/components/editor/psd/PSDCanvas'

// 이모지 옵션
const EMOJI_OPTIONS = ['💕', '✨', '🌙', '🍀', '🔺', '📋', '🌸', '🥥', '💜', '🎀', '⭐', '🌈', '🎨', '🎭', '🎮', '🎵']

// 태그 옵션
const TAG_OPTIONS = ['커플', '친구', '관계도', '프로필', '1인용', '2인용', '3인용+', 'OC', '팬아트']

// 슬롯 타입
interface TemplateSlot {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

// 필드 타입
interface TemplateField {
  id: string
  slotId: string
  label: string
  type: 'text' | 'image'
}

export default function NewTemplatePage() {
  const router = useRouter()
  const toast = useToast()

  // 템플릿 기본 정보
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('💕')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 슬롯과 필드
  const [slots, setSlots] = useState<TemplateSlot[]>([
    { id: 'slot1', label: '슬롯 1', x: 50, y: 50, width: 200, height: 280 },
  ])
  const [fields, setFields] = useState<TemplateField[]>([
    { id: 'name1', slotId: 'slot1', label: '이름', type: 'text' },
  ])

  // UI 상태
  const [selectedSlot, setSelectedSlot] = useState<string | null>('slot1')
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 캔버스 크기 (PSD에서 가져오거나 기본값 사용)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })

  // PSD 이미지 데이터
  const [compositeImage, setCompositeImage] = useState<string | undefined>()
  const [psdLayers, setPsdLayers] = useState<Array<{
    id: string
    name: string
    imageUrl?: string
    x: number
    y: number
    width: number
    height: number
    visible: boolean
  }>>([])
  const hasPsdImage = Boolean(compositeImage || psdLayers.length > 0)

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // 슬롯 추가
  const addSlot = () => {
    const newId = `slot${slots.length + 1}`
    const newSlot: TemplateSlot = {
      id: newId,
      label: `슬롯 ${slots.length + 1}`,
      x: 50 + slots.length * 30,
      y: 50 + slots.length * 30,
      width: 200,
      height: 280,
    }
    setSlots([...slots, newSlot])
    setSelectedSlot(newId)
    // 기본 필드 추가
    setFields([...fields, { id: `name_${newId}`, slotId: newId, label: '이름', type: 'text' }])
  }

  // 슬롯 삭제
  const removeSlot = (slotId: string) => {
    if (slots.length <= 1) return
    setSlots(slots.filter((s) => s.id !== slotId))
    setFields(fields.filter((f) => f.slotId !== slotId))
    if (selectedSlot === slotId) {
      setSelectedSlot(slots[0]?.id || null)
    }
  }

  // 슬롯 업데이트
  const updateSlot = (slotId: string, updates: Partial<TemplateSlot>) => {
    setSlots(slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)))
  }

  // 필드 추가
  const addField = (slotId: string) => {
    const slotFields = fields.filter((f) => f.slotId === slotId)
    const newField: TemplateField = {
      id: `field_${slotId}_${slotFields.length + 1}`,
      slotId,
      label: `필드 ${slotFields.length + 1}`,
      type: 'text',
    }
    setFields([...fields, newField])
  }

  // 필드 삭제
  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  // 필드 업데이트
  const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  // PSD 변환 결과 적용
  const handlePSDConvert = useCallback((data: {
    documentSize: {
      width: number
      height: number
    }
    compositeImage?: string
    slots: Array<{
      id: string
      label: string
      x: number
      y: number
      width: number
      height: number
    }>
    fields: Array<{
      id: string
      slotId: string
      label: string
      type: 'text' | 'color'
      x: number
      y: number
      width: number
      height: number
      defaultValue?: string
    }>
    allLayers: Array<{
      id: string
      name: string
      imageUrl?: string
      x: number
      y: number
      width: number
      height: number
      visible: boolean
    }>
  }) => {
    // PSD 문서 크기 저장
    setCanvasSize(data.documentSize)

    // PSD 이미지 데이터 저장
    setCompositeImage(data.compositeImage)
    setPsdLayers(data.allLayers)

    // 슬롯 위치는 PSD 원본 좌표 그대로 사용 (미리보기에서 스케일링)
    const newSlots: TemplateSlot[] = data.slots.map((s) => ({
      id: s.id,
      label: s.label,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
    }))

    const newFields: TemplateField[] = data.fields.map((f) => ({
      id: f.id,
      slotId: f.slotId,
      label: f.label,
      type: f.type === 'color' ? 'text' : f.type, // color는 text로 매핑
    }))

    // 슬롯이 없으면 기본 슬롯 생성
    if (newSlots.length === 0) {
      newSlots.push({
        id: 'slot1',
        label: '슬롯 1',
        x: data.documentSize.width * 0.1,
        y: data.documentSize.height * 0.1,
        width: data.documentSize.width * 0.3,
        height: data.documentSize.height * 0.6,
      })
    }

    // 필드가 없으면 기본 필드 생성
    if (newFields.length === 0) {
      newFields.push({
        id: 'name_slot1',
        slotId: newSlots[0].id,
        label: '이름',
        type: 'text',
      })
    }

    setSlots(newSlots)
    setFields(newFields)
    setSelectedSlot(newSlots[0]?.id || null)
    toast.success(`${newSlots.length}개의 슬롯과 ${newFields.length}개의 필드가 생성되었습니다!`)
  }, [toast])

  // 저장
  const handleSave = async () => {
    if (!title.trim()) {
      toast.warning('템플릿 이름을 입력해주세요.')
      return
    }
    if (slots.length === 0) {
      toast.warning('최소 하나의 슬롯을 추가해주세요.')
      return
    }

    setIsSaving(true)
    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage에 커스텀 템플릿 저장
        const result = saveCustomTemplate({
          title: title.trim(),
          description: description.trim(),
          emoji: selectedEmoji,
          tags: selectedTags,
          canvasSize,
          compositeImage,
          slots,
          fields,
          layers: psdLayers,
        })

        if (result.success && result.templateId) {
          toast.success('템플릿이 저장되었습니다!')
          // 저장된 템플릿으로 에디터 열기 (static export 호환)
          router.push(`/canvas-editor/custom?id=${result.templateId}`)
        } else {
          toast.error(result.error || '저장에 실패했습니다.')
        }
        return
      }

      // TODO: Supabase에 템플릿 저장
      const templateData = {
        title,
        description,
        emoji: selectedEmoji,
        tags: selectedTags,
        slots,
        fields,
      }
      console.log('Template data:', templateData)
      toast.success('템플릿이 저장되었습니다!')
      router.push('/templates')
    } catch (err) {
      console.error('Failed to save template:', err)
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const currentSlotFields = selectedSlot ? fields.filter((f) => f.slotId === selectedSlot) : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">새 템플릿 만들기</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-1" />
              미리보기
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-[20px] border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h2>

              {/* 이모지 선택 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  아이콘
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                        selectedEmoji === emoji
                          ? 'bg-primary-200 ring-2 ring-primary-400'
                          : 'bg-gray-100 hover:bg-gray-200'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 커플 프로필 틀"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  maxLength={30}
                />
              </div>

              {/* 설명 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
                  maxLength={100}
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  태그
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selectedTags.includes(tag)
                          ? 'bg-primary-400 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PSD/CLIP 업로드 */}
            <PSDUploader
              onConvert={handlePSDConvert}
            />

            {/* 슬롯 목록 카드 */}
            <div className="bg-white rounded-[20px] border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">슬롯 ({slots.length})</h2>
                <Button variant="ghost" size="sm" onClick={addSlot}>
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>

              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      selectedSlot === slot.id
                        ? 'bg-primary-100 ring-1 ring-primary-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm font-medium text-gray-700">
                      {slot.label}
                    </span>
                    {slots.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSlot(slot.id)
                        }}
                        className="p-1 text-gray-400 hover:text-error rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 슬롯 편집 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 캔버스 미리보기 */}
            <div className="bg-white rounded-[20px] border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                미리보기
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({canvasSize.width}×{canvasSize.height})
                </span>
              </h2>

              {/* PSD 이미지가 있으면 PSDCanvas로 렌더링 */}
              {hasPsdImage ? (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <PSDCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    compositeImage={compositeImage}
                    layers={psdLayers}
                    slots={slots}
                    selectedSlotId={selectedSlot || undefined}
                    onSlotSelect={setSelectedSlot}
                    maxWidth={600}
                    showOverlay={true}
                  />
                </div>
              ) : (
                /* 기본 미리보기 (PSD 없음) */
                <div
                  className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl relative overflow-hidden"
                  style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
                >
                  {/* 중앙 이모지 */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-30">
                    {selectedEmoji}
                  </div>
                  {/* 슬롯 표시 */}
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={cn(
                        'absolute bg-white/80 backdrop-blur rounded-xl p-2 cursor-pointer transition-all overflow-hidden',
                        selectedSlot === slot.id
                          ? 'ring-2 ring-primary-400 shadow-lg'
                          : 'ring-1 ring-gray-200 hover:ring-primary-200'
                      )}
                      style={{
                        left: `${(slot.x / canvasSize.width) * 100}%`,
                        top: `${(slot.y / canvasSize.height) * 100}%`,
                        width: `${(slot.width / canvasSize.width) * 100}%`,
                        height: `${(slot.height / canvasSize.height) * 100}%`,
                      }}
                    >
                      <p className="text-[10px] text-gray-500 truncate">{slot.label}</p>
                      <div className="mt-1 text-center space-y-0.5">
                        {fields
                          .filter((f) => f.slotId === slot.id)
                          .slice(0, 3)
                          .map((field) => (
                            <p key={field.id} className="text-[8px] text-gray-400 truncate">
                              {field.label}
                            </p>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 슬롯 편집 */}
            {selectedSlot && (
              <div className="bg-white rounded-[20px] border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  {slots.find((s) => s.id === selectedSlot)?.label} 설정
                </h2>

                {/* 슬롯 라벨 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    슬롯 이름
                  </label>
                  <input
                    type="text"
                    value={slots.find((s) => s.id === selectedSlot)?.label || ''}
                    onChange={(e) => updateSlot(selectedSlot, { label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>

                {/* 위치 조절 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      X 위치
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={slots.find((s) => s.id === selectedSlot)?.x || 0}
                      onChange={(e) => updateSlot(selectedSlot, { x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Y 위치
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={slots.find((s) => s.id === selectedSlot)?.y || 0}
                      onChange={(e) => updateSlot(selectedSlot, { y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 필드 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-gray-500">
                      입력 필드
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => addField(selectedSlot)}>
                      <Plus className="w-3 h-3 mr-1" />
                      추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentSlotFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="필드 이름"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-300"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as 'text' | 'image' })}
                          className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-300"
                        >
                          <option value="text">텍스트</option>
                          <option value="image">이미지</option>
                        </select>
                        {currentSlotFields.length > 1 && (
                          <button
                            onClick={() => removeField(field.id)}
                            className="p-1 text-gray-400 hover:text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[24px] max-w-[600px] w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">미리보기</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            {hasPsdImage ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 mb-4">
                <PSDCanvas
                  width={canvasSize.width}
                  height={canvasSize.height}
                  compositeImage={compositeImage}
                  layers={psdLayers}
                  slots={slots}
                  maxWidth={560}
                  showOverlay={false}
                />
              </div>
            ) : (
              <div
                className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl relative overflow-hidden mb-4"
                style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-30">
                  {selectedEmoji}
                </div>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="absolute bg-white/80 backdrop-blur rounded-xl p-2 overflow-hidden"
                    style={{
                      left: `${(slot.x / canvasSize.width) * 100}%`,
                      top: `${(slot.y / canvasSize.height) * 100}%`,
                      width: `${(slot.width / canvasSize.width) * 100}%`,
                      height: `${(slot.height / canvasSize.height) * 100}%`,
                    }}
                  >
                    <p className="text-[10px] text-gray-500 truncate">{slot.label}</p>
                    <div className="mt-1 text-center space-y-0.5">
                      {fields
                        .filter((f) => f.slotId === slot.id)
                        .slice(0, 4)
                        .map((field) => (
                          <div key={field.id}>
                            <p className="text-[8px] text-gray-400 truncate">{field.label}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="text-2xl">{selectedEmoji}</span>
              <div>
                <p className="font-semibold text-gray-900">{title || '제목 없음'}</p>
                <p className="text-xs text-gray-400">{selectedTags.join(', ') || '태그 없음'}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
