/**
 * Sprint 35: Whisper 사운드 효과
 *
 * 위스퍼 도착 시 청아한 풍경 소리(Wind chime) 재생
 */

// ============================================
// 사운드 설정
// ============================================

interface SoundConfig {
  volume: number
  enabled: boolean
}

const DEFAULT_CONFIG: SoundConfig = {
  volume: 0.3, // 아주 작게
  enabled: true,
}

// localStorage 키
const SOUND_CONFIG_KEY = 'pairy_whisper_sound_config'

// ============================================
// AudioContext 싱글톤
// ============================================

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch (e) {
      console.warn('[WhisperSound] AudioContext not supported:', e)
      return null
    }
  }

  return audioContext
}

// ============================================
// 풍경 소리 합성 (Web Audio API)
// ============================================

/**
 * 풍경(Wind chime) 소리 합성 (하모닉 포함)
 * 순수 Web Audio API로 청아한 종소리를 합성합니다.
 */
function synthesizeRichWindChime(ctx: AudioContext, volume: number): void {
  // 기본 주파수 + 하모닉
  const notes = [
    { freq: 880, delay: 0, duration: 2.0 },     // A5
    { freq: 1046.5, delay: 0.1, duration: 1.8 }, // C6
    { freq: 1318.5, delay: 0.2, duration: 1.6 }, // E6
    { freq: 1568, delay: 0.35, duration: 1.4 },  // G6
  ]

  notes.forEach(({ freq, delay, duration }) => {
    // 기본음
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = freq

    // 하모닉 (2배음)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = freq * 2

    osc.connect(gain)
    osc2.connect(gain2)
    gain.connect(ctx.destination)
    gain2.connect(ctx.destination)

    const startTime = ctx.currentTime + delay

    // 기본음 엔벨로프
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    // 하모닉 엔벨로프 (더 빠르게 감쇠)
    gain2.gain.setValueAtTime(0, startTime)
    gain2.gain.linearRampToValueAtTime(volume * 0.05, startTime + 0.003)
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5)

    osc.start(startTime)
    osc.stop(startTime + duration)
    osc2.start(startTime)
    osc2.stop(startTime + duration * 0.5)
  })
}

// ============================================
// 공개 API
// ============================================

/**
 * 위스퍼 도착 사운드 재생
 */
export function playWhisperSound(): void {
  const config = getSoundConfig()
  if (!config.enabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  // AudioContext가 suspended 상태면 resume
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      synthesizeRichWindChime(ctx, config.volume)
    })
  } else {
    synthesizeRichWindChime(ctx, config.volume)
  }
}

/**
 * 간단한 알림음 (버튼 클릭 등)
 */
export function playClickSound(): void {
  const config = getSoundConfig()
  if (!config.enabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = 1200

  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(config.volume * 0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.1)
}

/**
 * 선물 수령 사운드
 */
export function playClaimSound(): void {
  const config = getSoundConfig()
  if (!config.enabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  // 상승하는 아르페지오
  const frequencies = [523.25, 659.25, 783.99, 1046.5]

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = freq

    osc.connect(gain)
    gain.connect(ctx.destination)

    const startTime = ctx.currentTime + index * 0.08

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(config.volume * 0.15, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)

    osc.start(startTime)
    osc.stop(startTime + 0.5)
  })
}

// ============================================
// 설정 관리
// ============================================

/**
 * 사운드 설정 가져오기
 */
export function getSoundConfig(): SoundConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG

  try {
    const stored = localStorage.getItem(SOUND_CONFIG_KEY)
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
    }
  } catch {
    // 파싱 실패 시 기본값
  }

  return DEFAULT_CONFIG
}

/**
 * 사운드 설정 저장
 */
export function setSoundConfig(config: Partial<SoundConfig>): void {
  if (typeof window === 'undefined') return

  const current = getSoundConfig()
  const newConfig = { ...current, ...config }

  try {
    localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(newConfig))
  } catch {
    // 저장 실패 무시
  }
}

/**
 * 사운드 활성화 토글
 */
export function toggleSound(): boolean {
  const config = getSoundConfig()
  const newEnabled = !config.enabled
  setSoundConfig({ enabled: newEnabled })
  return newEnabled
}
