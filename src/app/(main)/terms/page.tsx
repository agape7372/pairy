export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>
      <div className="prose prose-gray">
        <p className="text-gray-600">
          Pairy 서비스 이용약관입니다. 본 서비스를 이용함으로써 아래 약관에 동의하는 것으로 간주됩니다.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">1. 서비스 이용</h2>
        <p className="text-gray-600">
          Pairy는 커플/친구와 함께 포토카드를 만들 수 있는 서비스입니다.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">2. 사용자 콘텐츠</h2>
        <p className="text-gray-600">
          사용자가 업로드한 이미지와 콘텐츠의 저작권은 사용자에게 있습니다.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">3. 금지 행위</h2>
        <p className="text-gray-600">
          불법적인 콘텐츠 업로드, 타인의 권리 침해, 서비스 악용 등은 금지됩니다.
        </p>
      </div>
    </div>
  )
}
