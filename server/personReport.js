import { getArticles } from "./articleStore.js";

// 카테고리별 기본 점수 + 계수
const CAT_CONFIG = {
  정치: { baseScore: 2, coefficient: 1.5 },
  경제: { baseScore: 2, coefficient: 1.5 },
  사회: { baseScore: 2, coefficient: 1.5 },
  북한: { baseScore: 2, coefficient: 1.5 },
  국제: { baseScore: 1.5, coefficient: 1.3 },
  산업: { baseScore: 1.5, coefficient: 1.3 },
  마켓: { baseScore: 1.5, coefficient: 1.3 },
  "증권·금융": { baseScore: 1.5, coefficient: 1.3 },
  금융: { baseScore: 1.5, coefficient: 1.3 },
  세계: { baseScore: 1.5, coefficient: 1.3 },
  글로벌: { baseScore: 1.5, coefficient: 1.3 },
  문화: { baseScore: 1, coefficient: 1.0 },
  스포츠: { baseScore: 1, coefficient: 1.0 },
  연예: { baseScore: 1, coefficient: 1.0 },
  전국: { baseScore: 1, coefficient: 1.0 },
  부동산: { baseScore: 1.5, coefficient: 1.3 },
};

// 한국어 불용어
const STOPWORDS = new Set([
  "이","가","은","는","을","를","의","에","로","으로","와","과","도","만","에서",
  "부터","까지","에게","한","하는","하고","하여","하면","했","한다","된","되는",
  "있는","있다","없는","없다","위해","통해","대해","관련","대한","통한","따른",
  "및","또","그","이후","이전","당시","오는","지난","올해","내년","올","지","수",
  "것","등","들","더","이번","이날","오늘","어제","지금","다시","모든","각",
]);

function extractKeywords(title) {
  return title
    .replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, "")
    .split(/[\s,·…·\-\/]+/)
    .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

function getLabelScore(title) {
  if (title.includes("[단독]")) return 4;
  if (title.includes("[속보]")) return 2;
  return 0;
}

function scoreArticle(article, groupSize = 1) {
  const catConfig = CAT_CONFIG[article.category] || { baseScore: 1, coefficient: 1.0 };

  // 라벨 점수
  const labelScore = getLabelScore(article.title);

  // 복수보도 점수 = min(groupSize - 1, 5) × 카테고리 계수
  const multiMediaScore = Math.min(groupSize - 1, 5) * catConfig.coefficient;

  // 카테고리 기본 점수
  const categoryScore = catConfig.baseScore;

  // 본문 점수
  const contentScore = (article.content && article.content.length > 100) ? 1 : 0;

  // 중요도
  const importance = labelScore + multiMediaScore + categoryScore + contentScore;

  // 최신성
  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  let freshness = 0;
  if (ageHours <= 6) freshness = 2;
  else if (ageHours <= 12) freshness = 1;
  else if (ageHours <= 24) freshness = 0.5;
  else freshness = 0;

  // 최종 점수
  const finalScore = (importance * 0.7) + (freshness * 0.3);

  return {
    importance,
    freshness,
    finalScore,
    valueOf: () => finalScore
  };
}

export async function generatePersonReport(date, personKeywords) {
  const all = await getArticles(date);
  if (!all?.length) return null;

  // 인물 관련 기사 필터
  const filtered = all.filter(a => {
    const text = (a.title || "") + " " + (a.content || "") + " " + (a.summary || "");
    return personKeywords.some(kw => text.includes(kw));
  });

  if (!filtered.length) return null;

  // 기사 점수화
  const scored = filtered
    .map(a => {
      const scoreObj = scoreArticle(a, 1);
      return { ...a, scoreObj };
    })
    .sort((x, y) => y.scoreObj.finalScore - x.scoreObj.finalScore);

  // TOP 15 선정
  const top15 = scored.slice(0, 15).map(a => ({
    title: a.title,
    url: a.url,
    sourceName: a.sourceName,
    publishedAt: a.publishedAt,
    isBreaking: a.isBreaking,
    content: a.content ? a.content.slice(0, 200) : "",
    score: a.scoreObj.finalScore,
    importance: a.scoreObj.importance,
    freshness: a.scoreObj.freshness,
  }));

  // 관련 키워드 추출 (인물명 제외)
  const kwMap = {};
  filtered.forEach(a => {
    extractKeywords(a.title).forEach(w => {
      if (!personKeywords.includes(w)) {
        kwMap[w] = (kwMap[w] || 0) + 1;
      }
    });
  });

  const relatedKeywords = Object.entries(kwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  // 언론사별 집계
  const sourceMap = {};
  filtered.forEach(a => {
    sourceMap[a.sourceName] = (sourceMap[a.sourceName] || 0) + 1;
  });

  const sourceStats = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    date,
    generatedAt: new Date().toISOString(),
    totalArticles: filtered.length,
    top15,
    relatedKeywords,
    sourceStats,
  };
}
