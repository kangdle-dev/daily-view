# 코딩 컨벤션

## 기본 원칙

- **ES Module** (`import`/`export`) 전용, CommonJS 사용 금지
- **async/await** 전용, `.then()` 체인 사용 금지
- **인라인 스타일** 전용 (CSS 파일 없음, Tailwind 없음)
- 에러 메시지는 한국어로 작성

---

## 파일 구조

```
server/
  index.js              # Express 앱 진입점, 모든 API 라우트 등록
  scheduler.js          # node-cron 스케줄 작업 (수집·리포트·텔레그램)
  collectors/
    index.js            # 수집 오케스트레이터 (소스 목록 관리·실행)
    custom.js           # RSS 파싱 + 본문 스크래핑 범용 수집기
  *Store.js             # 데이터 영속화 레이어 (파일 또는 Redis)
  report.js             # 기사 그룹핑·점수화 알고리즘
  insight.js            # 키워드 통계·언론사 매트릭스·AI 요약
  generate.js           # Claude Sonnet + web_search 브리핑 생성
  telegramService.js    # Telegram Bot API 발송

src/
  main.jsx              # React 진입점, 라우터, 전역 fetch 인터셉터
  Nav.jsx               # 공통 내비게이션 (로그아웃 포함)
  navConfig.js          # 역할별 메뉴 정의
  useAuth.js            # 토큰·역할 sessionStorage 훅
  *.jsx                 # 페이지 컴포넌트 (파스칼케이스)
```

---

## 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 (서버) | camelCase | `articleStore.js` |
| 파일명 (프론트) | PascalCase | `NewspimAnalysis.jsx` |
| 변수·함수 | camelCase | `fetchGwangjaeReport` |
| 상수 | UPPER_SNAKE_CASE | `RATE_LIMIT`, `CAT_CONFIG` |
| React 컴포넌트 | PascalCase | `DraftModal`, `KpiCard` |
| API 경로 | kebab-case | `/api/newspim/suggestions` |
| Redis 키 | `namespace:identifier` | `feeds:all` |
| 날짜 파라미터 | `YYYY-MM-DD` | `date=2026-04-23` |

---

## 서버 파일 패턴

### Store 파일 (영속화 레이어)
```js
// 파일 상단: 경로 상수 정의
const FILE = path.join(__dirname, "..", "data", "*.json");

// 내부 헬퍼는 미노출 (readFile, writeFile)
async function readFile() { ... }
async function writeFile(data) { ... }

// 외부 노출 함수만 export
export async function getXxx() { ... }
export async function saveXxx(data) { ... }
```

### API 엔드포인트 패턴 (index.js)
```js
// ─── 섹션 제목 ────────────────────────────────────────────
app.get("/api/resource", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const result = await doSomething(date);
    if (!result) return res.status(404).json({ error: "데이터 없음" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 에러 처리 원칙
- Store 함수: 에러를 throw (호출자가 처리)
- API 핸들러: try/catch 후 `res.status(500).json({ error: err.message })`
- 스케줄러: try/catch 후 `console.error`만 (서버 중단 방지)

---

## 프론트엔드 패턴

### 색상 상수 (`C` 객체)
```js
const C = {
  bg:       "#F1F5F9",   // 페이지 배경
  surface:  "#FFFFFF",   // 카드 배경
  border:   "#E2E8F0",   // 테두리
  txt1:     "#0F172A",   // 주요 텍스트
  txt2:     "#475569",   // 보조 텍스트
  txt3:     "#94A3B8",   // 희미한 텍스트
  accent:   "#2563EB",   // 강조색 (파란색)
  breaking: "#DC2626",   // 속보·경고 (빨간색)
};
```
모든 스타일 값은 반드시 이 `C` 객체에서 참조.

### 상태 페칭 패턴
```js
const [data, setData]       = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError]     = useState("");

const fetchData = async (d = date) => {
  setLoading(true); setError(""); setData(null);
  try {
    const res = await fetch(`/api/resource?date=${d}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setData(json);
  } catch (e) { setError(e.message); }
  setLoading(false);
};
```

### 탭 구조 패턴
```jsx
const [activeTab, setActiveTab] = useState("tab1");
// 탭 버튼은 배열 map으로 렌더링
{[{ id: "tab1", label: "탭1" }, ...].map(tab => (
  <button key={tab.id} onClick={() => setActiveTab(tab.id)} ...>
    {tab.label}
  </button>
))}
// 탭 콘텐츠 분기
{activeTab === "tab1" && <Tab1Component />}
```

---

## 주석 규칙

- **함수 주석**: `/** 한 줄 설명 */` — 외부 노출 함수·복잡한 내부 함수에 추가
- **섹션 구분**: `// ─── 섹션명 ───────────────────────────────────────────` (index.js 전용)
- **인라인 주석**: WHY가 비자명한 경우에만 (`// TTL 0 = 영구 저장`)
- **금지**: 함수가 하는 일을 그대로 서술하는 주석, 다중 라인 주석 블록

---

## 환경 변수

| 변수 | 필수 | 용도 |
|------|------|------|
| `ANTHROPIC_API_KEY` | 브리핑/인사이트/초안 AI | 필수 |
| `TELEGRAM_BOT_TOKEN` | 텔레그램 발송 | 선택 |
| `TELEGRAM_CHANNEL_ID` | 텔레그램 발송 | 선택 |
| `REDIS_URL` | 피드 데이터 영속화 | 필수(배포) |
| `SITE_PASSWORD` | 레거시 로그인 | 미사용 |
| `PORT` | Express 포트 (기본 3001) | 선택 |
