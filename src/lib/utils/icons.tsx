/**
 * 아이콘 매핑 유틸리티
 * 이모지 대신 lucide-react 아이콘을 사용합니다
 */

import {
  Heart,
  Sparkles,
  Moon,
  Clover,
  Triangle,
  ClipboardList,
  Flower2,
  Circle,
  Star,
  Palette,
  Gift,
  Mail,
  Users,
  Image,
  Pencil,
  ScrollText,
  CheckCircle,
  FileText,
  Ban,
  Coins,
  Cake,
  Calendar,
  Cloud,
  type LucideIcon,
} from 'lucide-react'

// 아이콘 이름 타입
export type IconName =
  | 'heart'
  | 'sparkles'
  | 'moon'
  | 'clover'
  | 'triangle'
  | 'clipboard'
  | 'flower'
  | 'circle'
  | 'star'
  | 'palette'
  | 'gift'
  | 'mail'
  | 'users'
  | 'image'
  | 'pencil'
  | 'scroll'
  | 'check'
  | 'file'
  | 'ban'
  | 'coins'
  | 'cake'
  | 'calendar'
  | 'cloud'

// 아이콘 이름 -> Lucide 컴포넌트 매핑
export const ICON_MAP: Record<IconName, LucideIcon> = {
  heart: Heart,
  sparkles: Sparkles,
  moon: Moon,
  clover: Clover,
  triangle: Triangle,
  clipboard: ClipboardList,
  flower: Flower2,
  circle: Circle,
  star: Star,
  palette: Palette,
  gift: Gift,
  mail: Mail,
  users: Users,
  image: Image,
  pencil: Pencil,
  scroll: ScrollText,
  check: CheckCircle,
  file: FileText,
  ban: Ban,
  coins: Coins,
  cake: Cake,
  calendar: Calendar,
  cloud: Cloud,
}

// 아이콘 색상 매핑
export const ICON_COLORS: Record<IconName, string> = {
  heart: 'text-primary-400',
  sparkles: 'text-accent-400',
  moon: 'text-gray-600',
  clover: 'text-green-500',
  triangle: 'text-orange-500',
  clipboard: 'text-blue-500',
  flower: 'text-pink-400',
  circle: 'text-gray-400',
  star: 'text-yellow-500',
  palette: 'text-purple-500',
  gift: 'text-red-400',
  mail: 'text-rose-400',
  users: 'text-blue-400',
  image: 'text-blue-500',
  pencil: 'text-purple-500',
  scroll: 'text-amber-500',
  check: 'text-green-500',
  file: 'text-gray-500',
  ban: 'text-red-500',
  coins: 'text-yellow-600',
  cake: 'text-pink-500',
  calendar: 'text-teal-500',
  cloud: 'text-sky-400',
}

// 아이콘 컴포넌트 가져오기
export function getIcon(name: IconName): LucideIcon {
  return ICON_MAP[name] || Circle
}

// 아이콘 색상 가져오기
export function getIconColor(name: IconName): string {
  return ICON_COLORS[name] || 'text-gray-500'
}

// 템플릿 아이콘 옵션 (templates/new에서 사용)
export const TEMPLATE_ICON_OPTIONS: IconName[] = [
  'heart',
  'sparkles',
  'moon',
  'clover',
  'triangle',
  'clipboard',
  'flower',
  'circle',
  'star',
  'palette',
  'gift',
  'mail',
  'users',
  'cake',
]

// 카테고리별 기본 아이콘
export const CATEGORY_ICONS: Record<string, IconName> = {
  imeres: 'image',
  tretle: 'pencil',
  pairtl: 'heart',
  sessionlog: 'scroll',
}

// 라이선스별 아이콘
export const LICENSE_ICONS: Record<string, IconName> = {
  free: 'check',
  credit: 'file',
  noncommercial: 'ban',
  paid: 'coins',
}
