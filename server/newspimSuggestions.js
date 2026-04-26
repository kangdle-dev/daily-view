/**
 * @file newspimSuggestions.js
 * 뉴스핌 AI 발제 생성 — 타사 대비 보도 공백 분석 후 카테고리별 전문기자 역할로 제목 10개씩 생성
 * Few-shot: 당일 실제 뉴스핌 기사 5개를 예시로 제공해 문체·각도 학습
 */
import Anthropic from "@anthropic-ai/sdk";
import { getArticles } from "./articleStore.js";

const NEWSPIM_KEY = "newspim";

// 대분류 카테고리별 전문기자 역할
const CAT_ROLES = {
  "정치":    { role: "정치전문기자", focus: "정치권 동향, 정책, 선거, 여야 관계" },
  "경제":    { role: "경제전문기자", focus: "거시경제, 재정·금융정책, 기업경영" },
  "사회":    { role: "사회부기자",   focus: "사건·사고, 민생, 법원, 복지" },
  "북한":    { role: "북한·안보전문기자", focus: "북한 동향, 안보, 남북관계, 외교" },
  "국제":    { role: "국제부기자",   focus: "해외 정치·경제, 글로벌 이슈, 외교" },
  "산업":    { role: "산업부기자",   focus: "제조업, 유통, IT, 에너지, 스타트업" },
  "증권·금융": { role: "증권·금융전문기자", focus: "주식, 채권, 외환, 은행, 보험, 핀테크" },
  "부동산":  { role: "부동산전문기자", focus: "아파트, 분양, 상업용 부동산, 정책" },
  "문화":    { role: "문화부기자",   focus: "엔터테인먼트, 콘텐츠, 공연, 미디어" },
  "스포츠":  { role: "스포츠전문기자", focus: "프로스포츠, 국제대회, 선수 동향" },
  "전국":    { role: "전국부기자",   focus: "지방 행정, 지역경제, 지자체 이슈" },
};

// 유사 카테고리 → 대분류 정규화
const CAT_NORMALIZE = {
  "금융":       "증권·금융",
  "마켓":       "증권·금융",
  "증권.금융":  "증권·금융",
  "세계":       "국제",
  "글로벌":     "국제",
  "연예":       "문화",
};

function normalizeCategory(cat) {
  return CAT_NORMALIZE[cat] || cat;
}

export async function generateNewspimSuggestions(date) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const articles = await getArticles(date);
  if (!articles?.length) return null;

  const npArticles = articles.filter(a => a.source === NEWSPIM_KEY);
  const otherArticles = articles.filter(a => a.source !== NEWSPIM_KEY);
  if (!otherArticles.length) return null;

  // 대분류 기준으로 카테고리 집계
  const catMap = {};
  for (const a of otherArticles) {
    const cat = normalizeCategory(a.category || "기타");
    if (!catMap[cat]) catMap[cat] = { all: [], missed: [] };
    catMap[cat].all.push(a);
    const covered = npArticles.some(np => {
      const words = np.title.split(/\s+/).filter(w => w.length >= 3);
      return words.some(w => a.title.includes(w));
    });
    if (!covered) catMap[cat].missed.push(a);
  }

  const npCatMap = {};
  for (const a of npArticles) {
    const cat = normalizeCategory(a.category || "기타");
    npCatMap[cat] = (npCatMap[cat] || 0) + 1;
  }

  // 뉴스핌 기사에서 카테고리별 실제 기사 예시 추출 (Few-shot용)
  const npByCat = {};
  for (const a of npArticles) {
    const cat = normalizeCategory(a.category || "기타");
    if (!npByCat[cat]) npByCat[cat] = [];
    npByCat[cat].push(a);
  }

  // 분석 대상 카테고리 선정: CAT_ROLES에 정의된 대분류만, 기사 3건 이상
  const targetCats = Object.entries(catMap)
    .filter(([cat, d]) => CAT_ROLES[cat] && d.all.length >= 3)
    .map(([cat, d]) => {
      const npCnt = npCatMap[cat] || 0;
      const share = Math.round(npCnt / d.all.length * 100);
      return { cat, total: d.all.length, npCnt, share, missed: d.missed };
    })
    .sort((a, b) => {
      const score = c => (100 - c.share) + c.missed.length;
      return score(b) - score(a);
    })
    .slice(0, 7);

  if (!targetCats.length) return null;

  // 카테고리별 개별 AI 호출 (병렬)
  const client = new Anthropic();

  const results = await Promise.all(
    targetCats.map(async ({ cat, total, npCnt, share, missed }) => {
      const { role, focus } = CAT_ROLES[cat];
      const refs = missed.slice(0, 12)
        .map(a => `  - ${a.title} (${a.sourceName})`)
        .join("\n");

      // 해당 카테고리의 실제 뉴스핌 기사 제목 (Few-shot 예시)
      const npSamples = (npByCat[cat] || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(a => `  - ${a.title}`)
        .join("\n");

      const fewShotSection = npSamples
        ? `\n【뉴스핌 실제 기사 스타일 예시 (오늘 ${cat} 분야)】\n${npSamples}\n→ 위 예시처럼 구체적인 수치, 기업명, 인물명을 포함하고 뉴스핌 특유의 경제·시장 시각을 반영할 것\n`
        : "";

      const prompt = `당신은 경제전문지 뉴스핌의 ${role}입니다.
담당 분야: ${focus}
${fewShotSection}
오늘(${date}) 타사가 보도했지만 뉴스핌이 다루지 않은 ${cat} 분야 기사입니다.
(전체 ${total}건 중 뉴스핌 ${npCnt}건, 점유율 ${share}%)

타사 미보도 기사 목록:
${refs || "  - (참고 기사 없음)"}

위 타사 기사를 바탕으로 뉴스핌 스타일의 발제 10개를 제안해주세요.
- 위 예시처럼 구체적인 수치·기업명·인물명을 포함할 것
- 단순 사실 전달 말고 "왜", "어떻게", "다음은" 같은 심층 각도
- [단독] [분석] [인터뷰] [현장] 등 태그는 절대 사용하지 말 것, 순수 제목만
- 독자(기관투자자, 금융권 종사자)가 바로 활용할 수 있는 각도

JSON 형식으로만 응답 (다른 텍스트 없이):
{"articles": ["제목1", "제목2", "제목3", "제목4", "제목5", "제목6", "제목7", "제목8", "제목9", "제목10"]}`;

      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        });

        const raw = msg.content[0]?.text || "";
        const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          const partial = jsonMatch[0].replace(/,\s*\]/, "]").replace(/,\s*\}/, "}");
          parsed = JSON.parse(partial);
        }

        const articles = (parsed.articles || [])
          .map(t => t.replace(/^\[.+?\]\s*/g, "").trim());

        return {
          category: cat,
          role,
          articles,
          context: { total, newspimCount: npCnt, share },
        };
      } catch (err) {
        console.error(`[newspim/suggestions] ${cat} 생성 오류:`, err.message);
        return null;
      }
    })
  );

  const categories = results.filter(Boolean);
  if (!categories.length) throw new Error("기사 제목 생성에 실패했습니다.");

  return {
    date,
    generatedAt: new Date().toISOString(),
    newspimTotal: npArticles.length,
    categories,
  };
}
