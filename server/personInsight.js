import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// 정서 분석용 키워드
const POSITIVE_KEYWORDS = ["찬성", "성과", "합의", "동의", "지원", "약속", "계획", "추진", "개선", "성공"];
const NEGATIVE_KEYWORDS = ["반대", "비판", "논란", "문제", "실패", "거부", "압박", "갈등", "위기", "의혹"];

function analyzeSentiment(title) {
  const lower = title.toLowerCase();
  let score = 0;

  POSITIVE_KEYWORDS.forEach(kw => {
    if (lower.includes(kw)) score++;
  });

  NEGATIVE_KEYWORDS.forEach(kw => {
    if (lower.includes(kw)) score--;
  });

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export async function generatePersonInsight(date, personName, articles) {
  if (!articles?.length) return null;

  // ── 정서 분석 ────────────────────────────────────────
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  articles.forEach(a => {
    const sentiment = analyzeSentiment(a.title);
    sentiments[sentiment]++;
  });

  const sentimentSummary = {
    positive: Math.round((sentiments.positive / articles.length) * 100),
    neutral: Math.round((sentiments.neutral / articles.length) * 100),
    negative: Math.round((sentiments.negative / articles.length) * 100),
  };

  // ── AI 분석 (핵심 이슈 요약) ────────────────────────────
  let aiSummary = "";
  try {
    const articleTexts = articles.slice(0, 10).map((a, i) =>
      `${i + 1}. [${a.category}] ${a.title} (${a.sourceName})`
    ).join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20241001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `다음은 ${personName} 관련 뉴스 기사 제목들입니다.

${articleTexts}

이 기사들을 분석해서 ${personName}과 관련된 핵심 이슈를 3-4개 정도 간단히 요약해주세요. 각 이슈마다 1-2줄 정도로 작성해주세요.

형식:
• [이슈1]: 설명
• [이슈2]: 설명
• [이슈3]: 설명`
        }
      ]
    });

    aiSummary = response.content[0].type === "text" ? response.content[0].text : "";
  } catch (err) {
    console.warn("[personInsight] AI 분석 실패:", err.message);
    aiSummary = "AI 분석 실패";
  }

  // ── 언론사별 정서 분석 ────────────────────────────────
  const sourceSentiment = {};
  articles.forEach(a => {
    if (!sourceSentiment[a.sourceName]) {
      sourceSentiment[a.sourceName] = { positive: 0, neutral: 0, negative: 0, total: 0 };
    }
    const sentiment = analyzeSentiment(a.title);
    sourceSentiment[a.sourceName][sentiment]++;
    sourceSentiment[a.sourceName].total++;
  });

  const sourceAnalysis = Object.entries(sourceSentiment)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([source, data]) => ({
      source,
      total: data.total,
      positive: Math.round((data.positive / data.total) * 100),
      neutral: Math.round((data.neutral / data.total) * 100),
      negative: Math.round((data.negative / data.total) * 100),
    }));

  // ── 카테고리별 분석 ────────────────────────────────────
  const categoryMap = {};
  articles.forEach(a => {
    if (!categoryMap[a.category]) categoryMap[a.category] = 0;
    categoryMap[a.category]++;
  });

  const categoryAnalysis = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  return {
    date,
    personName,
    totalArticles: articles.length,

    // 정서 분석
    sentimentSummary,

    // AI 분석
    aiInsight: aiSummary,

    // 언론사별 정서
    sourceAnalysis,

    // 카테고리 분석
    topCategories: categoryAnalysis,
  };
}
