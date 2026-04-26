/**
 * @file articleStore.js
 * 기사 영속화 레이어 — 날짜·소스별 JSON 파일로 저장
 * 저장 경로: data/articles/{source}-{YYYY-MM-DD}.json
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "..", "data", "articles");

async function ensureDir() {
  await fs.mkdir(ARTICLES_DIR, { recursive: true });
}

/**
 * 기사 저장 (중복 URL은 덮어쓰지 않고 스킵)
 * 파일명: data/articles/{source}-{date}.json
 */
/** 기사 배열을 파일에 병합 저장 — 중복 URL은 스킵 */
export async function saveArticles(source, date, articles) {
  await ensureDir();
  const file = path.join(ARTICLES_DIR, `${source}-${date}.json`);

  let existing = [];
  try {
    const raw = await fs.readFile(file, "utf-8");
    existing = JSON.parse(raw);
  } catch {}

  const existingUrls = new Set(existing.map((a) => a.url));
  const newArticles = articles.filter((a) => !existingUrls.has(a.url));
  const merged = [...existing, ...newArticles];

  await fs.writeFile(file, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`[articleStore] ${source}-${date}.json — 신규 ${newArticles.length}개 추가 (총 ${merged.length}개)`);
  return { total: merged.length, added: newArticles.length };
}

/**
 * 특정 날짜 기사 조회
 * @param {string} date  YYYY-MM-DD
 * @param {string|null} source  null이면 전체
 */
/** 날짜(+선택적 소스)로 기사 조회 — 소스 미지정 시 전체 합산, URL 중복 제거 */
export async function getArticles(date, source = null) {
  await ensureDir();
  let files;
  try {
    files = await fs.readdir(ARTICLES_DIR);
  } catch {
    return [];
  }

  const targets = files.filter((f) => {
    if (!f.endsWith(`-${date}.json`)) return false;
    if (source) return f.startsWith(`${source}-`);
    return true;
  });

  const all = [];
  const seenUrls = new Set();
  for (const f of targets) {
    try {
      const raw = await fs.readFile(path.join(ARTICLES_DIR, f), "utf-8");
      for (const a of JSON.parse(raw)) {
        if (a.url && seenUrls.has(a.url)) continue;
        if (a.url) seenUrls.add(a.url);
        all.push(a);
      }
    } catch {}
  }
  return all;
}

/**
 * 특정 날짜에 수집된 모든 기사 URL Set (중복 수집 스킵용)
 */
/** 날짜의 수집된 URL Set 반환 — 수집 시 중복 스킵용 */
export async function getArticleUrls(date) {
  const articles = await getArticles(date);
  return new Set(articles.map(a => a.url).filter(Boolean));
}

/**
 * 수집된 날짜 목록
 */
/** 수집된 날짜 목록 반환 (최신순) */
export async function listArticleDates() {
  await ensureDir();
  try {
    const files = await fs.readdir(ARTICLES_DIR);
    const dates = [
      ...new Set(
        files
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/^[^-]+-/, "").replace(".json", ""))
      ),
    ].sort().reverse();
    return dates;
  } catch {
    return [];
  }
}
