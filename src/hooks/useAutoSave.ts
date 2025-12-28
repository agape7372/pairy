'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'

interface UseAutoSaveOptions {
  interval?: number // 자동저장 간격 (ms)
  enabled?: boolean
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    interval = 30000, // 기본 30초
    enabled = true,
    onSaveSuccess,
    onSaveError,
  } = options

  const {
    workId,
    slots,
    title,
    canvasWidth,
    canvasHeight,
    isDirty,
    isSaving,
    setSaving,
    markSaved,
    exportToJSON,
  } = useEditorStore()

  const lastSaveRef = useRef<string | null>(null)

  // 저장 함수
  const save = useCallback(async () => {
    if (!workId || isSaving || !isDirty) return false

    // 변경사항이 없으면 저장하지 않음
    const currentState = exportToJSON()
    if (currentState === lastSaveRef.current) return false

    // 데모 모드: 로컬에만 저장된 것처럼 표시
    if (IS_DEMO_MODE) {
      lastSaveRef.current = currentState
      markSaved()
      onSaveSuccess?.()
      return true
    }

    try {
      setSaving(true)

      const supabase = createClient()

      // JSON 직렬화를 통해 Supabase Json 타입과 호환되도록 변환
      const editorData = JSON.parse(JSON.stringify({
        version: 1,
        canvasWidth,
        canvasHeight,
        slots,
      }))

      const { error } = await supabase
        .from('works')
        .update({
          title,
          editor_data: editorData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workId)

      if (error) throw error

      lastSaveRef.current = currentState
      markSaved()
      onSaveSuccess?.()
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('저장 실패')
      onSaveError?.(error)
      setSaving(false)
      return false
    }
  }, [
    workId,
    slots,
    title,
    canvasWidth,
    canvasHeight,
    isDirty,
    isSaving,
    setSaving,
    markSaved,
    exportToJSON,
    onSaveSuccess,
    onSaveError,
  ])

  // 자동저장 타이머
  useEffect(() => {
    if (!enabled || !workId) return

    const timer = setInterval(() => {
      if (isDirty && !isSaving) {
        save()
      }
    }, interval)

    return () => clearInterval(timer)
  }, [enabled, workId, interval, isDirty, isSaving, save])

  // 페이지 이탈 시 저장
  useEffect(() => {
    if (!enabled || !workId) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, workId, isDirty])

  // 단축키 저장 (Ctrl+S / Cmd+S)
  useEffect(() => {
    if (!enabled || !workId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, workId, save])

  return {
    save,
    isSaving,
    isDirty,
  }
}

// localStorage 기반 임시 저장 (로그인 전 사용자용)
export function useLocalAutoSave(key: string) {
  const { exportToJSON, importFromJSON } = useEditorStore()

  const saveToLocal = useCallback(() => {
    try {
      const data = exportToJSON()
      localStorage.setItem(key, data)
      return true
    } catch {
      return false
    }
  }, [key, exportToJSON])

  const loadFromLocal = useCallback(() => {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        importFromJSON(data)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [key, importFromJSON])

  const clearLocal = useCallback(() => {
    localStorage.removeItem(key)
  }, [key])

  const hasLocalSave = useCallback(() => {
    return localStorage.getItem(key) !== null
  }, [key])

  return {
    saveToLocal,
    loadFromLocal,
    clearLocal,
    hasLocalSave,
  }
}
