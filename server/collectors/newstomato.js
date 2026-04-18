import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { saveArticles } from "../articleStore.js";

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: "https://www.newstomato.com/rss/?cate=11", category: "정치" },
  { url: "https://www.newstomato.com/rss/?cate=30", category: "정책" },
  { url: "https://www.newstomato.com/rss/?cate=21", category: "공동체" },
  { url: "https://www.newstomato.com/rss/?cate=12", category: "증권" },
  { url: "https://www.newstomato.com/rss/?cate=13", category: "금융" },
  { url: "https://www.newstomato.com/rss/?cate=14", category: "산업" },
  { url: "https://www.newstomato.com/rss/?cate=16", category: "부동산" },
  { url: "https://www.newstomato.com/rss/?cate=29", category: "유통" },
  { url: "https://www.newstomato.com/rss/?cate=15", category: "테크" },
  { url: "https://www.newstomato.com/rss/?cate=22", category: "바이오" },
  { url: "https://www.newstomato.com/rss/?cate=17", category: "엔터" },
  { url: "https://www.newstomato.com/rss/?cate=33", category: "정책금융" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
  "Referer": "https://www.newstomato.com/",
};

function extractContent($) {
  const selectors = [
    ".article_txt",
    ".view_text",
    "#articleBody",
    ".article-body",
    ".news_content",
    "[class*='article']",
  ];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      el.find("script, style, .ad, .relate_news, figure, .reporter_info").remove();
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 50) return text;
    }
  }
  return "";
}

async function fetchContent(url) {
  try {
    const res = await axios.get(url, { timeout: 12000, headers: HEADERS });
    const $ = load(res.data);
    return extractContent($);
  } catch (err) {
    console.warn(`  [newstomato] 본문 실패: ${err.message.slice(0, 60)} — ${url}`);
    return "";
  }
}

function isRecent(item) {
  const pub = new Date(item.pubDate || item.isoDate || 0);
  return Date.now() - pub.getTime() <= 24 * 60 * 60 * 1000;
}

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export async function collectNewstomato(skipUrls = new Set()) {
  const date = todayKST();
  const articles = [];

  for (const feed of FEEDS) {
    console.log(`[newstomato] ${feed.category} RSS 파싱 중...`);
    try {
      const result = await parser.parseURL(feed.url);
      const recent = result.items.filter(isRecent);
      console.log(`  → ${recent.length}개 (24h 이내) / 전체 ${result.items.length}개`);

      for (const item of recent) {
        if (skipUrls.has(item.link || "")) {
          console.log(`  ↩ 중복 스킵: ${(item.title || "").slice(0, 40)}`);
          continue;
        }
        await new Promise((r) => setTimeout(r, 300));

        const isBreaking = /\[단독\]|\[속보\]/.test(item.title || "");
        const content = await fetchContent(item.link);

        articles.push({
          source: "newstomato",
          sourceName: "뉴스토마토",
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
      console.error(`[newstomato] ${feed.category} RSS 오류:`, err.message);
    }
  }

  const result = await saveArticles("newstomato", date, articles);
  console.log(`\n[newstomato] 수집 완료 — ${date} | 신규 ${result.added}개 / 총 ${result.total}개`);
  return result;
}
