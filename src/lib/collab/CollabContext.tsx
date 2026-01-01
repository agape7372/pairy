'use client'

/**
 * Sprint 32: 협업 컨텍스트
 * Yjs 기반 실시간 동기화를 React 컴포넌트에서 사용하기 위한 컨텍스트
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { SupabaseYjsProvider } from './yjsProvider'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type {
  SyncState,
  CollabUser,
  CollabState,
  UserEditingState,
  EditConflict,
  EditingZone,
} from './types'

// ============================================
// Context Types
// ============================================

interface CollabContextValue {
  // 연결 상태
  isConnected: boolean
  isSyncing: boolean

  // 사용자 정보
  localUser: CollabUser | null
  remoteUsers: Map<string, UserEditingState>

  // 영역 분리
  myZone: EditingZone
  claimZone: (zone: EditingZone) => void
  getZoneOwner: (zone: EditingZone) => string | null

  // 충돌 알림
  currentConflict: EditConflict | null
  dismissConflict: () => void

  // 커서
  updateCursor: (x: number, y: number) => void
  updateSelection: (slotId: string | null, textId: string | null) => void

  // 세션 관리
  connect: (sessionId: string, user: CollabUser) => Promise<void>
  disconnect: () => void
}

const CollabContext = createContext<CollabContextValue | null>(null)

// ============================================
// Provider Component
// ============================================

interface CollabProviderProps {
  children: ReactNode
  sessionId?: string
  user?: CollabUser
  autoConnect?: boolean
}

export function CollabProvider({
  children,
  sessionId: initialSessionId,
  user: initialUser,
  autoConnect = false,
}: CollabProviderProps) {
  // Yjs Provider 인스턴스
  const providerRef = useRef<SupabaseYjsProvider | null>(null)

  // 상태
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [localUser, setLocalUser] = useState<CollabUser | null>(initialUser || null)
  const [remoteUsers, setRemoteUsers] = useState<Map<string, UserEditingState>>(new Map())
  const [myZone, setMyZone] = useState<EditingZone>(null)
  const [zoneOwners, setZoneOwners] = useState<{ A: string | null; B: string | null }>({
    A: null,
    B: null,
  })
  const [currentConflict, setCurrentConflict] = useState<EditConflict | null>(null)

  // Zustand 스토어 액션
  const {
    formData,
    images,
    colors,
    slotTransforms,
    templateConfig,
    setFormData,
    setImages,
    setColors,
  } = useCanvasEditorStore()

  // 원격 상태 변경 핸들러
  const handleSyncStateChange = useCallback((state: SyncState) => {
    // 원격에서 받은 상태로 로컬 스토어 업데이트
    // Note: 이 업데이트는 다시 Yjs로 전파되지 않도록 플래그 설정 필요
    setFormData(state.formData)
    setImages(state.images)
    setColors(state.colors)
    // slotTransforms와 stickers는 별도 처리
  }, [setFormData, setImages, setColors])

  // 원격 사용자 변경 핸들러
  const handleRemoteUserChange = useCallback((users: Map<string, UserEditingState>) => {
    setRemoteUsers(users)

    // 영역 소유자 업데이트
    const newZoneOwners = { A: null as string | null, B: null as string | null }
    users.forEach((state, userId) => {
      if (state.zone === 'A') newZoneOwners.A = userId
      if (state.zone === 'B') newZoneOwners.B = userId
    })
    setZoneOwners(newZoneOwners)
  }, [])

  // 충돌 핸들러
  const handleConflict = useCallback((slotId: string | null, textId: string | null, userName: string) => {
    setCurrentConflict({
      slotId: slotId || undefined,
      textId: textId || undefined,
      userId: userName, // 실제로는 userId와 userName 분리 필요
      userName,
      timestamp: Date.now(),
    })

    // 3초 후 자동 dismiss
    setTimeout(() => {
      setCurrentConflict(null)
    }, 3000)
  }, [])

  // 연결
  const connect = useCallback(async (sessionId: string, user: CollabUser) => {
    if (providerRef.current) {
      providerRef.current.disconnect()
    }

    const provider = new SupabaseYjsProvider({
      sessionId,
      user,
      onSyncStateChange: handleSyncStateChange,
      onRemoteUserChange: handleRemoteUserChange,
      onConflict: handleConflict,
    })

    providerRef.current = provider
    setLocalUser(user)

    // 현재 로컬 상태로 초기화
    const stickers = templateConfig?.layers.stickers || []
    provider.initializeState({
      formData,
      images,
      colors,
      slotTransforms,
      stickers,
    })

    await provider.connect()
    setIsConnected(true)
  }, [formData, images, colors, slotTransforms, templateConfig, handleSyncStateChange, handleRemoteUserChange, handleConflict])

  // 연결 해제
  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.disconnect()
      providerRef.current = null
    }
    setIsConnected(false)
    setRemoteUsers(new Map())
    setZoneOwners({ A: null, B: null })
  }, [])

  // 영역 선점
  const claimZone = useCallback((zone: EditingZone) => {
    if (!providerRef.current) return

    // 이미 다른 사용자가 점유 중인지 확인
    if (zone && zoneOwners[zone] && zoneOwners[zone] !== localUser?.id) {
      console.warn(`Zone ${zone} is already claimed by another user`)
      return
    }

    setMyZone(zone)
    providerRef.current.claimZone(zone)
  }, [zoneOwners, localUser])

  // 영역 소유자 가져오기
  const getZoneOwner = useCallback((zone: EditingZone): string | null => {
    if (!zone) return null
    return zoneOwners[zone]
  }, [zoneOwners])

  // 충돌 dismiss
  const dismissConflict = useCallback(() => {
    setCurrentConflict(null)
  }, [])

  // 커서 업데이트
  const updateCursor = useCallback((x: number, y: number) => {
    if (!providerRef.current || !localUser) return

    providerRef.current.updateAwareness({
      userId: localUser.id,
      cursor: { x, y },
      lastActivity: Date.now(),
    })
  }, [localUser])

  // 선택 상태 업데이트
  const updateSelection = useCallback((slotId: string | null, textId: string | null) => {
    if (!providerRef.current || !localUser) return

    providerRef.current.updateAwareness({
      userId: localUser.id,
      selectedSlotId: slotId,
      selectedTextId: textId,
      lastActivity: Date.now(),
    })
  }, [localUser])

  // 자동 연결
  useEffect(() => {
    if (autoConnect && initialSessionId && initialUser) {
      connect(initialSessionId, initialUser)
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, initialSessionId, initialUser, connect, disconnect])

  // 로컬 상태 변경 시 Yjs 업데이트 (디바운스)
  useEffect(() => {
    if (!providerRef.current || !isConnected || isSyncing) return

    const timeoutId = setTimeout(() => {
      const stickers = templateConfig?.layers.stickers || []
      providerRef.current?.initializeState({
        formData,
        images,
        colors,
        slotTransforms,
        stickers,
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [formData, images, colors, slotTransforms, templateConfig, isConnected, isSyncing])

  const value: CollabContextValue = {
    isConnected,
    isSyncing,
    localUser,
    remoteUsers,
    myZone,
    claimZone,
    getZoneOwner,
    currentConflict,
    dismissConflict,
    updateCursor,
    updateSelection,
    connect,
    disconnect,
  }

  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
}

// ============================================
// Hook
// ============================================

export function useCollab(): CollabContextValue {
  const context = useContext(CollabContext)
  if (!context) {
    throw new Error('useCollab must be used within a CollabProvider')
  }
  return context
}

// 선택적으로 collab 없이도 동작하도록
export function useCollabOptional(): CollabContextValue | null {
  return useContext(CollabContext)
}
