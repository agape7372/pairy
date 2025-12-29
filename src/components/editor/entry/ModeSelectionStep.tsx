'use client'

import { motion } from 'framer-motion'
import { Users, Palette, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useEditorEntryStore } from '@/stores/editorEntryStore'
import { EDITOR_MODES, type EditorMode } from '@/types/editor-entry'

interface ModeSelectionStepProps {
  className?: string
}

export function ModeSelectionStep({ className }: ModeSelectionStepProps) {
  const { mode: selectedMode, selectMode } = useEditorEntryStore()

  const handleSelectMode = (mode: EditorMode) => {
    selectMode(mode)
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          어떻게 작업할까요?
        </h2>
        <p className="text-gray-500">
          혼자서 또는 함께, 원하는 방식을 선택하세요
        </p>
      </motion.div>

      {/* 모드 선택 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EDITOR_MODES.map((modeInfo, index) => {
          const isSelected = selectedMode === modeInfo.id
          const Icon = modeInfo.id === 'solo' ? Palette : Users

          return (
            <motion.button
              key={modeInfo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectMode(modeInfo.id)}
              className={cn(
                'relative group rounded-2xl border-2 p-6 text-left transition-all duration-200',
                'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-400 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              )}
            >
              {/* 선택 체크 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* 프리미엄 뱃지 */}
              {modeInfo.isPremium && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  프리미엄
                </span>
              )}

              {/* 아이콘 */}
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform',
                  'group-hover:scale-110',
                  isSelected
                    ? 'bg-primary-200'
                    : 'bg-gradient-to-br from-primary-100 to-accent-100'
                )}
              >
                {modeInfo.icon}
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {modeInfo.title}
              </h3>

              {/* 설명 */}
              <p className="text-sm text-gray-500 mb-4">
                {modeInfo.description}
              </p>

              {/* 기능 목록 */}
              <ul className="space-y-1.5">
                {modeInfo.features.map((feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + featureIndex * 0.05 + 0.2 }}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-400' : 'bg-gray-300'
                      )}
                    />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.button>
          )
        })}
      </div>

      {/* 듀오 모드 추가 설명 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-gray-400">
          듀오 모드에서는 초대 링크를 통해 친구를 초대할 수 있어요
        </p>
      </motion.div>
    </div>
  )
}
