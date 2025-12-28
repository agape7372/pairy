// 에디터 전용 레이아웃 - 전역 헤더/푸터 없이 렌더링
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
