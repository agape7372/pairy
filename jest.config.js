// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // next.config.js와 .env 파일을 로드할 Next.js 앱 경로
  dir: './',
})

// Jest 커스텀 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // @/ 경로 별칭 처리
    '^@/(.*)$': '<rootDir>/src/$1',
    // @webtoon/psd(ESM/WASM 바이너리 파서)를 유닛 테스트에서 스텁으로 격리
    '^@webtoon/psd$': '<rootDir>/jest.mocks/webtoon-psd.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/', // Playwright E2E 테스트 제외
    '<rootDir>/.claude/', // 로컬 git worktree 복사본 제외
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
