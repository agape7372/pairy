'use client'

import { useState, useCallback } from 'react'
import { Edit3, Check, X, Camera } from 'lucide-react'
import { Button, ImageUpload } from '@/components/ui'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/supabase/storage'

export default function MyProfilePage() {
  const { user, profile } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)

  // 아바타 업로드 핸들러
  const handleAvatarUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!user?.id) return null

    const result = await uploadAvatar(user.id, file)

    if (result.url) {
      // DB에 아바타 URL 업데이트
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({ avatar_url: result.url })
        .eq('id', user.id)

      return result.url
    }

    return null
  }, [user?.id])

  const handleSave = async () => {
    if (!profile?.id) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
        })
        .eq('id', profile.id)

      if (error) throw error
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(profile?.display_name || '')
    setBio(profile?.bio || '')
    setIsEditing(false)
  }

  return (
    <div className="max-w-[600px]">
      {/* Avatar Section */}
      <div className="bg-white rounded-[20px] border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">프로필 사진</h2>
        <div className="flex items-center gap-6">
          <ImageUpload
            value={avatarUrl || profile?.avatar_url}
            onChange={(url) => setAvatarUrl(url || '')}
            onUpload={handleAvatarUpload}
            shape="circle"
            size="lg"
            placeholder="사진 추가"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              프로필 사진을 업로드하세요.
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, GIF, WebP 형식 (최대 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="bg-white rounded-[20px] border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">프로필 정보</h2>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
                <Check className="w-4 h-4 mr-1" />
                저장
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                placeholder="닉네임을 입력하세요"
                maxLength={20}
              />
            ) : (
              <p className="text-gray-900">{profile?.display_name || '-'}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              자기소개
            </label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
                placeholder="자기소개를 입력하세요"
                rows={3}
                maxLength={200}
              />
            ) : (
              <p className="text-gray-600">{profile?.bio || '아직 자기소개가 없어요.'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary-400">0</p>
          <p className="text-sm text-gray-500">작업</p>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-accent-400">0</p>
          <p className="text-sm text-gray-500">북마크</p>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">0</p>
          <p className="text-sm text-gray-500">좋아요</p>
        </div>
      </div>
    </div>
  )
}
