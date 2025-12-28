'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Shield, LogOut, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils/cn'

export default function MySettingsPage() {
  const router = useRouter()
  const { signOut } = useUser()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="max-w-[600px]">
      {/* Notifications */}
      <section className="bg-white rounded-[20px] border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림 설정
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            label="이메일 알림"
            description="새로운 댓글, 좋아요 등을 이메일로 받아요"
            defaultChecked={true}
          />
          <ToggleSetting
            label="마케팅 알림"
            description="이벤트, 업데이트 소식을 받아요"
            defaultChecked={false}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white rounded-[20px] border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          개인정보
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            label="프로필 공개"
            description="다른 사용자가 내 프로필을 볼 수 있어요"
            defaultChecked={true}
          />
          <ToggleSetting
            label="작업 기본 공개"
            description="새 작업을 기본적으로 공개로 설정해요"
            defaultChecked={false}
          />
        </div>
      </section>

      {/* Account Actions */}
      <section className="bg-white rounded-[20px] border border-gray-200 overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">로그아웃</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <hr className="border-gray-100" />

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-600">계정 삭제</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                정말 탈퇴하시겠어요?
              </h3>
              <p className="text-gray-500 text-sm">
                계정을 삭제하면 모든 작업과 데이터가 영구적으로 삭제되며 복구할 수 없어요.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-500 hover:!bg-red-600"
                onClick={() => {
                  // TODO: Implement account deletion
                  console.log('Delete account')
                }}
              >
                탈퇴하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  defaultChecked,
}: {
  label: string
  description: string
  defaultChecked: boolean
}) {
  const [isChecked, setIsChecked] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setIsChecked(!isChecked)}
        className={cn(
          'w-12 h-7 rounded-full transition-colors relative',
          isChecked ? 'bg-primary-400' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all',
            isChecked ? 'left-6' : 'left-1'
          )}
        />
      </button>
    </div>
  )
}
