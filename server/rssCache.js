/**
 * @file rssCache.js
 * 실시간 기사 전용 경량 RSS 수집 — 제목·링크만, 본문 스크래핑 없음
 * 결과를 서버 메모리에 5분간 캐시
 */
import Parser from "rss-parser";
import { getCustomSources } from "./feedStore.js";

const CACHE_TTL = 5 * 60 * 1000; // 5분

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; DailyView/1.0)" },
});

let cache = null;      // { data, fetchedAt }
let fetching = false;  // 동시 중복 요청 방지

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function isRecent(item) {
  const pub = new Date(item.pubDate || item.isoDate || 0);
  return Date.now() - pub.getTime() <= 24 * 60 * 60 * 1000;
}

/** 단일 RSS 피드 파싱 → 기사 배열 반환 (실패 시 빈 배열) */
async function parseFeed(feedUrl, source, mainCategory) {
  try {
    const result = await parser.parseURL(feedUrl);
    return result.items
      .filter(isRecent)
      .map(item => ({
        source:      source.key,
        sourceName:  source.name,
        category:    mainCategory,
        title:       (item.title || "").trim(),
        url:         item.link || item.guid || "",
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      }))
      .filter(a => a.title && a.url);
  } catch {
    return [];
  }
}

/** 모든 소스의 RSS를 병렬 파싱 → 소스별 그룹핑된 데이터 반환 */
async function fetchAll() {
  const sources = await getCustomSources();

  // 전체 피드 목록 평탄화
  const tasks = sources.flatMap(src =>
    src.feeds.map(feed => parseFeed(feed.url, src, feed.mainCategory))
  );

  // 병렬 실행 (실패한 피드는 빈 배열로 처리)
  const results = await Promise.allSettled(tasks);
  const allArticles = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  // 소스별 그룹핑 + URL 중복 제거
  const sourceMap = {};
  const seenUrls  = new Set();

  for (const a of allArticles) {
    if (!a.url || seenUrls.has(a.url)) continue;
    seenUrls.add(a.url);

    if (!sourceMap[a.source]) {
      sourceMap[a.source] = { key: a.source, name: a.sourceName, articles: [] };
    }
    sourceMap[a.source].articles.push(a);
  }

  // 각 소스 내 최신순 정렬 → 소스 카드도 최근 기사 순으로 정렬
  return Object.values(sourceMap)
    .map(s => ({
      ...s,
      articles: s.articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    }))
    .sort((a, b) => new Date(b.articles[0]?.publishedAt || 0) - new Date(a.articles[0]?.publishedAt || 0));
}

/**
 * 캐시된 RSS 데이터 반환
 * - 캐시 유효(5분 이내): 즉시 반환
 * - 캐시 만료 or 없음: RSS 병렬 파싱 후 갱신
 * - 동시 요청 시 이전 캐시 반환(fetching 중이면 대기하지 않음)
 */
export async function getRSSPreview() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return { sources: cache.data, fetchedAt: cache.fetchedAt, cached: true };
  }

  if (fetching && cache) {
    return { sources: cache.data, fetchedAt: cache.fetchedAt, cached: true };
  }

  fetching = true;
  try {
    const data = await fetchAll();
    cache = { data, fetchedAt: Date.now() };
    return { sources: data, fetchedAt: cache.fetchedAt, cached: false };
  } finally {
    fetching = false;
  }
}

/** 캐시 강제 초기화 (수동 새로고침용) */
export function invalidateRSSCache() {
  cache = null;
}
