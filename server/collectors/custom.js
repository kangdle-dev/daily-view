/**
 * @file collectors/custom.js
 * 범용 RSS 수집기 — RSS 파싱 후 각 기사 URL에서 본문 스크래핑
 * skipUrls Set에 수집한 URL을 추가해 배치 내 중복 방지
 */
import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { saveArticles } from "../articleStore.js";
import { getCustomSources } from "../feedStore.js";

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36" }
});

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

function isRecent(item) {
  const pub = new Date(item.pubDate || item.isoDate || 0);
  return Date.now() - pub.getTime() <= 24 * 60 * 60 * 1000;
}

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** 기사 URL에서 본문 텍스트 추출 — 여러 CSS 셀렉터 순서대로 시도 */
async function fetchContent(url, sourceName) {
  try {
    const res = await axios.get(url, { timeout: 12000, headers: HEADERS });
    const $ = load(res.data);
    const selectors = [
      ".article-body", "#articleBody", ".news_body_area", ".article_body",
      ".view_text", ".article_txt", ".article", "[class*='article-body']",
      "[class*='article_body']", ".content-article", ".story-news",
    ];
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length) {
        el.find("script, style, .ad, figure, .reporter, .relate").remove();
        const text = el.text().replace(/\s+/g, " ").trim();
        if (text.length > 50) return text;
      }
    }
    return "";
  } catch (err) {
    console.warn(`  [${sourceName}] 본문 실패: ${err.message.slice(0, 60)}`);
    return "";
  }
}

/** 소스 키로 등록된 모든 RSS 피드 수집 — skipUrls에 없는 URL만 스크래핑 후 저장 */
export async function collectCustomSource(sourceKey, skipUrls = new Set()) {
  const sources = await getCustomSources();
  const source = sources.find(s => s.key === sourceKey);
  if (!source) throw new Error(`커스텀 소스 없음: ${sourceKey}`);

  const date = todayKST();
  const articles = [];

  for (const feed of source.feeds) {
    console.log(`[${source.key}] ${feed.category} RSS 파싱 중...`);
    try {
      const result = await parser.parseURL(feed.url);
      const recent = result.items.filter(isRecent);
      console.log(`  → ${recent.length}개 (24h 이내) / 전체 ${result.items.length}개`);

      for (const item of recent) {
        const url = item.link || "";
        if (skipUrls.has(url)) {
          console.log(`  ↩ 중복 스킵: ${(item.title || "").slice(0, 40)}`);
          continue;
        }
        skipUrls.add(url); // 배치 내 다른 카테고리 피드 중복 방지

        await new Promise(r => setTimeout(r, 350));

        const isBreaking = /\[단독\]|\[속보\]/.test(item.title || "");
        const content = await fetchContent(url, source.name);

        articles.push({
          source: source.key,
          sourceName: source.name,
          category: feed.mainCategory || feed.category,
          isBreaking,
          title: (item.title || "").trim(),
          url,
          publishedAt: new Date(item.pubDate || item.isoDate || Date.now()).toISOString(),
          summary: (item.contentSnippet || "").replace(/\s+/g, " ").trim(),
          content,
          collectedAt: new Date().toISOString(),
        });

        const flag = isBreaking ? " 🚨" : "";
        console.log(`  ✓ [${feed.category}]${flag} ${(item.title || "").slice(0, 40)}...`);
      }
    } catch (err) {
      console.error(`[${source.key}] ${feed.category} RSS 오류:`, err.message);
    }
  }

  const result = await saveArticles(source.key, date, articles);
  console.log(`\n[${source.key}] 수집 완료 — ${date} | 신규 ${result.added}개 / 총 ${result.total}개`);
  return result;
}
