import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pairy Archive - 샘플 디자인',
  description: '새로운 갤러리 스타일 디자인 미리보기',
}

export default function SampleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Pretendard 폰트 */}
      <link
        rel="stylesheet"
        as="style"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .font-pretendard {
              font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
            }

            /* Scrollbar hide utility */
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `,
        }}
      />
      <div className="font-pretendard">{children}</div>
    </>
  )
}
