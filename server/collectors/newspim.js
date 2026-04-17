import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { saveArticles } from "../articleStore.js";

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: "http://rss.newspim.com/news/category/101", category: "정치" },
  { url: "http://rss.newspim.com/news/category/103", category: "경제" },
  { url: "http://rss.newspim.com/news/category/102", category: "사회" },
  { url: "http://rss.newspim.com/news/category/107", category: "글로벌" },
  { url: "http://rss.newspim.com/news/category/120", category: "중국" },
  { url: "http://rss.newspim.com/news/category/106", category: "산업" },
  { url: "http://rss.newspim.com/news/category/105", category: "증권·금융" },
  { url: "http://rss.newspim.com/news/category/104", category: "부동산" },
  { url: "http://rss.newspim.com/news/category/108", category: "전국" },
  { url: "http://rss.newspim.com/news/category/112", category: "라이프·여행" },
  { url: "http://rss.newspim.com/news/category/110", category: "문화·연예" },
  { url: "http://rss.newspim.com/news/category/111", category: "스포츠" },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
  "Referer": "https://www.newspim.com/",
};

function extractContent($) {
  const selectors = [
    ".view-article",
    ".article-body",
    "#articleBody",
    ".news_body_area",
    "[class*='article']",
  ];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      el.find("script, style, .ad, figure, .reporter").remove();
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
    console.warn(`  [newspim] 본문 실패: ${err.message.slice(0, 60)} — ${url}`);
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

export async function collectNewspim() {
  const date = todayKST();
  const articles = [];

  for (const feed of FEEDS) {
    console.log(`[newspim] ${feed.category} RSS 파싱 중...`);
    try {
      const result = await parser.parseURL(feed.url);
      const recent = result.items.filter(isRecent);
      console.log(`  → ${recent.length}개 (24h 이내) / 전체 ${result.items.length}개`);

      for (const item of recent) {
        await new Promise((r) => setTimeout(r, 300));

        const isBreaking = /\[단독\]|\[속보\]/.test(item.title || "");
        const content = await fetchContent(item.link);

        articles.push({
          source: "newspim",
          sourceName: "뉴스핌",
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
      console.error(`[newspim] ${feed.category} RSS 오류:`, err.message);
    }
  }

  const result = await saveArticles("newspim", date, articles);
  console.log(`\n[newspim] 수집 완료 — ${date} | 신규 ${result.added}개 / 총 ${result.total}개`);
  return result;
}
