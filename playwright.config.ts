import fs from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// 사전 설치 브라우저가 있는 환경(예: Claude Code 원격 컨테이너)에서는 그 실행 파일을 사용
// — @playwright/test 버전이 요구하는 리비전 재다운로드 없이 실행 가능하게 한다.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const chromiumExecutablePath = fs.existsSync(PREINSTALLED_CHROMIUM)
  ? PREINSTALLED_CHROMIUM
  : undefined
const requestedPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '3000', 10)
const playwrightPort =
  Number.isInteger(requestedPort) &&
  requestedPort > 0 &&
  requestedPort <= 65535
    ? requestedPort
    : 3000
const baseURL = `http://localhost:${playwrightPort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : {},
      },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${playwrightPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
