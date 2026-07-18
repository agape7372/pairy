// 에디터 전용 레이아웃 - 헤더/푸터 없음
// ToastProvider 는 루트 Providers 가 이미 제공하므로 여기서 중복 마운트하지 않는다.
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  )
}
