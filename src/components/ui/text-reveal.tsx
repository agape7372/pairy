'use client'

import { motion, Variants, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { springPresets, easingPresets } from '@/hooks/useAdvancedInteractions'

/**
 * TextReveal - 글자 단위 애니메이션 텍스트 컴포넌트
 *
 * 디자인 철학: "보이지 않는 고급스러움"
 * - 글자가 아래에서 위로 회전하며 나타남
 * - 각 글자 사이에 미세한 딜레이
 * - 가독성을 해치지 않는 선에서 우아함을 더함
 */

interface TextRevealProps {
  /** 표시할 텍스트 */
  text: string
  /** 추가 className */
  className?: string
  /** 래퍼 요소 타입 */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  /** 각 글자 간 딜레이 (초) */
  charDelay?: number
  /** 뷰포트에 들어올 때만 애니메이션 */
  animateOnView?: boolean
  /** 한 번만 애니메이션 */
  once?: boolean
}

export function TextReveal({
  text,
  className,
  as: Component = 'span',
  charDelay = 0.03,
  animateOnView = true,
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once, margin: '-50px' })

  // 글자 단위로 분리
  const chars = text.split('')

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: charDelay,
      },
    },
  }

  const charVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: 45,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        ...springPresets.gentle,
      },
    },
  }

  return (
    <motion.span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={cn('text-reveal-container inline-block', className)}
      variants={containerVariants}
      initial="hidden"
      animate={animateOnView ? (isInView ? 'visible' : 'hidden') : 'visible'}
      aria-label={text}
    >
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="text-reveal-char"
          variants={charVariants}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

/**
 * WordReveal - 단어 단위 애니메이션 (더 읽기 편함)
 */
interface WordRevealProps {
  text: string
  className?: string
  wordDelay?: number
  animateOnView?: boolean
  once?: boolean
}

export function WordReveal({
  text,
  className,
  wordDelay = 0.08,
  animateOnView = true,
  once = true,
}: WordRevealProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once, margin: '-50px' })

  const words = text.split(' ')

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: wordDelay,
      },
    },
  }

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 15,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        ...springPresets.gentle,
      },
    },
  }

  return (
    <motion.span
      ref={ref}
      className={cn('inline-block', className)}
      variants={containerVariants}
      initial="hidden"
      animate={animateOnView ? (isInView ? 'visible' : 'hidden') : 'visible'}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block mr-[0.25em]"
          variants={wordVariants}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

/**
 * LineReveal - 줄 단위 애니메이션 (긴 텍스트용)
 */
interface LineRevealProps {
  /** 각 줄의 텍스트 배열 */
  lines: string[]
  className?: string
  lineClassName?: string
  lineDelay?: number
  animateOnView?: boolean
  once?: boolean
}

export function LineReveal({
  lines,
  className,
  lineClassName,
  lineDelay = 0.1,
  animateOnView = true,
  once = true,
}: LineRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: '-50px' })

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: lineDelay,
      },
    },
  }

  const lineVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      clipPath: 'inset(0 0 100% 0)',
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      transition: {
        duration: 0.5,
        ease: easingPresets.quarticOut,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={cn('overflow-hidden', className)}
      variants={containerVariants}
      initial="hidden"
      animate={animateOnView ? (isInView ? 'visible' : 'hidden') : 'visible'}
    >
      {lines.map((line, index) => (
        <motion.div
          key={index}
          className={cn('overflow-hidden', lineClassName)}
          variants={lineVariants}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  )
}
