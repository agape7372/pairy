'use client'

/**
 * Zone 선택기 컴포넌트
 * A/B 영역 중 편집할 영역을 선택하는 UI
 * 2인 협업에서 충돌 방지를 위한 영역 분리
 */

import { motion } from 'framer-motion'
import { Lock, Unlock, User, Check } from 'lucide-react'
import { useCollabOptional } from '@/lib/collab'
import type { EditingZone } from '@/lib/collab/types'

interface ZoneSelectorProps {
  className?: string
  onZoneSelect?: (zone: EditingZone) => void
}

export function ZoneSelector({ className = '', onZoneSelect }: ZoneSelectorProps) {
  const collab = useCollabOptional()

  if (!collab || !collab.isConnected) return null

  const handleZoneSelect = (zone: EditingZone) => {
    collab.claimZone(zone)
    onZoneSelect?.(zone)
  }

  const zoneAOwner = collab.getZoneOwner('A')
  const zoneBOwner = collab.getZoneOwner('B')

  const isZoneAMine = zoneAOwner === collab.localUser?.id
  const isZoneBMine = zoneBOwner === collab.localUser?.id
  const isZoneATaken = Boolean(zoneAOwner && !isZoneAMine)
  const isZoneBTaken = Boolean(zoneBOwner && !isZoneBMine)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-lg p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        편집 영역 선택
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Zone A */}
        <ZoneButton
          zone="A"
          label="A 영역"
          description="왼쪽 인물"
          color="#FFD9D9"
          borderColor="#FF9999"
          isSelected={isZoneAMine}
          isTaken={isZoneATaken}
          ownerName={zoneAOwner?.slice(0, 6)}
          onSelect={() => handleZoneSelect('A')}
        />

        {/* Zone B */}
        <ZoneButton
          zone="B"
          label="B 영역"
          description="오른쪽 인물"
          color="#D7FAFA"
          borderColor="#7DD3D3"
          isSelected={isZoneBMine}
          isTaken={isZoneBTaken}
          ownerName={zoneBOwner?.slice(0, 6)}
          onSelect={() => handleZoneSelect('B')}
        />
      </div>

      {/* 자유 편집 버튼 */}
      <button
        onClick={() => handleZoneSelect(null)}
        className={`w-full mt-3 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
          !collab.myZone
            ? 'bg-gray-100 border-2 border-gray-300 text-gray-700'
            : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
        }`}
      >
        {!collab.myZone ? (
          <span className="flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            자유 편집 모드
          </span>
        ) : (
          '자유 편집 (충돌 가능)'
        )}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        영역을 선택하면 다른 참여자와 충돌 없이 편집할 수 있어요
      </p>
    </motion.div>
  )
}

// ============================================
// Zone 버튼 컴포넌트
// ============================================

interface ZoneButtonProps {
  zone: 'A' | 'B'
  label: string
  description: string
  color: string
  borderColor: string
  isSelected: boolean
  isTaken: boolean
  ownerName?: string
  onSelect: () => void
}

function ZoneButton({
  zone,
  label,
  description,
  color,
  borderColor,
  isSelected,
  isTaken,
  ownerName,
  onSelect,
}: ZoneButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: isTaken ? 1 : 1.02 }}
      whileTap={{ scale: isTaken ? 1 : 0.98 }}
      onClick={onSelect}
      disabled={isTaken}
      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
        isTaken
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: color,
        borderColor: isSelected ? borderColor : 'transparent',
        boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${borderColor}` : undefined,
      }}
    >
      {/* 선택됨 표시 */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: borderColor }}
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      {/* 잠금 상태 */}
      <div className="flex items-center gap-1 mb-1">
        {isTaken ? (
          <Lock className="w-4 h-4 text-gray-500" />
        ) : (
          <Unlock className="w-4 h-4 text-gray-400" />
        )}
        <span className="font-bold text-gray-800">{label}</span>
      </div>

      <p className="text-xs text-gray-600">{description}</p>

      {isTaken && ownerName && (
        <p className="text-xs text-gray-500 mt-1">
          {ownerName} 편집 중
        </p>
      )}
    </motion.button>
  )
}

export default ZoneSelector
