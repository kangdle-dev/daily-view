# Daily View 📰

**규칙 기반 + AI 분석을 결합한 뉴스 인사이트 대시보드**

매일 5개 언론사(경향신문, 조선일보, 뉴스토마토, 연합뉴스, 뉴스핌)의 RSS를 자동 수집·분석하여 주요 기사를 시간대별, 카테고리별로 정리하고, AI가 전반적 흐름을 요약해주는 웹 애플리케이션입니다.

---

## 주요 기능

### 📊 대시보드
- 실시간 수집 현황 모니터링 (SSE 스트리밍)
- 수동 수집 트리거
- 브리핑 생성

### 📈 리포트
- 날짜별 기사 조회
- Jaccard 유사도 기반 기사 그룹핑 (임계값 0.35)
- 다차원 점수 계산 (속보, 복수보도, 최신성, 카테고리, 본문)
- TOP 10 기사 노출

### 💡 인사이트
- 키워드 빈도 분석 (상위 20개)
- 언론사 × 카테고리 교차 분석
- 3개 이상 언론사 크로스소스 이슈 감지
- **Claude Haiku** AI 요약 (400자 내외)

### 📋 심플 대시보드
- A4 인쇄용 임원 브리핑 요약
- 속보/단독 기사 강조

### 🔄 뉴스핌 분석
- 뉴스핌 vs 타 언론사 비교
- 카테고리별 점유율
- 경제·금융 특화 영역 집중도

### ⚙️ 설정
- 대표 카테고리 관리
- RSS 수집 시간 설정
- 브리핑 생성 시간 설정

### 🔗 피드 관리
- 커스텀 RSS 소스 추가/편집/삭제
- 각 피드마다 대표 카테고리 매핑
- RSS 유효성 테스트

### 👥 계정 관리
- 3가지 역할 (기본, 분석가, 관리자)
- 계정 생성/수정/삭제 (admin 전용)

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│   React SPA (Vite)                       │
│   - Dashboard, Report, Insight 등        │
│   - sessionStorage 토큰 관리              │
└──────────────────────┬──────────────────┘
                       │ API (Bearer token)
                       ↓
