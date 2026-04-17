import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { saveArticles } from "../articleStore.js";

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: "https://www.khan.co.kr/rss/rssdata/politic_news.xml", category: "정치" },
  { url: "https://www.khan.co.kr/rss/rssdata/economy_news.xml", category: "경제" },
  { url: "https://www.khan.co.kr/rss/rssdata/society_news.xml", category: "사회" },
  { url: "https://www.khan.co.kr/rss/rssdata/culture_news.xml", category: "문화" },
  { url: "https://www.khan.co.kr/rss/rssdata/kh_sports.xml",    category: "스포츠" },
  { url: "https://www.khan.co.kr/rss/rssdata/kh_world.xml",     category: "국제" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

/** 경향신문 기사 본문 추출 */
function extractContent($) {
  // 경향신문 본문 선택자 (우선순위 순)
  const selectors = [".art_body", "#articleBody", ".article_body", "[class*='art_body']"];

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      // 광고·관련기사·기자정보 제거
      el.find("script, style, .ad, .related_article, .reporter_area, figure, .img_desc").remove();
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 50) return text;
    }
  }
  return "";
}

/** 단일 기사 본문 수집 */
async function fetchContent(url) {
  try {
    const res = await axios.get(url, { timeout: 12000, headers: HEADERS });
    const $ = load(res.data);
    return extractContent($);
  } catch (err) {
    console.warn(`  [khan] 본문 실패: ${err.message} — ${url}`);
    return "";
  }
}

/** 24시간 이내 기사 여부 */
function isRecent(item) {
  const pub = new Date(item.pubDate || item.isoDate || 0);
  return Date.now() - pub.getTime() <= 24 * 60 * 60 * 1000;
}

/** 오늘 날짜 KST 기준 */
function todayKST() {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 경향신문 전체 수집
 * @returns {Promise<{total: number, added: number}>}
 */
export async function collectKhan() {
  const date = todayKST();
  const articles = [];

  for (const feed of FEEDS) {
    console.log(`[khan] ${feed.category} RSS 파싱 중...`);
    try {
      const result = await parser.parseURL(feed.url);
      const recent = result.items.filter(isRecent);
      console.log(`  → ${recent.length}개 (24h 이내) / 전체 ${result.items.length}개`);

      for (const item of recent) {
        await new Promise((r) => setTimeout(r, 400)); // 서버 부하 방지

        const isBreaking = /\[단독\]|\[속보\]/.test(item.title || "");
        const content = await fetchContent(item.link);

        articles.push({
          source: "khan",
          sourceName: "경향신문",
          category: feed.category,
          isBreaking,
          title: (item.title || "").trim(),
          url: item.link || "",
          publishedAt: new Date(item.pubDate || item.isoDate).toISOString(),
          summary: (item.contentSnippet || "").replace(/\s+/g, " ").trim(),
          content,
          collectedAt: new Date().toISOString(),
        });

        const flag = isBreaking ? " 🚨" : "";
        console.log(`  ✓ [${feed.category}]${flag} ${(item.title || "").slice(0, 40)}...`);
      }
    } catch (err) {
      console.error(`[khan] ${feed.category} RSS 오류:`, err.message);
    }
  }

  const result = await saveArticles("khan", date, articles);
  console.log(`\n[khan] 수집 완료 — ${date} | 신규 ${result.added}개 / 총 ${result.total}개`);
  return result;
}
