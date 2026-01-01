import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">도움말</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Pairy란?</h2>
          <p className="text-gray-600">
            Pairy는 커플이나 친구와 함께 특별한 포토카드를 만들 수 있는 서비스입니다.
            다양한 템플릿을 활용해 소중한 추억을 담아보세요.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">시작하기</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Google 또는 이메일로 로그인하세요</li>
            <li>마음에 드는 템플릿을 선택하세요</li>
            <li>사진을 업로드하고 꾸며보세요</li>
            <li>완성된 포토카드를 저장하거나 공유하세요</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">자주 묻는 질문</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Q. 무료로 사용할 수 있나요?</h3>
              <p className="text-gray-600">네, 기본 기능은 무료로 제공됩니다.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Q. 만든 작품은 어디에 저장되나요?</h3>
              <p className="text-gray-600">&apos;내 서재&apos;에서 모든 작품을 확인할 수 있습니다.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">문의하기</h2>
          <p className="text-gray-600">
            추가 문의사항이 있으시면 이메일로 연락해주세요.
          </p>
        </section>
      </div>
    </div>
  )
}