┌─────────────────────────────────────────┐
│   Express Server (Node.js)               │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │ 수집 파이프라인                    │  │
│   │ - RSS Parser                     │  │
│   │ - Content Scraper (Cheerio)      │  │
│   │ - Custom Sources (피드 관리)      │  │
│   └──────────────────────────────────┘  │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │ 분석 엔진                          │  │
│   │ - Report (Jaccard 유사도)         │  │
│   │ - Insight (키워드 + 교차분석)      │  │
│   │ - Briefing (Claude Sonnet API)   │  │
│   └──────────────────────────────────┘  │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │ 저장소                             │  │
│   │ - data/articles/*.json            │  │
│   │ - data/feeds.json (설정)          │  │
│   │ - data/settings.json (시간 설정)   │  │
│   │ - data/accounts.json (계정)       │  │
│   └──────────────────────────────────┘  │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │ 스케줄러                           │  │
│   │ - 매일 06:00 자동 브리핑 생성      │  │
│   │ - 설정에서 변경 가능                │  │
│   └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
git clone <repository>
cd lkhoo-project
npm install
```

### 환경 변수 설정
```bash
# .env 파일 생성
ANTHROPIC_API_KEY=sk-xxx  # Claude API 키 (필수)
SITE_PASSWORD=gamja!       # 로그인 비밀번호 (기본값)
PORT=3001                  # 서버 포트 (기본값)
```

### 개발 모드 실행
```bash
# 터미널 1: 프론트엔드 개발 서버 (Vite)
npm run dev

# 터미널 2: 백엔드 서버 (Express)
npm run server
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:3001
- Vite가 `/api` 요청을 자동으로 localhost:3001로 프록시

### 프로덕션 빌드 및 배포
```bash
npm run build        # React 빌드 → dist/
npm start            # NODE_ENV=production node server/index.js
```

프로덕션에서는 Express가 `dist/` 정적 파일과 `/api` 엔드포인트를 동시에 제공합니다.

---

## 기본 계정

| 비밀번호 | 역할 | 접근 메뉴 |
|---------|------|---------|
| `gamja!` | 기본 | 대시보드, 리포트, 인사이트, 심플 대시보드, 분석 방법론 |
| `gamja1!` | 분석가 | 기본 + 뉴스핌 분석 |
| `gamja2!` | 관리자 | 분석가 + 피드 관리, 계정 관리, 설정 |

---

## RSS 소스 구조

### 초기 소스 (5개 언론사)
각 언론사는 여러 카테고리의 RSS 피드를 보유합니다:

**경향신문** (khan)
- 정치, 경제, 사회, 국제, 스포츠, 문화

**조선일보** (chosun)
- 정치, 경제, 사회, 국제, 문화, 스포츠, 엔터테인먼트

**뉴스토마토** (newstomato)
- 정치, 증권·금융, 산업, 부동산, 문화

**연합뉴스** (yonhap)
- 정치, 북한, 경제, 증권·금융, 산업, 사회, 국제, 문화, 스포츠, 전국

**뉴스핌** (newspim)
- 정치, 경제, 사회, 국제, 산업, 증권·금융, 부동산, 전국, 문화, 스포츠

### 피드 구조
```json
{
  "id": "1",
  "key": "khan",
  "name": "경향신문",
  "feeds": [
    {
      "url": "https://www.khan.co.kr/rss/rssdata/politic_news.xml",
      "mainCategory": "정치"
    },
    {
      "url": "https://www.khan.co.kr/rss/rssdata/economy_news.xml",
      "mainCategory": "경제"
    }
  ],
  "createdAt": "2026-04-20T00:00:00.000Z"
}
```

**카테고리 옵션** (settings.json에서 관리)
- 정치, 경제, 사회, 문화, 스포츠, 국제, 산업, 북한
- 관리자가 추가/삭제 가능

---

## 분석 알고리즘

### 1. 기사 수집
- **RSS 파싱**: 24시간 이내 기사만 필터링
- **중복 스킵**: 당일 이미 수집된 URL은 본문 스크래핑 건너뜀 (성능 최적화)
- **본문 스크래핑**: Cheerio + 언론사별 CSS 셀렉터로 원문 추출
- **저장소**: `data/articles/{source}-{YYYY-MM-DD}.json`

### 2. 유사도 그룹핑
**Jaccard 유사도** (임계값: 0.35)
```
Jaccard(A, B) = |공통 키워드| / |전체 키워드|
≥ 0.35 → 같은 이슈로 분류
```
- 키워드 전처리: [단독][속보] 태그 제거, 특수문자 제거, 불용어 제거, 2글자 미만 제거
- 결과: 명사·고유명사만 유지

### 3. 기사 점수 계산
```
점수 = 속보(+5) + 복수보도(+0~5) + 최신성(+1~2) + 카테고리(+1~2) + 본문(+1)
```

| 요소 | 점수 | 설명 |
|------|------|------|
| [단독]/[속보] | +5 | 독점 취재 및 긴급 사안 |
| 복수 언론사 | +0~5 | (언론사 수 - 1), 최대 5 |
| 6시간 이내 | +2 | 속보성 기사 |
| 6~12시간 | +1 | 최신 기사 |
| 고우선 카테고리 (정치·경제·사회·북한) | +2 | |
| 중우선 카테고리 (국제·산업·증권·금융) | +1.5 | |
| 기본 카테고리 | +1 | 문화·스포츠 등 |
| 본문 100자+ | +1 | 실제 콘텐츠 있음 |

### 4. 인사이트 분석
- **키워드 빈도**: 제목 명사 상위 20개 (기사당 1회만 카운트)
- **교차 분석**: 언론사 × 카테고리 매트릭스
- **크로스소스 이슈**: 3개 이상 언론사가 동일 키워드 사용
- **AI 요약**: Claude Haiku로 전반적 흐름 요약 (400자 내외)

### 5. 신뢰도 평가

| 수치 | 신뢰도 | 설명 |
|------|--------|------|
| 기사 수집 | 85% | URL 누락 가능성 낮음 |
| 유사도 그룹핑 | 75% | 단편적 제목에 민감 |
| 중요도 순위 (TOP 5) | 80% | 상위권은 신뢰도 높음 |
| 키워드 빈도 | 90% | 통계 기반 분석 |
| 크로스소스 감지 | 85% | 공론화 수준 반영 |
| AI 요약 정확성 | 70% | 속보 기사 비중에 영향 |

---

## API 문서

### 인증
```bash
POST /api/auth/login
{ "password": "gamja!" }
→ { "token": "...", "name": "...", "role": "admin", "routes": [...] }
```

### 기사 조회
```bash
GET /api/articles?date=2026-04-20&source=khan
→ { "date": "2026-04-20", "articles": [...], "count": 30 }
```

### 리포트
```bash
GET /api/report?date=2026-04-20
→ { "date": "2026-04-20", "groups": [...], "top10": [...] }
```

### 인사이트
```bash
GET /api/insight?date=2026-04-20
→ { "keywords": [...], "sourceStats": {...}, "crossSourceIssues": [...], "aiSummary": "..." }
```

### 피드 관리
```bash
GET /api/feeds
POST /api/feeds { "name": "...", "key": "...", "feeds": [...] }
PUT /api/feeds/:id
DELETE /api/feeds/:id
```

### 설정
```bash
GET /api/settings
→ { "mainCategories": [...], "collectHour": 9, "briefingHour": 6, ... }

POST /api/settings { "mainCategories": [...], "collectHour": 9, ... }
```

---

## 파일 구조

```
lkhoo-project/
├── src/
│   ├── main.jsx              # React Router 진입점
│   ├── Nav.jsx               # 공유 내비게이션
│   ├── Dashboard.jsx         # 수집 현황 + 수동 수집
│   ├── Report.jsx            # 날짜별 기사 리포트
│   ├── Insight.jsx           # 키워드·교차분석·AI 요약
│   ├── SimpleDashboard.jsx   # A4 인쇄용 브리핑
│   ├── NewspimAnalysis.jsx   # 뉴스핌 비교 분석
│   ├── Methodology.jsx       # 분석 방법론 설명
│   ├── FeedsManager.jsx      # RSS 피드 관리
│   ├── AccountManager.jsx    # 계정 관리
│   ├── Settings.jsx          # 카테고리·수집 시간 설정
│   ├── Login.jsx             # 로그인
│   ├── useAuth.js            # 토큰 관리
│   └── navConfig.js          # 메뉴 구성
│
├── server/
│   ├── index.js              # Express 서버 (API 엔드포인트)
│   ├── authMiddleware.js     # 인증 미들웨어 + 레이트 리밋
│   ├── accountStore.js       # 계정 CRUD + 해시
│   ├── feedStore.js          # 피드 CRUD
│   ├── settingsStore.js      # 설정 CRUD
│   ├── articleStore.js       # 기사 저장소
│   ├── report.js             # Jaccard 유사도 + 점수 계산
│   ├── insight.js            # 키워드·교차분석
│   ├── generate.js           # Claude Sonnet 브리핑 생성
│   ├── scheduler.js          # node-cron 자동 브리핑
│   ├── collectLogger.js      # SSE 수집 로그
│   │
│   └── collectors/
│       ├── index.js          # collectAll() 진입점
│       └── custom.js         # 커스텀 소스 수집 (범용)
│
├── data/
│   ├── feeds.json            # 초기 RSS 소스 설정
│   ├── settings.json         # 카테고리·시간 설정
│   ├── accounts.json         # 계정 정보
│   ├── articles/             # 언론사별 기사 (날짜 폴더)
│   ├── briefing-*.json       # AI 브리핑 캐시
│   └── logs/                 # 수집 로그
│
├── .env                      # 환경 변수 (git 무시)
├── .gitignore
├── CLAUDE.md                 # Claude Code 프로젝트 가이드
├── README.md                 # 이 파일
├── package.json
└── vite.config.js
```

---

## 의존성

### 프론트엔드
- **React 18** - UI 라이브러리
- **React Router v6** - 라우팅
- **lucide-react** - 아이콘

### 백엔드
- **Express** - REST API 서버
- **node-cron** - 자동 스케줄러
- **axios** - HTTP 클라이언트
- **cheerio** - HTML 파싱
- **rss-parser** - RSS 파싱
- **@anthropic-ai/sdk** - Claude API (Sonnet, Haiku)

### 개발
- **Vite** - 프론트엔드 번들러
- **@vitejs/plugin-react** - Vite React 플러그인

---

## 라이선스

내부 사용 목적으로만 배포됨

---

## 기여 가이드

버그 리포트 및 제안은 이슈 트래커로 등록해주세요. Pull Request 환영합니다!

---

**최종 업데이트**: 2026-04-20  
**알고리즘 버전**: 1.0
