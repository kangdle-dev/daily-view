# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 중요: Git 배포 및 소스 수정 정책

**Git push 및 소스 코드 수정은 반드시 사용자의 명시적 승인이 필요합니다.**
- ❌ 자동으로 `git push` 하지 말 것
- ❌ 자동으로 `git commit` 하지 말 것
- ❌ 자동으로 코드 수정하지 말 것

**절차:**
1. 변경사항 설명 및 확인 요청
2. 사용자 승인 후에만 코드 수정
3. 사용자가 "진행해줘" 등으로 명시 지시한 후에만 커밋/푸시

## Commands

```bash
# 개발 (프론트엔드 + 백엔드 별도 실행)
npm run dev       # Vite 개발 서버 (포트 5173, /api → localhost:3001 프록시)
npm run server    # Express 서버 단독 실행 (포트 3001)

# 빌드 & 프로덕션
npm run build     # Vite 빌드 → dist/
npm start         # NODE_ENV=production node server/index.js
```

개발 시 두 터미널에서 `npm run dev`와 `npm run server`를 동시에 실행해야 한다.

## Docker (Railway 환경 동일하게 테스트)

로컬에서 Linux 환경(Railway와 동일)으로 테스트:

```bash
# 1️⃣ 개발 모드로 실행 (추천)
docker-compose up

# 2️⃣ 프로덕션 모드 빌드 및 실행
docker build -t daily-view .
docker run -p 3001:3001 daily-view

# 3️⃣ 컨테이너 내부 Shell 접근
docker-compose exec app sh
```

**접속:**
- 백엔드: http://localhost:3001
- 프론트엔드: http://localhost:5173

**Windows/Linux 환경 차이 제거:**
- ✅ donga.com RSS 문제를 로컬에서 재현 가능
- ✅ Railway 배포 전 정확한 테스트
- ✅ 환경 일관성 보장

## 환경 변수

`.env` (`.env.example` 참고):
- `ANTHROPIC_API_KEY` — 브리핑 생성(Claude Sonnet) 및 AI 인사이트(Claude Haiku)에 필수
- `SITE_PASSWORD` — 로그인 비밀번호 (기본값: `gamja!`)
- `PORT` — 서버 포트 (기본값: 3001)

## 아키텍처

### 이중 서버 구조

- **백엔드**: `server/index.js` — Express REST API + SSE, `data/` 디렉토리에 JSON 파일로 영속화
- **프론트엔드**: React SPA (`src/`) — Vite 개발 서버 또는 프로덕션에서 Express가 `dist/`를 정적 서빙
- 프로덕션에서는 Express 하나로 API + 정적 파일을 모두 처리. 개발에서는 Vite가 `/api` 요청을 Express로 프록시.

### 데이터 흐름

```
수집기(collectors/) → articleStore(data/articles/*.json)
                           ↓
                     report.js (유사기사 그룹핑·점수화)
                     insight.js (키워드 통계 + AI 분석)
                           ↓
                     generate.js (Claude Sonnet + web_search → briefing)
                     store.js (data/briefing-YYYY-MM-DD.json 캐시)
```

1. **수집**: `server/collectors/` — 각 언론사 RSS 파싱 → 본문 스크래핑 → `articleStore`에 날짜별 저장. 이미 수집된 URL은 `getArticleUrls()`로 Skip Set을 구성해 `fetchContent` 호출 자체를 건너뜀
2. **커스텀 소스**: `data/feeds.json`에 저장된 사용자 정의 RSS 소스. `feedStore.js`가 CRUD 관리, `collectors/custom.js`가 범용 수집. `/feeds` 메뉴에서 관리
3. **브리핑 생성**: `generate.js` — Claude Sonnet + `web_search` 도구로 직접 검색·요약. `data/briefing-YYYY-MM-DD.json`에 캐싱
4. **리포트**: `report.js` — Jaccard 유사도(임계값 0.35)로 기사 그룹핑 후 다차원 점수 계산 → TOP 10
5. **인사이트**: `insight.js` — 키워드 빈도·언론사 매트릭스·크로스소스 이슈(규칙 기반) + Claude Haiku AI 요약
6. **스케줄러**: `scheduler.js` — 매일 06:00 KST 브리핑 자동 생성 (`node-cron`)

