export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
      <div className="prose prose-gray">
        <p className="text-gray-600">
          Pairy는 사용자의 개인정보를 소중히 여기며, 관련 법령에 따라 처리합니다.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. 수집하는 정보</h2>
        <p className="text-gray-600">
          이메일 주소, 프로필 정보(이름, 프로필 사진), 서비스 이용 기록
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">2. 정보 이용 목적</h2>
        <p className="text-gray-600">
          서비스 제공, 사용자 인증, 서비스 개선 및 분석
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. 정보 보관 기간</h2>
        <p className="text-gray-600">
          회원 탈퇴 시까지 보관하며, 탈퇴 후 즉시 삭제됩니다.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">4. 문의</h2>
        <p className="text-gray-600">
          개인정보 관련 문의는 서비스 내 문의하기를 이용해주세요.
        </p>
      </div>
    </div>
  )
}
