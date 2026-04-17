import { getArticles } from "./articleStore.js";
import Anthropic from "@anthropic-ai/sdk";

const STOPWORDS = new Set([
  "이","가","은","는","을","를","의","에","로","으로","와","과","도","만","에서",
  "부터","까지","에게","한","하는","하고","하여","하면","했","한다","된","되는",
  "있는","있다","없는","없다","위해","통해","대해","관련","대한","통한","따른",
  "및","또","그","이후","이전","당시","오는","지난","올해","내년","올","지","수",
  "것","등","들","더","이번","이날","오늘","어제","지금","다시","모든","각","위","후",
  "전","안","밖","중","속","간","말","말이","말한","밝혀","밝혀","통해","따라",
  "대해","나서","나온","나와","나타","나온","해야","해서","하지","하기","하면서",
]);

function extractKeywords(title) {
  return title
    .replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, "")
    .split(/[\s,·…·\-\/]+/)
    .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

export async function generateInsight(date) {
  const articles = await getArticles(date);
  if (!articles || articles.length === 0) return null;

  // ── 기본 통계 ──────────────────────────────────────────
  const sourceSet = new Set(articles.map(a => a.source));
  const catSet = new Set(articles.map(a => a.category));
  const breakingCount = articles.filter(a => a.isBreaking).length;

  // ── 키워드 빈도 + 언론사 매핑 ─────────────────────────
  const kwData = {}; // { word: { count, sources: Set } }
  for (const a of articles) {
    const kws = extractKeywords(a.title);
    for (const w of kws) {
      if (!kwData[w]) kwData[w] = { count: 0, sources: new Set() };
      kwData[w].count++;
      kwData[w].sources.add(a.sourceName);
    }
  }
  const topKeywords = Object.entries(kwData)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([word, d]) => ({ word, count: d.count, sources: [...d.sources] }));

  // ── 언론사 × 카테고리 히트맵 ──────────────────────────
  const sourceMap = {}; // { sourceKey: { name, cats: { cat: count } } }
  for (const a of articles) {
    if (!sourceMap[a.source]) sourceMap[a.source] = { name: a.sourceName, cats: {} };
    sourceMap[a.source].cats[a.category] = (sourceMap[a.source].cats[a.category] || 0) + 1;
  }

  // 카테고리를 전체 기사 수 기준 내림차순
  const catTotals = {};
  for (const a of articles) catTotals[a.category] = (catTotals[a.category] || 0) + 1;
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 10);
  const sortedSources = Object.keys(sourceMap);

  const matrix = sortedSources.map(sk =>
    sortedCats.map(cat => sourceMap[sk].cats[cat] || 0)
  );

  const sourceCatMatrix = {
    sources: sortedSources.map(sk => sourceMap[sk].name),
    categories: sortedCats,
    matrix,
  };

  // ── 크로스소스 이슈 (3개 이상 언론사) ─────────────────
  const kwArticles = {}; // { word: [ article, ... ] }
  for (const a of articles) {
    for (const w of extractKeywords(a.title)) {
      if (!kwArticles[w]) kwArticles[w] = [];
      kwArticles[w].push(a);
    }
  }

  const crossSourceIssues = Object.entries(kwArticles)
    .map(([kw, arts]) => {
      const srcSet = new Set(arts.map(a => a.source));
      return { keyword: kw, sources: [...new Set(arts.map(a => a.sourceName))], articles: arts.map(a => a.title).slice(0, 5), count: arts.length, srcCount: srcSet.size };
    })
    .filter(d => d.srcCount >= 3)
    .sort((a, b) => b.srcCount - a.srcCount || b.count - a.count)
    .slice(0, 10);

  // ── 시간대별 발행 패턴 (KST) ──────────────────────────
  const hourBuckets = new Array(24).fill(0);
  for (const a of articles) {
    const kstHour = (new Date(a.publishedAt).getUTCHours() + 9) % 24;
    hourBuckets[kstHour]++;
  }
  const hourlyDist = hourBuckets.map((count, hour) => ({ hour, count }));

  // ── 언론사별 통계 ──────────────────────────────────────
  const sourceStats = Object.entries(sourceMap).map(([key, d]) => ({
    key,
    name: d.name,
    total: Object.values(d.cats).reduce((s, v) => s + v, 0),
    breaking: articles.filter(a => a.source === key && a.isBreaking).length,
    categories: d.cats,
  })).sort((a, b) => b.total - a.total);

  return {
    date,
    totalArticles: articles.length,
    totalSources: sourceSet.size,
    totalCategories: catSet.size,
    breakingCount,
    topKeywords,
    sourceCatMatrix,
    crossSourceIssues,
    hourlyDist,
    sourceStats,
  };
}

export async function generateAIInsight(articles, date) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic();
    const titles = articles
      .sort((a, b) => (b.isBreaking ? 1 : 0) - (a.isBreaking ? 1 : 0))
      .slice(0, 60)
      .map((a, i) => `${i + 1}. [${a.category}${a.isBreaking ? "/속보" : ""}] ${a.title}`)
      .join("\n");

    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `다음은 ${date} 주요 언론사들이 보도한 뉴스 기사 목록입니다.\n\n${titles}\n\n위 기사들을 바탕으로 아래 항목을 한국어로 분석해주세요 (총 400자 내외):\n1. 오늘 뉴스의 전반적인 흐름\n2. 정치/경제/사회 주요 이슈 각 1~2줄\n3. 여러 언론사가 집중 보도한 핵심 사안\n4. 주목할 만한 특이사항\n\n간결하고 명확하게 작성해주세요.`,
      }],
    });
    return msg.content[0]?.text || null;
  } catch (err) {
    console.error("[insight] AI 분석 오류:", err.message);
    return null;
  }
}
