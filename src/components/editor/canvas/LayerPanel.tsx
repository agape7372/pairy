'use client'

/**
 * Sprint 33: 레이어 패널
 * 요소 순서 변경, 잠금, 숨김 기능
 */

import { useState, useCallback } from 'react'
import {
  Layers,
  Image as ImageIcon,
  Type,
  Sticker,
  Palette,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { ImageSlot, TextField, StickerLayer } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

type LayerType = 'overlay' | 'sticker' | 'text' | 'slot' | 'background'

interface LayerItem {
  id: string
  type: LayerType
  name: string
  isLocked: boolean
  isHidden: boolean
  thumbnail?: string
}

interface LayerGroupProps {
  title: string
  icon: React.ReactNode
  items: LayerItem[]
  isExpanded: boolean
  onToggle: () => void
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleLock: (id: string) => void
  onToggleVisibility: (id: string) => void
  onDelete?: (id: string) => void
  isLocked?: boolean
}

// ============================================
// 레이어 그룹 컴포넌트
// ============================================

function LayerGroup({
  title,
  icon,
  items,
  isExpanded,
  onToggle,
  selectedId,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onDelete,
  isLocked = false,
}: LayerGroupProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* 그룹 헤더 */}
      <button
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <span className="w-5 h-5 flex items-center justify-center text-gray-500">
          {icon}
        </span>
        <span className="text-sm font-medium text-gray-700 flex-1 text-left">
          {title}
        </span>
        {isLocked && (
          <Lock className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className="text-xs text-gray-400">
          {items.length}
        </span>
      </button>

      {/* 레이어 항목 */}
      {isExpanded && items.length > 0 && (
        <div className="pb-1">
          {items.map((item) => (
            <LayerItemRow
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={() => onSelect(item.id)}
              onToggleLock={() => onToggleLock(item.id)}
              onToggleVisibility={() => onToggleVisibility(item.id)}
              onDelete={onDelete ? () => onDelete(item.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {isExpanded && items.length === 0 && (
        <div className="px-6 py-2 text-xs text-gray-400">
          없음
        </div>
      )}
    </div>
  )
}

// ============================================
// 레이어 항목 행 컴포넌트
// ============================================

interface LayerItemRowProps {
  item: LayerItem
  isSelected: boolean
  onSelect: () => void
  onToggleLock: () => void
  onToggleVisibility: () => void
  onDelete?: () => void
}

function LayerItemRow({
  item,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onDelete,
}: LayerItemRowProps) {
  return (
    <div
      className={cn(
        'group px-2 py-1.5 mx-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary-100 ring-1 ring-primary-300'
          : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      {/* 드래그 핸들 (향후 DnD 구현용) */}
      <GripVertical className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />

      {/* 썸네일 */}
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : item.type === 'text' ? (
          <Type className="w-4 h-4 text-gray-400" />
        ) : item.type === 'sticker' ? (
          <Sticker className="w-4 h-4 text-gray-400" />
        ) : item.type === 'slot' ? (
          <ImageIcon className="w-4 h-4 text-gray-400" />
        ) : (
          <Palette className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* 이름 */}
      <span className={cn(
        'flex-1 text-sm truncate',
        item.isHidden ? 'text-gray-400' : 'text-gray-700',
        item.isLocked && 'italic'
      )}>
        {item.name}
      </span>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 가시성 토글 */}
        <button
          className={cn(
            'p-1 rounded hover:bg-gray-200 transition-colors',
            item.isHidden ? 'text-gray-300' : 'text-gray-500'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
          title={item.isHidden ? '표시' : '숨기기'}
        >
          {item.isHidden ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>

        {/* 잠금 토글 */}
        <button
          className={cn(
            'p-1 rounded hover:bg-gray-200 transition-colors',
            item.isLocked ? 'text-amber-500' : 'text-gray-500'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
          title={item.isLocked ? '잠금 해제' : '잠금'}
        >
          {item.isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
        </button>

        {/* 삭제 (스티커만) */}
        {onDelete && (
          <button
            className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// 메인 레이어 패널 컴포넌트
// ============================================

interface LayerPanelProps {
  className?: string
}

export function LayerPanel({ className }: LayerPanelProps) {
  const {
    templateConfig,
    images,
    selectedSlotId,
    selectedTextId,
    selectedStickerId,
    selectSlot,
    selectText,
    selectSticker,
    removeSticker,
    layerStates,
    toggleLayerLocked,
    toggleLayerVisible,
  } = useCanvasEditorStore()

  // 그룹 확장 상태
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overlay: false,
    sticker: true,
    text: true,
    slot: true,
    background: false,
  })

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }, [])

  if (!templateConfig) return null

  // 레이어 데이터 구성
  const slots: LayerItem[] = templateConfig.layers.slots.map((slot) => ({
    id: slot.id,
    type: 'slot' as const,
    name: slot.name,
    isLocked: layerStates[slot.id]?.locked ?? false,
    isHidden: layerStates[slot.id]?.visible === false,
    thumbnail: images[slot.dataKey] || undefined,
  }))

  const texts: LayerItem[] = templateConfig.layers.texts.map((text) => ({
    id: text.id,
    type: 'text' as const,
    name: text.placeholder || text.dataKey,
    isLocked: layerStates[text.id]?.locked ?? false,
    isHidden: layerStates[text.id]?.visible === false,
  }))

  const stickers: LayerItem[] = (templateConfig.layers.stickers || []).map((sticker) => ({
    id: sticker.id,
    type: 'sticker' as const,
    name: `스티커 ${sticker.id.slice(-4)}`,
    isLocked: layerStates[sticker.id]?.locked ?? false,
    isHidden: layerStates[sticker.id]?.visible === false,
    thumbnail: sticker.imageUrl,
  }))

  const overlays: LayerItem[] = (templateConfig.layers.overlays || []).map((overlay) => ({
    id: overlay.id,
    type: 'overlay' as const,
    name: '오버레이',
    isLocked: true,
    isHidden: false,
    thumbnail: overlay.imageUrl,
  }))

  // 선택된 항목 ID
  const getSelectedId = (): string | null => {
    return selectedSlotId || selectedTextId || selectedStickerId || null
  }

  // 선택 핸들러
  const handleSelect = useCallback((id: string, type: LayerType) => {
    if (type === 'slot') {
      selectSlot(id)
    } else if (type === 'text') {
      selectText(id)
    } else if (type === 'sticker') {
      selectSticker(id)
    }
  }, [selectSlot, selectText, selectSticker])

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)}>
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Layers className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">레이어</h3>
      </div>

      {/* 레이어 목록 */}
      <div className="max-h-[400px] overflow-y-auto">
        {/* 오버레이 그룹 */}
        {overlays.length > 0 && (
          <LayerGroup
            title="오버레이"
            icon={<ImageIcon className="w-4 h-4" />}
            items={overlays}
            isExpanded={expandedGroups.overlay}
            onToggle={() => toggleGroup('overlay')}
            selectedId={getSelectedId()}
            onSelect={(id) => handleSelect(id, 'overlay')}
            onToggleLock={(id) => toggleLayerLocked(id)}
            onToggleVisibility={(id) => toggleLayerVisible(id)}
            isLocked
          />
        )}

        {/* 스티커 그룹 */}
        <LayerGroup
          title="스티커"
          icon={<Sticker className="w-4 h-4" />}
          items={stickers}
          isExpanded={expandedGroups.sticker}
          onToggle={() => toggleGroup('sticker')}
          selectedId={getSelectedId()}
          onSelect={(id) => handleSelect(id, 'sticker')}
          onToggleLock={(id) => toggleLayerLocked(id)}
          onToggleVisibility={(id) => toggleLayerVisible(id)}
          onDelete={(id) => removeSticker(id)}
        />

        {/* 텍스트 그룹 */}
        <LayerGroup
          title="텍스트"
          icon={<Type className="w-4 h-4" />}
          items={texts}
          isExpanded={expandedGroups.text}
          onToggle={() => toggleGroup('text')}
          selectedId={getSelectedId()}
          onSelect={(id) => handleSelect(id, 'text')}
          onToggleLock={(id) => toggleLayerLocked(id)}
          onToggleVisibility={(id) => toggleLayerVisible(id)}
        />

        {/* 이미지 슬롯 그룹 */}
        <LayerGroup
          title="이미지 슬롯"
          icon={<ImageIcon className="w-4 h-4" />}
          items={slots}
          isExpanded={expandedGroups.slot}
          onToggle={() => toggleGroup('slot')}
          selectedId={getSelectedId()}
          onSelect={(id) => handleSelect(id, 'slot')}
          onToggleLock={(id) => toggleLayerLocked(id)}
          onToggleVisibility={(id) => toggleLayerVisible(id)}
        />

        {/* 배경 그룹 */}
        <LayerGroup
          title="배경"
          icon={<Palette className="w-4 h-4" />}
          items={[{
            id: 'background',
            type: 'background',
            name: templateConfig.layers.background.type === 'image'
              ? '이미지 배경'
              : templateConfig.layers.background.type === 'gradient'
                ? '그라데이션 배경'
                : '단색 배경',
            isLocked: true,
            isHidden: false,
          }]}
          isExpanded={expandedGroups.background}
          onToggle={() => toggleGroup('background')}
          selectedId={null}
          onSelect={() => {}}
          onToggleLock={() => {}}
          onToggleVisibility={() => {}}
          isLocked
        />
      </div>
    </div>
  )
}
