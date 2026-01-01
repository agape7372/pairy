/**
 * 프로필 유틸리티 테스트
 */

import {
  sanitizeUsername,
  sanitizeDisplayName,
  sanitizeBio,
  extractProfileFromUser,
} from '../profile'

describe('sanitizeUsername', () => {
  it('영문 소문자, 숫자, 언더스코어만 허용해야 함', () => {
    expect(sanitizeUsername('test_user123')).toBe('test_user123')
  })

  it('대문자를 소문자로 변환해야 함', () => {
    expect(sanitizeUsername('TestUser')).toBe('testuser')
  })

  it('특수문자를 언더스코어로 변환해야 함', () => {
    expect(sanitizeUsername('test-user@email.com')).toBe('test_user_email_com')
  })

  it('한글을 언더스코어로 변환해야 함', () => {
    // '테스트유저'는 5글자이므로 5개의 언더스코어가 됨
    expect(sanitizeUsername('테스트유저')).toBe('_____')
  })

  it('20자로 제한해야 함', () => {
    const longUsername = 'a'.repeat(30)
    expect(sanitizeUsername(longUsername)).toBe('a'.repeat(20))
  })

  it('null을 null로 반환해야 함', () => {
    expect(sanitizeUsername(null)).toBeNull()
  })

  it('undefined를 null로 반환해야 함', () => {
    expect(sanitizeUsername(undefined)).toBeNull()
  })

  it('빈 문자열을 null로 반환해야 함', () => {
    expect(sanitizeUsername('')).toBeNull()
  })
})

describe('sanitizeDisplayName', () => {
  it('일반 텍스트를 허용해야 함', () => {
    expect(sanitizeDisplayName('홍길동')).toBe('홍길동')
  })

  it('XSS 위험 문자를 제거해야 함', () => {
    expect(sanitizeDisplayName('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
    expect(sanitizeDisplayName('Test"Name')).toBe('TestName')
    expect(sanitizeDisplayName("Test'Name")).toBe('TestName')
    expect(sanitizeDisplayName('Test&Name')).toBe('TestName')
  })

  it('30자로 제한해야 함', () => {
    const longName = '가'.repeat(40)
    expect(sanitizeDisplayName(longName)?.length).toBe(30)
  })

  it('앞뒤 공백을 제거해야 함', () => {
    expect(sanitizeDisplayName('  홍길동  ')).toBe('홍길동')
  })

  it('null을 null로 반환해야 함', () => {
    expect(sanitizeDisplayName(null)).toBeNull()
  })

  it('undefined를 null로 반환해야 함', () => {
    expect(sanitizeDisplayName(undefined)).toBeNull()
  })
})

describe('sanitizeBio', () => {
  it('일반 텍스트를 허용해야 함', () => {
    expect(sanitizeBio('안녕하세요! 반갑습니다.')).toBe('안녕하세요! 반갑습니다.')
  })

  it('HTML 태그 위험 문자를 제거해야 함', () => {
    expect(sanitizeBio('<p>텍스트</p>')).toBe('p텍스트/p')
    expect(sanitizeBio('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
  })

  it('200자로 제한해야 함', () => {
    const longBio = '가'.repeat(250)
    expect(sanitizeBio(longBio)?.length).toBe(200)
  })

  it('앞뒤 공백을 제거해야 함', () => {
    expect(sanitizeBio('  자기소개  ')).toBe('자기소개')
  })

  it('null을 null로 반환해야 함', () => {
    expect(sanitizeBio(null)).toBeNull()
  })

  it('따옴표와 앰퍼샌드는 허용해야 함 (bio에서는 덜 위험)', () => {
    // bio는 display_name보다 덜 엄격함
    expect(sanitizeBio("It's a test & more")).toBe("It's a test & more")
  })
})

describe('extractProfileFromUser', () => {
  it('Google OAuth 사용자에서 프로필 정보를 추출해야 함', () => {
    const user = {
      id: 'user-123',
      email: 'test@gmail.com',
      user_metadata: {
        full_name: '홍길동',
        avatar_url: 'https://example.com/avatar.jpg',
        email: 'test@gmail.com',
      },
    }

    const profile = extractProfileFromUser(user as any)

    expect(profile.displayName).toBe('홍길동')
    expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg')
    expect(profile.username).toBe('test')
  })

  it('Twitter OAuth 사용자에서 프로필 정보를 추출해야 함', () => {
    const user = {
      id: 'user-456',
      email: null,
      user_metadata: {
        name: '트위터유저',
        preferred_username: 'twitter_user',
        picture: 'https://pbs.twimg.com/avatar.jpg',
      },
    }

    const profile = extractProfileFromUser(user as any)

    expect(profile.displayName).toBe('트위터유저')
    expect(profile.username).toBe('twitter_user')
    expect(profile.avatarUrl).toBe('https://pbs.twimg.com/avatar.jpg')
  })

  it('이메일만 있는 사용자를 처리해야 함', () => {
    const user = {
      id: 'user-789',
      email: 'simple@test.com',
      user_metadata: {},
    }

    const profile = extractProfileFromUser(user as any)

    expect(profile.displayName).toBe('simple')
    expect(profile.username).toBe('simple')
    expect(profile.avatarUrl).toBeNull()
  })

  it('메타데이터가 없는 사용자를 처리해야 함', () => {
    const user = {
      id: 'user-abc123',
      email: null,
      user_metadata: undefined,
    }

    const profile = extractProfileFromUser(user as any)

    expect(profile.displayName).toBe('새로운 사용자')
    expect(profile.username).toBe('user_abc')
  })

  it('사용자명을 정규화해야 함', () => {
    const user = {
      id: 'user-xyz',
      email: 'Test-User@Example.COM',
      user_metadata: {},
    }

    const profile = extractProfileFromUser(user as any)

    // 소문자로 변환되고 특수문자가 변환됨
    expect(profile.username).toBe('test_user')
  })
})
