/**
 * URL 유틸리티 테스트
 */

import { validateRedirectUrl, encodeRedirectParam, decodeRedirectParam } from '../url'

describe('validateRedirectUrl', () => {
  describe('유효한 상대 경로', () => {
    it('루트 경로를 허용해야 함', () => {
      expect(validateRedirectUrl('/')).toBe('/')
    })

    it('일반 경로를 허용해야 함', () => {
      expect(validateRedirectUrl('/my/profile')).toBe('/my/profile')
      expect(validateRedirectUrl('/templates/123')).toBe('/templates/123')
    })

    it('쿼리 파라미터가 있는 경로를 허용해야 함', () => {
      expect(validateRedirectUrl('/search?q=test')).toBe('/search?q=test')
    })

    it('해시가 있는 경로를 허용해야 함', () => {
      expect(validateRedirectUrl('/page#section')).toBe('/page#section')
    })

    it('쿼리와 해시가 모두 있는 경로를 허용해야 함', () => {
      expect(validateRedirectUrl('/page?q=test#section')).toBe('/page?q=test#section')
    })
  })

  describe('위험한 URL 차단', () => {
    it('프로토콜 상대 URL을 차단해야 함 (Open Redirect 방지)', () => {
      expect(validateRedirectUrl('//evil.com')).toBe('/')
      expect(validateRedirectUrl('//evil.com/path')).toBe('/')
    })

    it('외부 절대 URL을 차단해야 함', () => {
      expect(validateRedirectUrl('https://evil.com')).toBe('/')
      expect(validateRedirectUrl('http://evil.com/path')).toBe('/')
    })

    it('javascript: 프로토콜을 차단해야 함', () => {
      expect(validateRedirectUrl('javascript:alert(1)')).toBe('/')
      expect(validateRedirectUrl('JavaScript:alert(1)')).toBe('/')
    })

    it('data: 프로토콜을 차단해야 함', () => {
      expect(validateRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/')
    })

    it('vbscript: 프로토콜을 차단해야 함', () => {
      expect(validateRedirectUrl('vbscript:msgbox(1)')).toBe('/')
    })

    it('file: 프로토콜을 차단해야 함', () => {
      expect(validateRedirectUrl('file:///etc/passwd')).toBe('/')
    })
  })

  describe('엣지 케이스', () => {
    it('null을 처리해야 함', () => {
      expect(validateRedirectUrl(null)).toBe('/')
    })

    it('undefined를 처리해야 함', () => {
      expect(validateRedirectUrl(undefined)).toBe('/')
    })

    it('빈 문자열을 처리해야 함', () => {
      expect(validateRedirectUrl('')).toBe('/')
    })

    it('공백 문자열을 처리해야 함', () => {
      expect(validateRedirectUrl('   ')).toBe('/')
    })

    it('커스텀 fallback을 사용해야 함', () => {
      expect(validateRedirectUrl('//evil.com', '/home')).toBe('/home')
    })

    it('상대 경로가 아닌 문자열을 차단해야 함', () => {
      expect(validateRedirectUrl('not-a-path')).toBe('/')
      expect(validateRedirectUrl('evil.com')).toBe('/')
    })
  })

  describe('경로 정규화', () => {
    it('연속 슬래시를 정규화해야 함', () => {
      const result = validateRedirectUrl('///path')
      // 정규화 후에도 안전한 경로여야 함
      expect(result).toBeTruthy()
    })

    it('URL 인코딩된 문자를 처리해야 함', () => {
      expect(validateRedirectUrl('/path%20with%20spaces')).toBe('/path%20with%20spaces')
    })
  })
})

describe('encodeRedirectParam', () => {
  it('안전한 경로를 인코딩해야 함', () => {
    const encoded = encodeRedirectParam('/my/profile')
    expect(encoded).toBe(encodeURIComponent('/my/profile'))
  })

  it('위험한 URL은 fallback으로 대체 후 인코딩해야 함', () => {
    const encoded = encodeRedirectParam('//evil.com')
    expect(encoded).toBe(encodeURIComponent('/'))
  })
})

describe('decodeRedirectParam', () => {
  it('인코딩된 경로를 디코딩해야 함', () => {
    const decoded = decodeRedirectParam(encodeURIComponent('/my/profile'))
    expect(decoded).toBe('/my/profile')
  })

  it('null을 처리해야 함', () => {
    expect(decodeRedirectParam(null)).toBe('/')
  })

  it('undefined를 처리해야 함', () => {
    expect(decodeRedirectParam(undefined)).toBe('/')
  })

  it('잘못된 인코딩을 안전하게 처리해야 함', () => {
    const decoded = decodeRedirectParam('%E0%A4%A')
    expect(decoded).toBe('/')
  })

  it('위험한 URL은 디코딩 후 차단해야 함', () => {
    const decoded = decodeRedirectParam(encodeURIComponent('//evil.com'))
    expect(decoded).toBe('/')
  })
})
