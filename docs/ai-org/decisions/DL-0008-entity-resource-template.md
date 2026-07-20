# DL-0008 — entity 정본: resource ≠ template (분리 유지 + 용어 정본화, H-08)

- 상태: DECIDED · 슬라이스 실행 defer(에디터 DB 로드 foundation 선행)
- 일자: 2026-07-20
- 판단 주체: 사용자(entity 모델 결정) + Opus(정본화·슬라이스 설계)
- 관련: [[DL-0006]], F-15(템플릿 아카이브)·F-16a(틀 빌더)·F-16b(자료 업로드)·F-01(에디터)·F-28, 2차 감사 H-08

## 맥락 / 문제 (3중 분열, 2차 감사 H-08 CONFIRMED)

- `/templates` 허브는 **resources** 를 보여줌(자료 허브).
- `/templates/new`(틀 빌더)는 **templates** 에 저장.
- `/resources/new`(자료 업로드)는 **resources** 에 저장.
- 에디터 상세 `작업 시작` query(`?template=<resourceId>`)는 무시됨(TemplateSelectionStep).
- 캔버스가 UUID 틀을 DB `templates.editor_data` 가 아니라 **정적 `public/templates/*.json`** 에서 로드(정적 export 잔재).
- add-library 는 timeout 후 가짜 성공 토스트(테이블 insert 없음).

## 결정 (사용자 승인)

**resource 와 template 은 별개 엔티티로 유지하고, 용어를 정본화한다.**

| 엔티티 | 정의 | 저장/경로 | 용어(UI) |
|---|---|---|---|
| **template** | 에디터에서 편집하는 **틀(페어틀)** — 슬롯·레이어 구조 | `templates` 테이블, `/templates/new` 빌더, `/canvas-editor/[id]` | "틀" / "페어틀" |
| **resource** | 다운로드용 **자료**(브러시·PSD·소품 등) | `resources` 테이블, `/resources/new`, 허브 | "자료" |

- **통합하지 않음**(대공사·URL 대이동 회피). 두 엔티티의 관계 = 느슨(자료로 틀을 만들 수 있으나 별개 저장).
- **URL 하위호환 유지**: 기존 `/templates/*`·`/share/*`·`/canvas-editor/*` 경로 보존.

## vertical slice 계획 (게시→발견→편집→저장, 실행 defer)

> 하나의 흐름을 실 배선하되, 아래 **선행 foundation** 이 필요해 이번 세션엔 결정만 기록.

1. **용어 정본화(저위험, 선행 가능)**: `/templates` 허브가 자료(resource)를 보이면 UI 문구를 "자료 허브"로 통일, 편집 틀은 "틀"로. 라우트는 유지(하위호환), 문구만.
2. **에디터 DB 로드(핵심·선행조건)**: 캔버스가 `templates.editor_data`(DB)에서 틀을 로드하도록 전환 — 현재 정적 JSON 서빙(정적 export 잔재). **F-28 갱신(DL-0004)이 지적한 "editor_data 실서빙 미배선"이 이 작업**. 프리미엄 콘텐츠 RLS·유료 자료 사설전달(C-01b)도 여기에 의존.
3. **deep-link query 사용**: 상세 `작업 시작` → `/editor/new?template=<id>` 의 query 를 TemplateSelectionStep 이 hydrate. 미지원 값은 정직 처리.
4. **add-library 실 insert**: 가짜 토스트 → `library_folders`/북마크 테이블 실 기록 or 정직한 "준비 중".

## 왜 slice 실행 defer

- 2번(에디터 DB 로드)은 **에디터 로드/저장 경로**를 건드린다 — 방금 봉합한 저장(C-02)·협업(H-07)과 겹쳐 회귀면이 크고, 정적 JSON→DB 전환은 기존 샘플 틀·공유 링크 호환(하위호환 계약)을 먼저 설계해야 한다.
- 실 fixture(real UUID template)로 게시→발견→편집→저장 E2E 가 필요(정적 분석만으로 불충분).
- 따라서 **정본(이 문서)** 을 먼저 고정하고, slice 는 F-28 editor_data 실서빙과 함께 하나의 흐름으로 실행.

## 되돌림 / 후속

- 용어 정본화(1번)는 독립 저위험 → 선행 착수 가능.
- 통합(merge)으로 뒤집으려면 URL redirect·SEO·share 링크 호환 계약을 먼저 작성(이 결정의 "분리 유지" 재검토).
