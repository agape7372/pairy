'use client'

import { useState, useEffect } from 'react'
import { X, Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/hooks/useCreatorEarnings'

interface PayoutRequestModalProps {
  isOpen: boolean
  onClose: () => void
  availableAmount: number
  onSubmit: (amount: number, bankInfo: BankInfo) => void
}

interface BankInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
}

const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'IBK기업은행',
  '농협은행',
  '카카오뱅크',
  '토스뱅크',
  'SC제일은행',
  '케이뱅크',
]

const MIN_PAYOUT = 10000 // 최소 정산 금액

export function PayoutRequestModal({
  isOpen,
  onClose,
  availableAmount,
  onSubmit,
}: PayoutRequestModalProps) {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState(availableAmount)
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  })
  const [errors, setErrors] = useState<Partial<BankInfo & { amount: string }>>({})

  // availableAmount prop이 변경되면 amount state 동기화
  useEffect(() => {
    if (isOpen && step === 'form') {
      setAmount(availableAmount)
    }
  }, [availableAmount, isOpen, step])

  if (!isOpen) return null

  const validate = (): boolean => {
    const newErrors: Partial<BankInfo & { amount: string }> = {}

    if (amount < MIN_PAYOUT) {
      newErrors.amount = `최소 정산 금액은 ${formatCurrency(MIN_PAYOUT)}입니다.`
    }
    if (amount > availableAmount) {
      newErrors.amount = '정산 가능 금액을 초과했습니다.'
    }
    if (!bankInfo.bankName) {
      newErrors.bankName = '은행을 선택해주세요.'
    }
    if (!bankInfo.accountNumber || bankInfo.accountNumber.length < 10) {
      newErrors.accountNumber = '올바른 계좌번호를 입력해주세요.'
    }
    if (!bankInfo.accountHolder || bankInfo.accountHolder.length < 2) {
      newErrors.accountHolder = '예금주명을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep('confirm')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // 데모: 1초 지연
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onSubmit(amount, bankInfo)
    setIsSubmitting(false)
    setStep('success')
  }

  const handleClose = () => {
    setStep('form')
    setAmount(availableAmount)
    setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' })
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">정산 신청</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-4">
              {/* 정산 가능 금액 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">정산 가능 금액</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(availableAmount)}
                </p>
              </div>

              {/* 정산 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정산 신청 금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={cn(
                      'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2',
                      errors.amount
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-primary-200'
                    )}
                    min={MIN_PAYOUT}
                    max={availableAmount}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    원
                  </span>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                )}
                <button
                  onClick={() => setAmount(availableAmount)}
                  className="text-sm text-primary-500 hover:text-primary-600 mt-1"
                >
                  전액 신청
                </button>
              </div>

              {/* 은행 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  은행
                </label>
                <select
                  value={bankInfo.bankName}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, bankName: e.target.value })
                  }
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2',
                    errors.bankName
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-primary-200'
                  )}
                >
                  <option value="">은행 선택</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                {errors.bankName && (
                  <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                )}
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) =>
                    setBankInfo({
                      ...bankInfo,
                      accountNumber: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="'-' 없이 숫자만 입력"
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2',
                    errors.accountNumber
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-primary-200'
                  )}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
                )}
              </div>

              {/* 예금주 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예금주
                </label>
                <input
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) =>
                    setBankInfo({ ...bankInfo, accountHolder: e.target.value })
                  }
                  placeholder="예금주명 입력"
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2',
                    errors.accountHolder
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-primary-200'
                  )}
                />
                {errors.accountHolder && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountHolder}</p>
                )}
              </div>

              {/* 안내 메시지 */}
              <div className="p-3 bg-amber-50 rounded-xl flex gap-2 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">데모 모드 안내</p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    실제 정산이 이루어지지 않습니다. UI 테스트 용도입니다.
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={handleNext}>
                다음
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Wallet className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">정산 신청 확인</h3>
                <p className="text-sm text-gray-500">입력하신 정보를 확인해주세요</p>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-gray-500">정산 금액</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">입금 은행</span>
                  <span className="font-medium text-gray-900">{bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">계좌번호</span>
                  <span className="font-medium text-gray-900">
                    {bankInfo.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">예금주</span>
                  <span className="font-medium text-gray-900">
                    {bankInfo.accountHolder}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('form')}
                >
                  수정하기
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '신청하기'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                정산 신청 완료!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                영업일 기준 3-5일 내에 입금될 예정입니다.
                <br />
                (데모 모드에서는 실제 입금되지 않습니다)
              </p>
              <Button className="w-full" onClick={handleClose}>
                확인
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
