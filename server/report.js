import { getArticles } from "./articleStore.js";

// 카테고리 중요도 가중치
const CAT_WEIGHT = {
  정치: 2, 경제: 2, 사회: 2, 국제: 1.5, 세계: 1.5, 글로벌: 1.5,
  북한: 2, 산업: 1.5, 마켓: 1.5, "증권·금융": 1.5,
  문화: 1, 스포츠: 1, 연예: 1, 전국: 1,
};

// 한국어 불용어 (조사·접속사·일반 동사)
const STOPWORDS = new Set([
  "이","가","은","는","을","를","의","에","로","으로","와","과","도","만","에서",
  "부터","까지","에게","한","하는","하고","하여","하면","했","한다","된","되는",
  "있는","있다","없는","없다","위해","통해","대해","관련","대한","통한","따른",
  "및","또","그","이후","이전","당시","오는","지난","올해","내년","올","지","수",
  "것","등","들","더","이번","이날","오늘","어제","지금","다시","모든","각",
]);

/** 제목에서 의미 키워드 추출 */
function extractKeywords(title) {
  return title
    .replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, "") // 태그 제거
    .split(/[\s,·…·\-\/]+/)
    .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

/** 두 기사의 제목 유사도 (공통 키워드 비율) */
function similarity(kw1, kw2) {
  const set1 = new Set(kw1);
  const set2 = new Set(kw2);
  const intersection = [...set1].filter(k => set2.has(k));
  const union = new Set([...set1, ...set2]);
  return intersection.length / Math.max(union.size, 1);
}

/** 기사 점수 계산 */
function scoreArticle(article, groupSize = 1) {
  let score = 0;

  // 단독·속보 가중치
  if (article.isBreaking) score += 5;

  // 복수 언론사 보도 가중치 (그룹 크기)
  score += Math.min(groupSize - 1, 5);

  // 최신성 가중치
  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  if (ageHours <= 6)  score += 2;
  else if (ageHours <= 12) score += 1;

  // 카테고리 중요도
  score += CAT_WEIGHT[article.category] || 1;

  // 본문 있으면 +1
  if (article.content && article.content.length > 100) score += 1;

  return score;
}

/** 기사 목록을 유사 그룹으로 묶기 */
function groupArticles(articles) {
  const kwCache = new Map();
  const getKw = (a) => {
    if (!kwCache.has(a.url)) kwCache.set(a.url, extractKeywords(a.title));
    return kwCache.get(a.url);
  };

  const groups = [];
  const used = new Set();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;
    const group = [articles[i]];
    used.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;
      const sim = similarity(getKw(articles[i]), getKw(articles[j]));
      if (sim >= 0.35) {
        group.push(articles[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

/** 그룹에서 대표 기사 선정 (가장 점수 높은 것) */
function pickRepresentative(group) {
  return group.reduce((best, cur) =>
    scoreArticle(cur, group.length) > scoreArticle(best, group.length) ? cur : best
  );
}

/** 최종 리포트 생성 */
export async function generateReport(date) {
  const articles = await getArticles(date);
  if (articles.length === 0) return null;

  // ── 전체 그룹핑 ────────────────────────────────────────
  const allGroups = groupArticles(articles);

  // 각 그룹 → 대표기사 + 점수 + 출처 목록
  const scored = allGroups.map(group => {
    const rep = pickRepresentative(group);
    const score = scoreArticle(rep, group.length);
    const sources = [...new Set(group.map(a => a.sourceName))];
    return { rep, score, sources, groupSize: group.length, group };
  });

  // ── 종합 TOP 10 ────────────────────────────────────────
  const top10 = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ rep, score, sources, groupSize }) => ({
      title:       rep.title,
      url:         rep.url,
      category:    rep.category,
      sourceName:  rep.sourceName,
      sources,
      publishedAt: rep.publishedAt,
      isBreaking:  rep.isBreaking,
      summary:     rep.summary || "",
      content:     rep.content ? rep.content.slice(0, 300) : "",
      score,
      groupSize,
    }));

  // ── 카테고리별 TOP 10 ──────────────────────────────────
  // 주요 카테고리 (기사 10개 이상인 것만)
  const catMap = {};
  for (const a of articles) {
    if (!catMap[a.category]) catMap[a.category] = [];
    catMap[a.category].push(a);
  }

  const catReports = {};
  for (const [cat, catArticles] of Object.entries(catMap)) {
    if (catArticles.length < 5) continue; // 너무 적은 카테고리 스킵

    const catGroups = groupArticles(catArticles);
    const catScored = catGroups.map(group => {
      const rep = pickRepresentative(group);
      const score = scoreArticle(rep, group.length);
      const sources = [...new Set(group.map(a => a.sourceName))];
      return { rep, score, sources, groupSize: group.length };
    });

    catReports[cat] = catScored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ rep, score, sources, groupSize }) => ({
        title:       rep.title,
        url:         rep.url,
        sourceName:  rep.sourceName,
        sources,
        publishedAt: rep.publishedAt,
        isBreaking:  rep.isBreaking,
        summary:     rep.summary || "",
        content:     rep.content ? rep.content.slice(0, 300) : "",
        score,
        groupSize,
      }));
  }

  return {
    date,
    generatedAt: new Date().toISOString(),
    totalArticles: articles.length,
    totalGroups: allGroups.length,
    breakingCount: articles.filter(a => a.isBreaking).length,
    sourceStats: Object.entries(
      articles.reduce((acc, a) => { acc[a.sourceName] = (acc[a.sourceName] || 0) + 1; return acc; }, {})
    ).map(([name, count]) => ({ name, count })),
    top10,
    categories: catReports,
  };
}
