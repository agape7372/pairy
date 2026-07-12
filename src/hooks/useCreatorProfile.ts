'use client'

import { useEffect, useState } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'

export interface CreatorTemplate {
  id: string
  title: string
  previewUrl: string
  likeCount: number
  useCount: number
}

export interface CreatorProfile {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  joinedAt: string
  followerCount: number
  templates: CreatorTemplate[]
  stats: {
    totalTemplates: number
    totalLikes: number
    totalUses: number
    followers: number
  }
}

interface UseCreatorProfileReturn {
  creator: CreatorProfile | null
  isLoading: boolean
  notFound: boolean
}

/**
 * username 으로 실 크리에이터 프로필 + 공개 템플릿 조회 (F-22).
 * 하드코딩 creatorsData 를 대체 — 실 UUID 를 useFollow 로 흘려 진짜 유저간 팔로우 성립.
 */
export function useCreatorProfile(username: string): UseCreatorProfileReturn {
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setNotFound(false)

      // 데모 모드에선 실 조회 불가 — 없는 유저로 처리(호출부가 폴백 UI).
      if (IS_DEMO_MODE) {
        if (!cancelled) { setNotFound(true); setIsLoading(false) }
        return
      }

      try {
        const supabase = createClient()

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio, follower_count, created_at')
          .eq('username', username)
          .maybeSingle()

        if (!profile) {
          if (!cancelled) { setNotFound(true); setIsLoading(false) }
          return
        }

        // 이 크리에이터의 공개 템플릿
        const { data: templates } = await supabase
          .from('templates')
          .select('id, title, preview_url, like_count, use_count')
          .eq('creator_id', profile.id)
          .eq('is_public', true)
          .order('like_count', { ascending: false })

        const tpl: CreatorTemplate[] = (templates || []).map((t) => ({
          id: t.id,
          title: t.title,
          previewUrl: t.preview_url,
          likeCount: t.like_count || 0,
          useCount: t.use_count || 0,
        }))

        const totalLikes = tpl.reduce((s, t) => s + t.likeCount, 0)
        const totalUses = tpl.reduce((s, t) => s + t.useCount, 0)

        if (!cancelled) {
          setCreator({
            id: profile.id,
            username: profile.username || username,
            displayName: profile.display_name || username,
            avatarUrl: profile.avatar_url,
            bio: profile.bio,
            joinedAt: profile.created_at,
            followerCount: profile.follower_count || 0,
            templates: tpl,
            stats: {
              totalTemplates: tpl.length,
              totalLikes,
              totalUses,
              followers: profile.follower_count || 0,
            },
          })
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) { setNotFound(true); setIsLoading(false) }
      }
    }

    load()
    return () => { cancelled = true }
  }, [username])

  return { creator, isLoading, notFound }
}
