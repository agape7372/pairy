'use client'

/**
 * 캐릭터 카드 컴포넌트
 * 개별 캐릭터를 표시하고 편집/삭제 인터랙션 제공
 */

import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil,
  Trash2,
  MoreVertical,
  User,
} from 'lucide-react'
import type { Character, CharacterMetadata } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'

interface CharacterCardProps {
  character: Character
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
  isDeleting?: boolean
  className?: string
}

export const CharacterCard = memo(function CharacterCard({
  character,
  onEdit,
  onDelete,
  isDeleting = false,
  className,
}: CharacterCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const metadata = character.metadata as CharacterMetadata | null

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit(character)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete(character)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDeleting ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative bg-white rounded-2xl shadow-sm border border-gray-100',
        'p-4 cursor-pointer transition-shadow',
        'hover:shadow-md hover:border-primary-200',
        isDeleting && 'pointer-events-none',
        className
      )}
      onClick={() => onEdit(character)}
    >
      {/* 아바타 */}
      <div
        className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner"
        style={{
          backgroundColor: character.avatar_url ? undefined : character.color,
          backgroundImage: character.avatar_url ? `url(${character.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!character.avatar_url && (
          character.name[0]?.toUpperCase() || <User className="w-8 h-8" />
        )}
      </div>

      {/* 이름 */}
      <h3 className="text-center font-semibold text-gray-900 truncate mb-1">
        {character.name}
      </h3>

      {/* MBTI 뱃지 */}
      {metadata?.mbti && (
        <div className="mt-2 flex justify-center">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-100 text-primary-600">
            {metadata.mbti}
          </span>
        </div>
      )}

      {/* 액션 메뉴 */}
      <div className="absolute bottom-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="메뉴 열기"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              {/* 메뉴 외부 클릭 감지 */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[120px]"
              >
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  편집
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-sm text-left text-error hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 삭제 중 로딩 오버레이 */}
      {isDeleting && (
        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  )
})

export default CharacterCard