### 프론트엔드 라우팅

`src/main.jsx`에서 React Router 설정. `AuthGuard`로 전체 앱 보호. 모든 스타일은 인라인 style 객체 (CSS 프레임워크 없음).

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/dashboard` | `Dashboard.jsx` | 수집 현황, 수동 수집(SSE), 브리핑 생성 |
| `/report` | `Report.jsx` | 날짜별 기사 리포트 (그룹핑된 TOP 10) |
| `/insight` | `Insight.jsx` | 키워드 통계, 언론사 매트릭스, AI 분석 |
| `/simple` | `SimpleDashboard.jsx` | A4 인쇄용 임원 브리핑 요약 |
| `/newspim` | `NewspimAnalysis.jsx` | 뉴스핌 vs 타 언론사 비교 분석 |
| `/feeds` | `FeedsManager.jsx` | 커스텀 RSS 소스 추가·편집·삭제 (각 피드마다 카테고리 매핑) |
| `/settings` | `Settings.jsx` | 대표 카테고리 관리, 수집/브리핑 시간 설정 |
| `/methodology` | `Methodology.jsx` | 분석 알고리즘 설명 (가중치·유사도·신뢰도) |
| `/accounts` | `AccountManager.jsx` | 계정 생성·편집·삭제 (admin 전용) |

### 수집기 구조 (모든 소스 커스텀화)

- **소스 저장소**: `data/feeds.json` — 버전 관리되는 초기 설정 (5개 언론사 + 확장 가능)
- **피드 구조**: 각 언론사(source)는 여러 RSS 링크(feeds)를 보유
  ```json
  {
    "id": "1", "key": "khan", "name": "경향신문",
    "feeds": [
      { "url": "https://...", "mainCategory": "정치" },
      { "url": "https://...", "mainCategory": "경제" }
    ]
  }
  ```
- **카테고리 매핑**: 각 피드마다 `mainCategory` 지정 → 수집 시 기사의 category로 사용
- **관리**: `/api/feeds` CRUD로 소스/피드 추가·편집·삭제
- 수집 함수: `collectCustomSource(sourceKey, skipUrls = new Set())` — 이미 수집된 URL Set을 받아 본문 스크래핑 자체를 건너뜀

### 핵심 알고리즘 (report.js)

**최종 점수 = (중요도 × 0.7) + (최신성 × 0.3)**

#### 1. 중요도 점수 (Importance)
```
= 라벨 점수 + 복수보도 점수 + 카테고리 기본 점수 + 본문 점수
```

| 항목 | 점수 | 설명 |
|------|------|------|
| **라벨 점수** | [단독]=+4<br/>[속보]=+2<br/>기타=0 | 제목의 `[단독]`, `[속보]` 태그 감지 |
| **복수보도 점수** | min(언론사수-1, 5) × 카테고리 계수 | 같은 이슈 보도 언론사 수 (카테고리별 가중치 적용) |
| **카테고리 기본** | 정치/경제/사회/북한: +2<br/>국제/산업/금융/증권: +1.5<br/>기타: +1 | 카테고리별 고정 점수 |
| **본문 점수** | 100자 이상: +1<br/>기타: 0 | 본문 충실도 평가 |

#### 2. 카테고리별 계수 (복수보도 점수 적용)

| 카테고리 | 계수 |
|----------|------|
| 정치, 경제, 사회, 북한 | 1.5 |
| 국제, 산업, 금융, 증권, 세계, 글로벌, 부동산 | 1.3 |
| 문화, 스포츠, 연예, 전국 | 1.0 |

#### 3. 최신성 점수 (Freshness)

| 시간 | 점수 |
|------|------|
| 0~6시간 | +2 |
| 6~12시간 | +1 |
| 12~24시간 | +0.5 |
| 24시간 초과 | 0 |

#### 예시 계산
정치 카테고리, [단독] 기사, 5개 언론사 보도, 3시간 전 발행, 본문 150자

```
중요도 = 4[라벨] + (4×1.5)[복수보도] + 2[카테고리] + 1[본문] = 17
최신성 = 2
최종 점수 = (17 × 0.7) + (2 × 0.3) = 11.9 + 0.6 = 12.5
```

**유사도**: Jaccard 계수 (공통 키워드 수 / 합집합 키워드 수) ≥ 0.35 이면 동일 이슈로 묶음

### 영속화

- `data/briefing-YYYY-MM-DD.json` — AI 브리핑 캐시
- `data/articles/{source}-{YYYY-MM-DD}.json` — 언론사별 수집 기사
- `data/feeds.json` — 초기 RSS 소스 설정 **(버전 관리됨)**
- `data/settings.json` — 대표 카테고리·수집·브리핑 시간 설정
- `data/accounts.json` — 계정 정보 (scrypt 해시)
- `data/collect-logs/` — SSE 수집 로그
- `.gitignore`: `data/`는 무시하되 `!data/feeds.json`으로 feeds.json만 추적

## 인증 · 권한 구조

### 역할(Role)별 접근 경로

| 비밀번호 | 역할 | 접근 가능 메뉴 |
|----------|------|---------------|
| `gamja!`  | basic   | 대시보드, 리포트, 인사이트, 심플대시보드, 분석방법 |
| `gamja1!` | analyst | basic + 뉴스핌분석 |
| `gamja2!` | admin   | analyst + 피드관리, 설정, 계정관리 |

- 기본 계정은 첫 서버 시작 시 `data/accounts.json`에 자동 생성됨
- 비밀번호는 `crypto.scrypt` 해시로 저장, 원문 복구 불가
- **계정 추가·수정·삭제**: `/accounts` 메뉴 (admin 전용)

### 서버 사이드 보안 계층

1. **`authGuard`** — 모든 `/api` 경로에 적용 (공개: `/api/auth/login`, `/api/status`)
2. **`requireRole('admin')`** — `/api/feeds`, `/api/accounts` 전용 미들웨어
3. **레이트 리밋** — IP당 10회 실패 시 15분 차단 (`server/authMiddleware.js`)
4. **SSRF 방어** — RSS 테스트 시 localhost·내부 IP 차단
5. **CORS** — 프로덕션에서 `ALLOWED_ORIGIN` 환경변수로 제한
6. **SSE 인증** — `EventSource`는 헤더 불가이므로 `?token=` 쿼리 파라미터로 검증

### 프론트엔드 인증 흐름

- `sessionStorage`에 `{ token, name, role, routes }` 저장
- `src/main.jsx`의 `window.fetch` 패치로 모든 `/api` 호출에 `Authorization: Bearer <token>` 자동 첨부
- `PermGuard` 컴포넌트가 허용되지 않은 경로 접근 시 `/dashboard`로 리다이렉트
- `src/navConfig.js`의 `getNav(role)`이 역할에 맞는 메뉴만 필터링

### 인증 관련 파일

| 파일 | 역할 |
|------|------|
| `server/accountStore.js` | 계정 CRUD + scrypt 해시 |
| `server/authMiddleware.js` | 세션 토큰(randomBytes) + 레이트 리밋 |
| `src/useAuth.js` | 토큰·역할 sessionStorage 관리 |
| `src/navConfig.js` | 역할별 메뉴 정의 |
| `src/Nav.jsx` | 공유 내비 컴포넌트 (로그아웃 포함) |
| `src/AccountManager.jsx` | 계정 관리 UI (admin 전용) |

## 배포

Railway 배포 (`railway.json`): `npm install && npm run build` → `npm start`
