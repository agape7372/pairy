import { redirect } from 'next/navigation'

// /editor 접근 시 /editor/new로 리다이렉트
export default function EditorIndexPage() {
  redirect('/editor/new')
}
