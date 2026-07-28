'use client'

/**
 * Sprint 32: 협업 컨텍스트
 * Yjs 기반 실시간 동기화를 React 컴포넌트에서 사용하기 위한 컨텍스트
 *
 * [2026-01-05 Fix] 연결 안정성 개선:
 * - connect/disconnect 의존성 순환 문제 해결
 * - 에러 처리 추가
 * - 데모 모드 안전성 향상
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SupabaseYjsProvider } from './yjsProvider'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type {
  SyncState,
  CollabUser,
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
  connect: (
    sessionId: string,
    user: CollabUser,
    realtimeKey?: string
  ) => Promise<void>
  disconnect: () => void

  // H-2 완화: 서버 participants 기준 인바운드 allowlist (null = 해제)
  setAllowedUsers: (ids: string[] | null) => void
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
  const connectGenerationRef = useRef(0)
  // H-2: provider 재생성 시에도 유지되는 allowlist
  const allowedUsersRef = useRef<string[] | null>(null)
  const conflictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  } = useCanvasEditorStore(
    useShallow((state) => ({
      formData: state.formData,
      images: state.images,
      colors: state.colors,
      slotTransforms: state.slotTransforms,
      templateConfig: state.templateConfig,
    }))
  )

  // 원격 상태 변경 핸들러
  const handleSyncStateChange = useCallback((state: SyncState) => {
    // 원격에서 받은 상태로 로컬 스토어 업데이트
    // Note: 이 업데이트는 다시 Yjs로 전파되지 않도록 플래그 설정 필요
    useCanvasEditorStore.setState((current) => ({
      formData: state.formData,
      images: state.images,
      colors: state.colors,
      slotTransforms: state.slotTransforms,
      templateConfig: current.templateConfig
        ? {
            ...current.templateConfig,
            layers: {
              ...current.templateConfig.layers,
              stickers: state.stickers,
              texts: state.texts,
            },
          }
        : current.templateConfig,
      isDirty: true,
    }))
    // slotTransforms와 stickers는 별도 처리
  }, [])

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
    if (conflictTimeoutRef.current) {
      clearTimeout(conflictTimeoutRef.current)
    }

    setCurrentConflict({
      slotId: slotId || undefined,
      textId: textId || undefined,
      userId: userName, // 실제로는 userId와 userName 분리 필요
      userName,
      timestamp: Date.now(),
    })

    // 3초 후 자동 dismiss
    conflictTimeoutRef.current = setTimeout(() => {
      setCurrentConflict(null)
      conflictTimeoutRef.current = null
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (conflictTimeoutRef.current) {
        clearTimeout(conflictTimeoutRef.current)
      }
    }
  }, [])

  // H-2: 세션 참가자 allowlist 갱신 (참가자 목록이 바뀔 때마다 호출)
  const setAllowedUsers = useCallback((ids: string[] | null) => {
    allowedUsersRef.current = ids
    providerRef.current?.setAllowedUsers(ids)
  }, [])

  // 연결 (에러 처리 포함)
  const connect = useCallback(async (
    sessionId: string,
    user: CollabUser,
    realtimeKey?: string
  ) => {
    const generation = ++connectGenerationRef.current
    try {
      // 기존 연결 정리
      if (providerRef.current) {
        try {
          providerRef.current.disconnect()
        } catch (e) {
          console.warn('[CollabProvider] Error disconnecting old provider:', e)
        }
      }

      const provider = new SupabaseYjsProvider({
        sessionId,
        realtimeKey,
        user,
        onSyncStateChange: handleSyncStateChange,
        onRemoteUserChange: handleRemoteUserChange,
        onConflict: handleConflict,
        onConnectionChange: (connected) => {
          if (
            connectGenerationRef.current === generation &&
            providerRef.current === provider
          ) {
            setIsConnected(connected)
          }
        },
        onSyncingChange: (syncing) => {
          if (
            connectGenerationRef.current === generation &&
            providerRef.current === provider
          ) {
            setIsSyncing(syncing)
          }
        },
      })

      providerRef.current = provider
      provider.setAllowedUsers(allowedUsersRef.current)
      setLocalUser(user)

      // 현재 로컬 상태로 초기화 (templateConfig가 없어도 안전)
      const currentState = useCanvasEditorStore.getState()
      const stickers = currentState.templateConfig?.layers.stickers || []
      const texts = currentState.templateConfig?.layers.texts || []
      provider.prepareInitialState({
        formData: currentState.formData,
        images: currentState.images,
        colors: currentState.colors,
        slotTransforms: currentState.slotTransforms,
        stickers,
        texts,
      })

      await provider.connect()
      if (
        connectGenerationRef.current !== generation ||
        providerRef.current !== provider
      ) {
        provider.disconnect()
        return
      }
      console.log('[CollabProvider] Connected successfully')
    } catch (error) {
      console.error('[CollabProvider] Connection failed:', error)
      // 연결 실패 시 상태 정리
      if (
        connectGenerationRef.current === generation &&
        providerRef.current
      ) {
        setIsConnected(false)
        setIsSyncing(false)
        try {
          providerRef.current.disconnect()
        } catch {
          // 무시
        }
        providerRef.current = null
      }
      throw error
    }
  }, [handleSyncStateChange, handleRemoteUserChange, handleConflict])

  // 연결 해제 (에러 처리 포함)
  const disconnect = useCallback(() => {
    connectGenerationRef.current += 1
    if (providerRef.current) {
      try {
        providerRef.current.disconnect()
      } catch (e) {
        console.warn('[CollabProvider] Error during disconnect:', e)
      }
      providerRef.current = null
    }
    setIsConnected(false)
    setIsSyncing(false)
    setRemoteUsers(new Map())
    setZoneOwners({ A: null, B: null })
    setMyZone(null)
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
    if (conflictTimeoutRef.current) {
      clearTimeout(conflictTimeoutRef.current)
      conflictTimeoutRef.current = null
    }
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

  // 자동 연결 (의존성 순환 방지를 위해 ref 사용)
  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)

  // ref 업데이트
  useEffect(() => {
    connectRef.current = connect
    disconnectRef.current = disconnect
  }, [connect, disconnect])

  // 자동 연결 효과 (sessionId/user 변경 시에만 실행)
  useEffect(() => {
    if (!autoConnect || !initialSessionId || !initialUser) {
      return
    }

    // 비동기 연결 (에러 처리 포함)
    const doConnect = async () => {
      try {
        await connectRef.current(initialSessionId, initialUser)
      } catch (error) {
        console.error('[CollabProvider] Auto-connect failed:', error)
      }
    }

    doConnect()

    return () => {
      disconnectRef.current()
    }
  }, [autoConnect, initialSessionId, initialUser])

  // 로컬 상태 변경 시 Yjs 업데이트 (디바운스)
  useEffect(() => {
    if (!providerRef.current || !isConnected || isSyncing) return

    const timeoutId = setTimeout(() => {
      const stickers = templateConfig?.layers.stickers || []
      const texts = templateConfig?.layers.texts || []
      providerRef.current?.syncLocalState({
        formData,
        images,
        colors,
        slotTransforms,
        stickers,
        texts,
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [formData, images, colors, slotTransforms, templateConfig, isConnected, isSyncing])

  // 에디터 데이터 송신을 위한 provider 자체 재렌더가 context consumer까지
  // 전파되지 않도록 실제 협업 상태가 바뀔 때만 value 참조를 갱신한다.
  const value = useMemo<CollabContextValue>(() => ({
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
    setAllowedUsers,
  }), [
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
    setAllowedUsers,
  ])

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
