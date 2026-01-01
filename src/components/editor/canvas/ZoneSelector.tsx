'use client'

/**
 * Sprint 32: 영역 선택 컴포넌트
 * 협업 시 A/B 편집 영역 선택
 */

import { useState } from 'react'
import { User, Users, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import { useCollabOptional, type EditingZone } from '@/lib/collab'

interface ZoneSelectorProps {
  slots: Array<{
    id: string
    name: string
    zone?: EditingZone
  }>
  onZoneSelected?: (zone: EditingZone) => void
}

export function ZoneSelector({ slots, onZoneSelected }: ZoneSelectorProps) {
  const collab = useCollabOptional()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!collab || !collab.isConnected) {
    return null
  }

  // 슬롯을 영역별로 그룹핑
  const zoneA = slots.filter((s) => s.zone === 'A')
  const zoneB = slots.filter((s) => s.zone === 'B')

  const handleSelectZone = (zone: EditingZone) => {
    collab.claimZone(zone)
    onZoneSelected?.(zone)
    setIsExpanded(false)
  }

  const myZone = collab.myZone
  const zoneAOwner = collab.getZoneOwner('A')
  const zoneBOwner = collab.getZoneOwner('B')

  const isZoneATaken = Boolean(zoneAOwner && zoneAOwner !== collab.localUser?.id)
  const isZoneBTaken = Boolean(zoneBOwner && zoneBOwner !== collab.localUser?.id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-400" />
          <span className="font-semibold text-gray-900">편집 영역</span>
        </div>
        <div className="flex items-center gap-2">
          {myZone && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              myZone === 'A' ? 'bg-primary-100 text-primary-700' : 'bg-accent-100 text-accent-700'
            )}>
              영역 {myZone}
            </span>
          )}
          <svg
            className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 영역 선택 패널 */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <p className="text-sm text-gray-500">
            편집할 영역을 선택하세요. 선택한 영역만 수정할 수 있습니다.
          </p>

          {/* 영역 A */}
          <ZoneOption
            zone="A"
            label="영역 A"
            description={zoneA.map((s) => s.name).join(', ') || '슬롯 없음'}
            isSelected={myZone === 'A'}
            isTaken={isZoneATaken}
            takenBy={isZoneATaken ? '상대방' : undefined}
            onSelect={() => handleSelectZone('A')}
          />

          {/* 영역 B */}
          <ZoneOption
            zone="B"
            label="영역 B"
            description={zoneB.map((s) => s.name).join(', ') || '슬롯 없음'}
            isSelected={myZone === 'B'}
            isTaken={isZoneBTaken}
            takenBy={isZoneBTaken ? '상대방' : undefined}
            onSelect={() => handleSelectZone('B')}
          />

          {/* 영역 없음 (자유 편집) */}
          <ZoneOption
            zone={null}
            label="자유 편집"
            description="모든 영역을 편집할 수 있습니다 (충돌 가능)"
            isSelected={myZone === null}
            isTaken={false}
            onSelect={() => handleSelectZone(null)}
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// 영역 옵션 컴포넌트
// ============================================

interface ZoneOptionProps {
  zone: EditingZone
  label: string
  description: string
  isSelected: boolean
  isTaken: boolean
  takenBy?: string
  onSelect: () => void
}

function ZoneOption({
  zone,
  label,
  description,
  isSelected,
  isTaken,
  takenBy,
  onSelect,
}: ZoneOptionProps) {
  const bgColor = zone === 'A'
    ? 'from-primary-50 to-primary-100'
    : zone === 'B'
      ? 'from-accent-50 to-accent-100'
      : 'from-gray-50 to-gray-100'

  const borderColor = isSelected
    ? zone === 'A'
      ? 'border-primary-400 ring-2 ring-primary-200'
      : zone === 'B'
        ? 'border-accent-400 ring-2 ring-accent-200'
        : 'border-gray-400 ring-2 ring-gray-200'
    : 'border-gray-200'

  return (
    <button
      className={cn(
        'w-full p-3 rounded-xl border-2 text-left transition-all',
        `bg-gradient-to-r ${bgColor}`,
        borderColor,
        isTaken ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md',
      )}
      onClick={onSelect}
      disabled={isTaken}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {zone ? (
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              zone === 'A' ? 'bg-primary-200' : 'bg-accent-200'
            )}>
              <User className="w-4 h-4 text-gray-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">{description}</p>
          </div>
        </div>

        {isSelected && (
          <Check className="w-5 h-5 text-success" />
        )}
        {isTaken && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Lock className="w-4 h-4" />
            <span>{takenBy}</span>
          </div>
        )}
      </div>
    </button>
  )
}
