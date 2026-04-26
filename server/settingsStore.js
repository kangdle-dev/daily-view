import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

/**
 * @file settingsStore.js
 * 앱 설정 및 기사 작성 프롬프트 관리
 *   - 설정: data/settings.json (수집 시간, 브리핑 시간, 카테고리)
 *   - 프롬프트: data/article-prompts.json (카테고리별 AI 기사 초안 프롬프트)
 */

const DEFAULT_SETTINGS = {
  mainCategories: ["정치", "경제", "사회", "문화", "스포츠", "국제", "산업", "북한"],
  collectHour: 9,
  collectMinute: 0,
  collectEnabled: true,
  briefingHour: 6,
  briefingMinute: 0,
};

const PROMPTS_FILE = path.join(DATA_DIR, "article-prompts.json");

const DEFAULT_PROMPTS = {
  정치: `당신은 경제전문지 뉴스핌의 정치전문기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(핵심 사실 1~2문장) → 배경 → 주요 내용 → 전망/의미
- 정치권 동향이 경제·시장에 미치는 영향 각도 포함
- 객관적 사실 중심, 과도한 추측 금지
- 인용이 필요한 경우 "관계자에 따르면" 형식 사용`,

  경제: `당신은 경제전문지 뉴스핌의 경제전문기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(핵심 수치/사실) → 배경 및 원인 → 시장 반응 → 전망
- 구체적 수치, 기업명, 데이터 적극 활용
- 기관투자자·금융권 독자가 업무에 활용할 수 있는 각도
- 전문 용어 사용 가능하되 간결하게`,

  사회: `당신은 경제전문지 뉴스핌의 사회부기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(사건/현상 핵심) → 경위 → 반응/입장 → 향후 전망
- 사회 현상이 산업·경제에 미치는 영향 각도 포함
- 피해자·당사자 입장 균형 있게 반영`,

  국제: `당신은 경제전문지 뉴스핌의 국제부기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(국제 이슈 핵심) → 배경 → 각국 반응 → 국내 영향
- 글로벌 이슈가 한국 경제·기업에 미치는 영향 필수 포함
- 지역·국가별 맥락 간략히 설명`,

  산업: `당신은 경제전문지 뉴스핌의 산업부기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(산업 동향 핵심) → 기업별 현황 → 시장 변화 → 전망
- 기업·업종 실적, 경쟁 구도, 신기술 각도 중심
- 투자자가 관심 가질 만한 포인트 강조`,

  "증권·금융": `당신은 경제전문지 뉴스핌의 증권·금융전문기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(시장 핵심 움직임) → 배경 및 원인 → 종목·섹터 영향 → 투자 시사점
- 주가, 금리, 환율 등 구체적 수치 필수 포함
- 증권사 리포트·애널리스트 코멘트 인용 권장
- 개인투자자도 이해할 수 있는 설명 추가`,

  부동산: `당신은 경제전문지 뉴스핌의 부동산전문기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 600~900자
- 구조: 리드(부동산 시장 핵심) → 통계·수치 → 지역별 현황 → 정책/전망
- 매매가, 전세가, 거래량 등 구체적 데이터 활용
- 실수요자·투자자 모두를 고려한 각도`,

  문화: `당신은 경제전문지 뉴스핌의 문화부기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 500~800자
- 구조: 리드(문화 이슈 핵심) → 현황 → 업계 반응 → 산업적 의미
- 콘텐츠·엔터테인먼트 산업 경제적 가치 각도 포함
- 읽기 쉽고 생동감 있는 문체`,

  스포츠: `당신은 경제전문지 뉴스핌의 스포츠전문기자입니다.
아래 발제를 바탕으로 뉴스핌 스타일의 기사 초안을 작성해주세요.

작성 지침:
- 분량: 500~800자
- 구조: 리드(스포츠 이슈 핵심) → 경기/선수 현황 → 팬·업계 반응 → 전망
- 스포츠 산업·구단 경영 각도 가능하면 포함
- 생동감 있고 구체적인 묘사`,
};

function read() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function write(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

/** 앱 설정 조회 — 파일 없으면 기본값 반환 */
export async function getSettings() {
  return read();
}

/** 카테고리별 기사 작성 프롬프트 조회 — 파일 없으면 기본값 반환 */
export async function getArticlePrompts() {
  try {
    const raw = fs.readFileSync(PROMPTS_FILE, "utf8");
    return { ...DEFAULT_PROMPTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROMPTS };
  }
}

/** 카테고리별 프롬프트 저장 */
export async function saveArticlePrompts(prompts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
  return prompts;
}

/** 앱 설정 저장 — 유효성 검사 후 파일 쓰기 */
export async function saveSettings(data) {
  // Validate data
  if (!Array.isArray(data.mainCategories)) {
    throw new Error("mainCategories must be an array");
  }
  if (typeof data.collectHour !== "number" || data.collectHour < 0 || data.collectHour > 23) {
    throw new Error("collectHour must be 0-23");
  }
  if (typeof data.collectMinute !== "number" || data.collectMinute < 0 || data.collectMinute > 59) {
    throw new Error("collectMinute must be 0-59");
  }
  if (typeof data.briefingHour !== "number" || data.briefingHour < 0 || data.briefingHour > 23) {
    throw new Error("briefingHour must be 0-23");
  }
  if (typeof data.briefingMinute !== "number" || data.briefingMinute < 0 || data.briefingMinute > 59) {
    throw new Error("briefingMinute must be 0-59");
  }

  write(data);
  return data;
}
