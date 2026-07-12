# 구글 로그인 연동 설정 가이드

> 코드·UI 는 완비됨(로그인 페이지 "Google로 계속하기" 버튼 + PKCE 콜백).
> 실작동하려면 아래 3단계(외부 콘솔 + Supabase)가 필요하다. 클라이언트 시크릿은 Claude 가 다루지 못하므로 직접 입력.

## 왜 필요한가
- 새 Supabase 프로젝트(`bbvuqbzbniappgsxajkd`)는 구글 provider 가 꺼져 있다(확인: authorize?provider=google → `provider is not enabled`).
- 구글 OAuth 앱(클라이언트 ID/시크릿)이 없으면 Supabase 가 구글에 인증 요청을 못 보낸다.

## 1단계 · 구글 클라우드 콘솔에서 OAuth 클라이언트 발급
1. https://console.cloud.google.com → 프로젝트 생성(또는 선택)
2. **API 및 서비스 → OAuth 동의 화면**: External, 앱 이름 "Pairy", 지원 이메일 입력, 저장(테스트 단계면 테스트 사용자에 본인 이메일 추가)
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI** 에 정확히 추가:
     ```
     https://bbvuqbzbniappgsxajkd.supabase.co/auth/v1/callback
     ```
   - 만들면 **클라이언트 ID** 와 **클라이언트 보안 비밀** 이 나온다(복사).

## 2단계 · Supabase 에 구글 provider 켜기
**대시보드 방식(쉬움, 권장):**
1. https://supabase.com/dashboard/project/bbvuqbzbniappgsxajkd/auth/providers
2. **Google** 열기 → Enable → 1단계의 클라이언트 ID·시크릿 붙여넣기 → Save
3. **Auth → URL Configuration**:
   - Site URL: `https://pairy-six.vercel.app`
   - Redirect URLs 에 추가: `https://pairy-six.vercel.app/**`, `http://localhost:3000/**`

**CLI 방식(선택):** 로컬 env 에 키를 넣고 URL·provider 를 한 번에 push
```bash
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="발급받은-client-id"
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="발급받은-secret"
npx supabase config push --project-ref bbvuqbzbniappgsxajkd
```
(`supabase/config.toml` 에 site_url·redirect·구글 provider 가 이미 정의됨.)

## 3단계 · 확인
- 확인 curl (성공하면 302 로 구글 로그인으로 리다이렉트):
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: <anon-key>" \
    "https://bbvuqbzbniappgsxajkd.supabase.co/auth/v1/authorize?provider=google"
  ```
  `400 provider is not enabled` → 아직 미설정 / `302` → 설정 완료
- 실제: https://pairy-six.vercel.app/login → "Google로 계속하기" → 구글 로그인 → `/auth/callback` → 프로필 자동 생성 → 로그인 완료

## 주의
- 클라이언트 시크릿은 리포에 커밋 금지(config.toml 은 env 참조만).
- 구글 동의화면이 "테스트" 단계면 등록한 테스트 사용자만 로그인 가능 — 공개하려면 "게시" 필요(민감정보 없으면 심사 없이 게시 가능).
- X(트위터) 로그인은 이번 범위 밖(버튼 제거됨, DL-0002 개정).
