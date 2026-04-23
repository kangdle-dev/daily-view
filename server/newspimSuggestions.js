import Anthropic from "@anthropic-ai/sdk";
import { getArticles } from "./articleStore.js";

const NEWSPIM_KEY = "newspim";

/**
 * 뉴스핌 기사 제안 생성
 * - 뉴스핌이 다루지 못했거나 부족한 카테고리를 분석
 * - Claude Haiku로 카테고리별 기사 제목 10개씩 생성
 */
export async function generateNewspimSuggestions(date) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const articles = await getArticles(date);
  if (!articles?.length) return null;

  // 뉴스핌 기사와 타사 기사 분리
  const npArticles = articles.filter(a => a.source === NEWSPIM_KEY);
  const otherArticles = articles.filter(a => a.source !== NEWSPIM_KEY);

  if (!otherArticles.length) return null;

  // 카테고리별 타사 기사 집계
  const catMap = {};
  for (const a of otherArticles) {
    const cat = a.category || "기타";
    if (!catMap[cat]) catMap[cat] = { all: [], missed: [] };
    catMap[cat].all.push(a);
    // 뉴스핌이 다루지 않은 기사 (완전히 같은 제목이 없는 것)
    const covered = npArticles.some(np => {
      const simWords = np.title.split(/\s+/).filter(w => w.length >= 2);
      return simWords.some(w => a.title.includes(w) && w.length >= 3);
    });
    if (!covered) catMap[cat].missed.push(a);
  }

  // 뉴스핌 카테고리별 기사 수
  const npCatMap = {};
  for (const a of npArticles) {
    const cat = a.category || "기타";
    npCatMap[cat] = (npCatMap[cat] || 0) + 1;
  }

  // 분석할 카테고리 선정 (전체 5건 이상, 뉴스핌 점유 30% 이하 or 미보도)
  const targetCats = Object.entries(catMap)
    .filter(([, d]) => d.all.length >= 3)
    .map(([cat, d]) => {
      const npCnt = npCatMap[cat] || 0;
      const share = Math.round(npCnt / d.all.length * 100);
      const missedCount = d.missed.length;
      return { cat, total: d.all.length, npCnt, share, missed: d.missed, missedCount };
    })
    .sort((a, b) => {
      // 미보도/점유 낮은 순으로 우선순위
      const scoreA = (100 - a.share) + a.missedCount;
      const scoreB = (100 - b.share) + b.missedCount;
      return scoreB - scoreA;
    })
    .slice(0, 8); // 최대 8개 카테고리

  if (!targetCats.length) return null;

  // 카테고리별 참고 기사 준비 (최대 10개)
  const catContext = targetCats.map(c => {
    const sampleArticles = c.missed.slice(0, 10).map(a => `  - ${a.title} (${a.sourceName})`).join("\n");
    return `[${c.cat}] (전체 ${c.total}건 중 뉴스핌 ${c.npCnt}건, 점유 ${c.share}%)\n${sampleArticles || "  - (참고 기사 없음)"}`;
  }).join("\n\n");

  // Claude Haiku로 기사 제목 생성
  const client = new Anthropic();

  const prompt = `당신은 경제전문지 뉴스핌의 데스크입니다.
${date} 기준 다른 언론사들이 보도했지만 뉴스핌이 다루지 않았거나 부족하게 다룬 분야의 기사 현황입니다.

${catContext}

위 분석을 바탕으로 뉴스핌이 작성해야 할 기사 제목을 카테고리별로 10개씩 제안해주세요.
- 뉴스핌의 전문성(경제·금융·산업·부동산)을 살린 각도로 제안
- 독자적인 시각이나 심층 분석 각도 포함
- 실제로 기자가 취재할 수 있는 현실적인 제목
- [단독] [분석] [인터뷰] 등 태그 활용 가능

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "categories": [
    {
      "category": "카테고리명",
      "articles": ["제목1", "제목2", ..., "제목10"]
    }
  ]
}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 6000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0]?.text || "";

  // 마크다운 코드블록 제거 후 JSON 추출
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 응답 파싱 실패 — 응답: " + raw.slice(0, 200));

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // JSON이 중간에 잘렸을 경우 부분 파싱 시도
    const partial = jsonMatch[0].replace(/,\s*\]/, "]").replace(/,\s*\}/, "}");
    parsed = JSON.parse(partial);
  }

  return {
    date,
    generatedAt: new Date().toISOString(),
    newspimTotal: npArticles.length,
    categories: parsed.categories || [],
    analysisContext: targetCats.map(c => ({
      category: c.cat,
      total: c.total,
      newspimCount: c.npCnt,
      share: c.share,
      missedCount: c.missedCount,
    })),
  };
}
