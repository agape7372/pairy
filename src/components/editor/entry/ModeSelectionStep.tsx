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
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectMode(modeInfo.id)}
              className={cn(
                'relative group rounded-2xl border-2 p-6 text-left',
                'transition-all duration-300 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
                isSelected
                  ? 'border-primary-400 bg-primary-50 shadow-[0_8px_24px_rgba(255,180,180,0.3)]'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-[0_8px_20px_rgba(255,217,217,0.4)]'
              )}
            >
              {/* 선택 체크 - 뿅 효과 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shadow-[0_2px_8px_rgba(255,180,180,0.5)]"
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* 프리미엄 뱃지 */}
              {modeInfo.isPremium && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  프리미엄
                </span>
              )}

              {/* 아이콘 - 호버 시 살랑살랑 */}
              <motion.div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4',
                  isSelected
                    ? 'bg-gradient-to-br from-primary-200 to-accent-200'
                    : 'bg-gradient-to-br from-primary-100 to-accent-100'
                )}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -3, 3, -2, 2, 0],
                  transition: { rotate: { duration: 0.5 } }
                }}
              >
                {modeInfo.icon}
              </motion.div>

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
