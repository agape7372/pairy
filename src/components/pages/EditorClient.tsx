'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Download,
  Share2,
  Eye,
  EyeOff,
  Users,
  Palette,
  Type,
  Image as ImageIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Check,
  Cloud,
  CloudOff,
  Menu,
  X,
} from 'lucide-react'
import { Button, ImageUpload } from '@/components/ui'
import { ExportDialog } from '@/components/editor'
import { cn } from '@/lib/utils/cn'
import { uploadWorkImage } from '@/lib/supabase/storage'
import { useEditorStore, useCanUndo, useCanRedo, useIsDirty, useIsSaving } from '@/stores/editorStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { IS_DEMO_MODE } from '@/lib/supabase/client'

// 샘플 템플릿 데이터
const sampleTemplate = {
  id: '1',
  title: '커플 프로필 틀',
  emoji: '💕',
  slots: [
    { id: 'slot1', label: '사람 1', x: 50, y: 100 },
    { id: 'slot2', label: '사람 2', x: 350, y: 100 },
  ],
  fields: [
    { id: 'name1', slotId: 'slot1', type: 'text', label: '이름', value: '' },
    { id: 'name2', slotId: 'slot2', type: 'text', label: '이름', value: '' },
    { id: 'like1', slotId: 'slot1', type: 'text', label: '좋아하는 것', value: '' },
    { id: 'like2', slotId: 'slot2', type: 'text', label: '좋아하는 것', value: '' },
    { id: 'dislike1', slotId: 'slot1', type: 'text', label: '싫어하는 것', value: '' },
    { id: 'dislike2', slotId: 'slot2', type: 'text', label: '싫어하는 것', value: '' },
  ],
}

type Tool = 'select' | 'text' | 'image' | 'color'

interface SlotImages {
  [slotId: string]: string | null
}

interface EditorClientProps {
  workId: string
}

