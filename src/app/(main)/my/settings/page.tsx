'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  Link as LinkIcon,
  Unlink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/hooks/useUser'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { logError, parseError } from '@/lib/utils/error'
import { deleteProfile } from '@/lib/auth/profile'
import {
  getLinkedAccounts,
  linkAccount,
  unlinkAccount,
  hasPasswordAuth,
  type LinkedAccount,
  type OAuthProvider,
  PROVIDERS,
} from '@/lib/auth/identity'

// UI 상태 타입
type ActionState = 'idle' | 'loading' | 'success' | 'error'

interface DeleteModalState {
  isOpen: boolean
  step: 'confirm' | 'verify' | 'deleting' | 'error'
  error: string | null
}

export default function MySettingsPage() {
  const router = useRouter()
  const { user, signOut } = useUser()

  // 연결된 계정 상태
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)

  // 계정 연동 작업 상태
  const [linkingProvider, setLinkingProvider] = useState<OAuthProvider | null>(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState<OAuthProvider | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null)

  // 삭제 모달 상태
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    step: 'confirm',
    error: null,
  })
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // 로그아웃 상태
  const [isSigningOut, setIsSigningOut] = useState(false)

  // 연결된 계정 로드
  useEffect(() => {
    const loadLinkedAccounts = async () => {
      if (!isSupabaseConfigured() || !user) {
        setAccountsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { accounts } = await getLinkedAccounts(supabase)
        setLinkedAccounts(accounts)
        setHasPassword(hasPasswordAuth(user))
      } catch (err) {
        logError('LoadLinkedAccounts', err)
      } finally {
        setAccountsLoading(false)
      }
    }

    loadLinkedAccounts()
  }, [user])

  // 로그아웃 핸들러
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/')
    } catch (err) {
      logError('SignOut', err)
      setIsSigningOut(false)
    }
  }, [signOut, router])

  // 계정 연동 핸들러
  const handleLinkAccount = useCallback(async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured()) return

    setLinkingProvider(provider)
    setAccountError(null)
    setAccountSuccess(null)

    try {
      const supabase = createClient()
      const { success, error } = await linkAccount(supabase, provider, '/my/settings')

      if (!success && error) {
        setAccountError(error)
        setLinkingProvider(null)
      }
      // 성공 시 OAuth 리다이렉트가 진행됨
    } catch (err) {
      logError('LinkAccount', err)
      setAccountError(parseError(err).message)
      setLinkingProvider(null)
    }
  }, [])

  // 계정 연동 해제 핸들러
  const handleUnlinkAccount = useCallback(async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured()) return

    setUnlinkingProvider(provider)
    setAccountError(null)
    setAccountSuccess(null)

    try {
      const supabase = createClient()
      const { success, error } = await unlinkAccount(supabase, provider)

      if (success) {
        setLinkedAccounts(prev => prev.filter(a => a.provider !== provider))
        setAccountSuccess(`${PROVIDERS[provider].name} 계정 연결이 해제되었어요.`)
      } else if (error) {
        setAccountError(error)
      }
    } catch (err) {
      logError('UnlinkAccount', err)
      setAccountError(parseError(err).message)
    } finally {
      setUnlinkingProvider(null)
    }
  }, [])

  // 계정 삭제 핸들러
  const handleDeleteAccount = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) return

    setDeleteModal(prev => ({ ...prev, step: 'deleting', error: null }))

    try {
      const supabase = createClient()

      // 1. 프로필 및 관련 데이터 삭제
      const { success, error } = await deleteProfile(supabase, user.id)

      if (!success) {
        throw new Error(error || '계정 삭제에 실패했어요.')
      }

      // 2. Supabase Auth 사용자 삭제 요청 (Admin API 필요 - 클라이언트에서는 로그아웃만)
      await supabase.auth.signOut()

      // 3. 로그인 페이지로 이동
      router.push('/login?deleted=true')
    } catch (err) {
      logError('DeleteAccount', err)
      setDeleteModal(prev => ({
        ...prev,
        step: 'error',
        error: parseError(err).message,
      }))
    }
  }, [user, router])

  // 삭제 모달 닫기
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, step: 'confirm', error: null })
    setDeleteConfirmText('')
  }, [])

  // 연동 가능한 제공자 (아직 연동되지 않은 것)
  const availableProviders = Object.keys(PROVIDERS).filter(
    p => !linkedAccounts.some(a => a.provider === p)
  ) as OAuthProvider[]

  return (
    <div className="max-w-[600px] space-y-4">
      {/* Account Messages */}
      {accountError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{accountError}</span>
          <button
            onClick={() => setAccountError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {accountSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-start gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{accountSuccess}</span>
          <button
            onClick={() => setAccountSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Connected Accounts */}
      <section className="bg-white rounded-[20px] border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          연결된 계정
        </h2>

        {accountsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 연결된 계정들 */}
            {linkedAccounts.map(account => (
              <div
                key={account.provider}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <ProviderIcon provider={account.provider} />
                  <div>
                    <p className="font-medium text-gray-900">{account.providerInfo.name}</p>
                    <p className="text-sm text-gray-500">{account.email || account.name || '연결됨'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkAccount(account.provider)}
                  disabled={unlinkingProvider === account.provider || linkedAccounts.length <= 1}
                  className="text-gray-500 hover:text-red-500"
                >
                  {unlinkingProvider === account.provider ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}

            {/* 비밀번호 인증 */}
            {hasPassword && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Key className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">이메일 & 비밀번호</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/reset-password')}
                  className="text-primary-500"
                >
                  변경
                </Button>
              </div>
            )}

            {/* 연결 가능한 계정들 */}
            {availableProviders.length > 0 && (
              <>
                <div className="border-t border-gray-200 my-4" />
                <p className="text-sm text-gray-500 mb-3">계정 연결하기</p>
                {availableProviders.map(provider => (
                  <button
                    key={provider}
                    onClick={() => handleLinkAccount(provider)}
                    disabled={linkingProvider !== null}
                    className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <ProviderIcon provider={provider} />
                      <span className="font-medium text-gray-700">
                        {PROVIDERS[provider].name} 연결
                      </span>
                    </div>
                    {linkingProvider === provider ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-[20px] border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림 설정
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            id="email-notifications"
            label="이메일 알림"
            description="새로운 댓글, 좋아요 등을 이메일로 받아요"
            defaultChecked={true}
          />
          <ToggleSetting
            id="marketing-notifications"
            label="마케팅 알림"
            description="이벤트, 업데이트 소식을 받아요"
            defaultChecked={false}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white rounded-[20px] border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          개인정보
        </h2>

        <div className="space-y-4">
          <ToggleSetting
            id="profile-public"
            label="프로필 공개"
            description="다른 사용자가 내 프로필을 볼 수 있어요"
            defaultChecked={true}
          />
          <ToggleSetting
            id="work-public"
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
          disabled={isSigningOut}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            {isSigningOut ? (
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-gray-500" />
            )}
            <span className="font-medium text-gray-900">로그아웃</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <hr className="border-gray-100" />

        <button
          onClick={() => setDeleteModal({ isOpen: true, step: 'confirm', error: null })}
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
      {deleteModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && deleteModal.step !== 'deleting') {
              closeDeleteModal()
            }
          }}
        >
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-6 animate-scale-in">
            {/* Step 1: Confirm */}
            {deleteModal.step === 'confirm' && (
              <>
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
                    onClick={closeDeleteModal}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 !bg-red-500 hover:!bg-red-600"
                    onClick={() => setDeleteModal(prev => ({ ...prev, step: 'verify' }))}
                  >
                    계속
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Verify */}
            {deleteModal.step === 'verify' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    최종 확인
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    확인을 위해 아래에 <strong className="text-red-500">"탈퇴합니다"</strong>를 입력해주세요.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="탈퇴합니다"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-center"
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setDeleteModal(prev => ({ ...prev, step: 'confirm' }))}
                  >
                    이전
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 !bg-red-500 hover:!bg-red-600"
                    disabled={deleteConfirmText !== '탈퇴합니다'}
                    onClick={handleDeleteAccount}
                  >
                    탈퇴하기
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Deleting */}
            {deleteModal.step === 'deleting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-red-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium">계정을 삭제하고 있어요...</p>
                <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요.</p>
              </div>
            )}

            {/* Step 4: Error */}
            {deleteModal.step === 'error' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    삭제 실패
                  </h3>
                  <p className="text-red-500 text-sm">
                    {deleteModal.error || '계정 삭제 중 오류가 발생했어요.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={closeDeleteModal}
                  >
                    닫기
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 !bg-red-500 hover:!bg-red-600"
                    onClick={() => setDeleteModal(prev => ({ ...prev, step: 'verify' }))}
                  >
                    다시 시도
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 제공자 아이콘 컴포넌트
function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </div>
    )
  }

  if (provider === 'twitter') {
    return (
      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    )
  }

  return null
}

// 토글 설정 컴포넌트
function ToggleSetting({
  id,
  label,
  description,
  defaultChecked,
}: {
  id: string
  label: string
  description: string
  defaultChecked: boolean
}) {
  const [isChecked, setIsChecked] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor={id} className="font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={isChecked}
        onClick={() => setIsChecked(!isChecked)}
        className={cn(
          'w-12 h-7 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2',
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
