import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { saveArticles } from "../articleStore.js";

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml",      category: "정치" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml",       category: "경제" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml",      category: "사회" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml", category: "국제" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/culture-life/?outputType=xml",  category: "문화" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/sports/?outputType=xml",        category: "스포츠" },
  { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/entertainments/?outputType=xml",category: "연예" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
  "Referer": "https://www.chosun.com/",
};

/** 조선일보 본문 추출 (Arc Publishing CMS) */
function extractContent($) {
  const selectors = [
    ".article-body",
    "[class*='article-body']",
    ".article_body",
    "#article-body",
    ".news-article-body",
    "[data-testid='article-body']",
  ];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      el.find("script, style, .ad, .related, figure, .caption, .reporter").remove();
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
    console.warn(`  [chosun] 본문 실패: ${err.message.slice(0, 60)} — ${url}`);
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

export async function collectChosun(skipUrls = new Set()) {
  const date = todayKST();
  const articles = [];

  for (const feed of FEEDS) {
    console.log(`[chosun] ${feed.category} RSS 파싱 중...`);
    try {
      const result = await parser.parseURL(feed.url);
      const recent = result.items.filter(isRecent);
      console.log(`  → ${recent.length}개 (24h 이내) / 전체 ${result.items.length}개`);

      for (const item of recent) {
        if (skipUrls.has(item.link || "")) {
          console.log(`  ↩ 중복 스킵: ${(item.title || "").slice(0, 40)}`);
          continue;
        }
        await new Promise((r) => setTimeout(r, 400));

        const isBreaking = /\[단독\]|\[속보\]/.test(item.title || "");
        const content = await fetchContent(item.link);

        articles.push({
          source: "chosun",
          sourceName: "조선일보",
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
      console.error(`[chosun] ${feed.category} RSS 오류:`, err.message);
    }
  }

  const result = await saveArticles("chosun", date, articles);
  console.log(`\n[chosun] 수집 완료 — ${date} | 신규 ${result.added}개 / 총 ${result.total}개`);
  return result;
}
