# Code Simplifier

Simplify and refine the code for clarity, consistency, and maintainability while preserving all functionality.

## 대상
$ARGUMENTS 파일 또는 최근 수정된 코드

## 원칙

1. **기능 보존**: 원래 동작을 100% 유지하면서 구현만 개선
2. **프로젝트 컨벤션 준수**:
   - ES modules 사용
   - 명시적 타입 annotation
   - React 컴포넌트 prop 타이핑
3. **가독성 우선**:
   - 불필요한 중첩 제거
   - 중첩 삼항연산자 → switch/if-else로 변환
   - 명확한 네이밍
   - 불필요한 추상화 제거

## 금지 사항
- 과도한 최적화로 디버깅 어렵게 만들기
- 관련 없는 로직 합치기
- 가독성 희생한 한줄 코드

## 실행
대상 코드를 분석하고 위 원칙에 따라 리팩토링하세요.
