'use client'

/**
 * Sprint 33: 색상 프리셋
 * 원클릭 색상 조합 적용
 */

import { useState } from 'react'
import { Palette, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { ColorData, ColorReference } from '@/types/template'

// ============================================
// 프리셋 정의
// ============================================

export interface ColorPreset {
  id: string
  name: string
  colors: {
    primaryColor: string
    secondaryColor: string
    accentColor?: string
    textColor?: string
  }
  isPremium?: boolean
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'strawberry-cream',
    name: '딸기 크림',
    colors: {
      primaryColor: '#FFD9D9',
      secondaryColor: '#D7FAFA',
      accentColor: '#FF6B6B',
      textColor: '#3D3636',
    },
  },
  {
    id: 'lavender-dream',
    name: '라벤더 드림',
    colors: {
      primaryColor: '#E8D5FF',
      secondaryColor: '#FFE4F0',
      accentColor: '#9B59B6',
      textColor: '#4A3F55',
    },
  },
  {
    id: 'mint-fresh',
    name: '민트 프레시',
    colors: {
      primaryColor: '#C8F7DC',
      secondaryColor: '#E0F4FF',
      accentColor: '#00B894',
      textColor: '#2D3E50',
    },
  },
  {
    id: 'sunset-glow',
    name: '선셋 글로우',
    colors: {
      primaryColor: '#FFE5B4',
      secondaryColor: '#FFCCCB',
      accentColor: '#FF6348',
      textColor: '#5D4E37',
    },
  },
  {
    id: 'ocean-breeze',
    name: '오션 브리즈',
    colors: {
      primaryColor: '#B4D8E7',
      secondaryColor: '#E8F4EA',
      accentColor: '#0984E3',
      textColor: '#2C3E50',
    },
  },
  {
    id: 'cherry-blossom',
    name: '벚꽃',
    colors: {
      primaryColor: '#FFDEE9',
      secondaryColor: '#FFF5F5',
      accentColor: '#FF69B4',
      textColor: '#4A3C4A',
    },
  },
  {
    id: 'forest-calm',
    name: '숲의 고요',
    colors: {
      primaryColor: '#D4EDDA',
      secondaryColor: '#F5F5DC',
      accentColor: '#28A745',
      textColor: '#2F4F4F',
    },
    isPremium: true,
  },
  {
    id: 'royal-purple',
    name: '로열 퍼플',
    colors: {
      primaryColor: '#DCD6F7',
      secondaryColor: '#F4EEFF',
      accentColor: '#6C5CE7',
      textColor: '#3D3D3D',
    },
    isPremium: true,
  },
  {
    id: 'candy-pop',
    name: '캔디 팝',
    colors: {
      primaryColor: '#FFB3BA',
      secondaryColor: '#BAFFC9',
      accentColor: '#FF85A2',
      textColor: '#5A4A4A',
    },
    isPremium: true,
  },
  {
    id: 'midnight-blue',
    name: '미드나잇 블루',
    colors: {
      primaryColor: '#C9D6FF',
      secondaryColor: '#E2E2E2',
      accentColor: '#5B7BD5',
      textColor: '#2C3E50',
    },
    isPremium: true,
  },
]

// ============================================
// 프리셋 카드 컴포넌트
// ============================================

interface PresetCardProps {
  preset: ColorPreset
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

function PresetCard({ preset, isSelected, onSelect, disabled }: PresetCardProps) {
  return (
    <button
      className={cn(
        'relative w-full p-3 rounded-xl border-2 transition-all',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'border-primary-400 ring-2 ring-primary-200 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onSelect}
      disabled={disabled}
    >
      {/* 프리미엄 배지 */}
      {preset.isPremium && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold rounded-full shadow-sm flex items-center gap-0.5">
          <Sparkles className="w-3 h-3" />
          PRO
        </div>
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-primary-400 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* 색상 미리보기 */}
      <div className="flex gap-1 mb-2">
        <div
          className="flex-1 h-8 rounded-lg"
          style={{ backgroundColor: preset.colors.primaryColor }}
        />
        <div
          className="flex-1 h-8 rounded-lg"
          style={{ backgroundColor: preset.colors.secondaryColor }}
        />
        {preset.colors.accentColor && (
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: preset.colors.accentColor }}
          />
        )}
      </div>

      {/* 프리셋 이름 */}
      <p className="text-xs font-medium text-gray-700 text-center">
        {preset.name}
      </p>
    </button>
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

interface ColorPresetsProps {
  className?: string
}

export function ColorPresets({ className }: ColorPresetsProps) {
  const { colors, setColors, updateColor } = useCanvasEditorStore()
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  // 현재 색상과 일치하는 프리셋 찾기
  const findMatchingPreset = (): string | null => {
    for (const preset of DEFAULT_COLOR_PRESETS) {
      if (
        preset.colors.primaryColor === colors.primaryColor &&
        preset.colors.secondaryColor === colors.secondaryColor
      ) {
        return preset.id
      }
    }
    return null
  }

  const currentPresetId = selectedPresetId || findMatchingPreset()

  const handleSelectPreset = (preset: ColorPreset) => {
    // 프리미엄 프리셋은 구독자만 (데모에서는 허용)
    setSelectedPresetId(preset.id)

    // 색상 적용
    const newColors: ColorData = {
      ...colors,
      primaryColor: preset.colors.primaryColor,
      secondaryColor: preset.colors.secondaryColor,
    }

    if (preset.colors.accentColor) {
      newColors.accentColor = preset.colors.accentColor
    }
    if (preset.colors.textColor) {
      newColors.textColor = preset.colors.textColor
    }

    setColors(newColors)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-1">
        <Palette className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">색상 프리셋</span>
      </div>

      {/* 프리셋 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_COLOR_PRESETS.slice(0, 6).map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={currentPresetId === preset.id}
            onSelect={() => handleSelectPreset(preset)}
          />
        ))}
      </div>

      {/* 프리미엄 프리셋 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2 px-1">프리미엄 색상</p>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_COLOR_PRESETS.slice(6).map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={currentPresetId === preset.id}
              onSelect={() => handleSelectPreset(preset)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