export default function EditorClient({ workId }: EditorClientProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Editor Store
  const {
    title,
    setTitle,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    undo,
    redo,
    initEditor,
    lastSavedAt,
  } = useEditorStore()

  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const isDirty = useIsDirty()
  const isSaving = useIsSaving()

  // Auto-save
  const { save } = useAutoSave({
    enabled: workId !== 'new',
    interval: 30000,
    onSaveSuccess: () => console.log('Auto-saved'),
  })

  // Local state
  const [isPublic, setIsPublic] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool>('select')
  const [selectedSlot, setSelectedSlot] = useState<string | null>('slot1')
  const [fields, setFields] = useState(sampleTemplate.fields)
  const [slotImages, setSlotImages] = useState<SlotImages>({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showMobilePanel, setShowMobilePanel] = useState(false)

  // Initialize editor
  useEffect(() => {
    initEditor({
      workId: workId !== 'new' ? workId : undefined,
      templateId: sampleTemplate.id,
      title: '우리 커플 프로필',
      canvasWidth: 600,
      canvasHeight: 400,
    })
  }, [workId, initEditor])

  // 슬롯 이미지 업로드 핸들러
  const handleSlotImageUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!selectedSlot) return null

    const result = await uploadWorkImage(workId, selectedSlot, file)
    return result.url
  }, [workId, selectedSlot])

  const handleSlotImageChange = (url: string | null) => {
    if (!selectedSlot) return
    setSlotImages(prev => ({
      ...prev,
      [selectedSlot]: url,
    }))
  }

  const handleSave = async () => {
    await save()
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, value } : f))
    )
  }

  const currentSlotFields = fields.filter((f) => f.slotId === selectedSlot)

  // 저장 상태 표시 텍스트
  const getSaveStatusText = () => {
    if (isSaving) return '저장 중...'
    if (isDirty) return '변경사항 있음'
    if (lastSavedAt) {
      const time = new Date(lastSavedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `저장됨 ${time}`
    }
    return ''
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/templates"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base sm:text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1 min-w-0 flex-1"
          />

          {/* Save Status - 모바일에서 숨김 */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
            {isSaving ? (
              <Cloud className="w-4 h-4 animate-pulse text-accent-400" />
            ) : isDirty ? (
              <CloudOff className="w-4 h-4 text-warning" />
            ) : lastSavedAt ? (
              <Check className="w-4 h-4 text-success" />
            ) : null}
            <span>{getSaveStatusText()}</span>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Visibility Toggle */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              isPublic
                ? 'bg-accent-200 text-accent-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {isPublic ? (
              <>
                <Eye className="w-4 h-4" />
                공개
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                비공개
              </>
            )}
          </button>

          <Button variant="ghost" size="sm" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4 mr-1" />
            공유
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-1" />
            내보내기
          </Button>

          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="w-5 h-5" />
          </Button>
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {showMobilePanel ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Tools (데스크탑만) */}
        <aside className="hidden md:flex w-14 bg-white border-r border-gray-200 flex-col items-center py-3 gap-1 shrink-0">
          {[
            { id: 'select', icon: Users, label: '슬롯 선택' },
            { id: 'text', icon: Type, label: '텍스트' },
            { id: 'image', icon: ImageIcon, label: '이미지' },
            { id: 'color', icon: Palette, label: '색상' },
          ].map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id as Tool)}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                  selectedTool === tool.id
                    ? 'bg-primary-200 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}

          <div className="flex-1" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              canUndo
                ? 'text-gray-500 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="되돌리기 (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              canRedo
                ? 'text-gray-500 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-auto">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1 z-10">
            <button
              onClick={zoomOut}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="min-h-full flex items-center justify-center p-8">
            <div
              ref={canvasRef}
              className="bg-white rounded-[24px] shadow-lg border border-gray-200 overflow-hidden transition-transform"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Template Preview */}
              <div className="w-[600px] h-[400px] bg-gradient-to-br from-primary-100 to-accent-100 relative">
                {/* Slots */}
                {sampleTemplate.slots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={cn(
                      'absolute w-[200px] h-[280px] bg-white/80 backdrop-blur rounded-[20px] p-4 cursor-pointer transition-all',
                      selectedSlot === slot.id
                        ? 'ring-2 ring-primary-400 shadow-lg'
                        : 'hover:ring-2 hover:ring-primary-200'
                    )}
                    style={{ left: slot.x, top: slot.y }}
                  >
                    <p className="text-xs text-gray-400 mb-2">{slot.label}</p>

                    {/* Profile Image */}
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-3xl overflow-hidden">
                      {slotImages[slot.id] ? (
                        <img
                          src={slotImages[slot.id]!}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        '👤'
                      )}
                    </div>

                    {/* Field Values */}
                    <div className="space-y-2 text-center">
                      {fields
                        .filter((f) => f.slotId === slot.id)
                        .map((field) => (
                          <div key={field.id}>
                            <p className="text-xs text-gray-400">{field.label}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {field.value || '-'}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                {/* Center Heart */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">
                  💕
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties (데스크탑) */}
        <aside className="hidden md:block w-72 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {selectedSlot
                ? sampleTemplate.slots.find((s) => s.id === selectedSlot)?.label
                : '슬롯을 선택하세요'}
            </h3>

            {selectedSlot && (
              <div className="space-y-4">
                {/* Profile Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    프로필 이미지
                  </label>
                  <ImageUpload
                    value={slotImages[selectedSlot]}
                    onChange={handleSlotImageChange}
                    onUpload={handleSlotImageUpload}
                    shape="square"
                    size="md"
                    placeholder="이미지 업로드"
                  />
                </div>

                {/* Fields */}
                {currentSlotFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={`${field.label}을 입력하세요`}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Bottom Panel */}
        {showMobilePanel && (
          <div className="md:hidden absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 rounded-t-[20px] shadow-lg max-h-[60vh] overflow-y-auto z-20 animate-slide-up">
            <div className="p-4">
              {/* 모바일 툴바 */}
              <div className="flex gap-2 mb-4 pb-4 border-b border-gray-100 overflow-x-auto">
                {[
                  { id: 'select', icon: Users, label: '슬롯' },
                  { id: 'text', icon: Type, label: '텍스트' },
                  { id: 'image', icon: ImageIcon, label: '이미지' },
                  { id: 'color', icon: Palette, label: '색상' },
                ].map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id as Tool)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors shrink-0',
                        selectedTool === tool.id
                          ? 'bg-primary-200 text-primary-600'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tool.label}
                    </button>
                  )
                })}
              </div>

              {/* 슬롯 선택 */}
              <div className="flex gap-2 mb-4">
                {sampleTemplate.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                      selectedSlot === slot.id
                        ? 'bg-primary-400 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>

              {/* 이미지 업로드 */}
              {selectedSlot && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      프로필 이미지
                    </label>
                    <ImageUpload
                      value={slotImages[selectedSlot]}
                      onChange={handleSlotImageChange}
                      onUpload={handleSlotImageUpload}
                      shape="square"
                      size="md"
                      placeholder="이미지 업로드"
                    />
                  </div>

                  {/* Fields */}
                  {currentSlotFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={`${field.label}을 입력하세요`}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        canvasRef={canvasRef as React.RefObject<HTMLElement>}
        title={title}
        isPremium={false}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">공유하기</h3>

            {IS_DEMO_MODE ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">데모 모드</span>에서는 공유 기능을 사용할 수 없어요.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supabase를 연동하면 협업 기능을 사용할 수 있습니다.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowExportDialog(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  대신 이미지로 내보내기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공유 링크
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/work/${workId}`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/work/${workId}`)
                      }}
                    >
                      복사
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    협업자 초대
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    링크를 공유하면 친구가 함께 편집할 수 있어요.
                  </p>
                  <Button variant="accent" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    협업 링크 생성
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button variant="ghost" onClick={() => setShowShareModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
