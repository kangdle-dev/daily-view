import Anthropic from "@anthropic-ai/sdk";

const G1 = ["경향신문", "한겨레신문", "조선일보", "동아일보", "중앙일보", "뉴스토마토"];
const G2 = ["KBS", "MBC", "SBS", "YTN", "서울신문", "세계일보", "한국일보", "국민일보", "매일경제", "한국경제", "서울경제", "이데일리"];

function fmtDate(d) {
  const dt = new Date(d + "T12:00:00");
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

function prevDay(d) {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

export async function generateBriefing(date) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `당신은 한국 시사방송 현직 기자의 AI 뉴스 브리핑 어시스턴트입니다.

오늘은 ${fmtDate(date)}입니다.
수집 기간: ${prevDay(date)} 07:00 ~ ${fmtDate(date)} 06:59

■ 대상 언론사 (이 매체들만 사용할 것)
1그룹(상세 분석): ${G1.join(", ")}
2그룹(단독·특종 위주 간략): ${G2.join(", ")}

■ 수집 우선순위: 1면/톱기사, 단독, 속보, 특종, 많이 읽은 기사
■ 반드시 web_search로 각 언론사의 실제 기사를 검색하여 제목·핵심 내용을 확인 후 작성할 것

■ 출력 형식 (아래 순서·형식 반드시 준수):

🚨 단독 · 속보
• [단독 또는 속보 기사 제목] — (언론사)
(해당 기사가 없으면 이 섹션 생략)

━━━ 전체 주요 뉴스 TOP 5 ━━━

1. [헤드라인]
▸ 키워드: (3~5개 핵심 키워드)
▸ 핵심: (1~2줄 개조식 요약)
▸ 출처: (언론사명 — 유사기사 있으면 "조선일보, 동아일보 등")

2. [헤드라인]
▸ 키워드: ...
▸ 핵심: ...
▸ 출처: ...

(3~5번 동일)

━━━ 분야별 브리핑 ━━━

🏛️ 정치
• [헤드라인] — (언론사, 언론사2 등): 핵심 요약
(최대 5개, 유사 기사는 반드시 하나로 묶어 복수 언론사 표기)

💰 경제/사회
(동일, 최대 5개)

💻 IT/기술
(동일, 최대 5개)

🎭 문화/연예/스포츠
(동일, 최대 5개)

📌 기타
(동일, 최대 5개)

■ 작성 규칙
- 위 대상 언론사 18개 외 다른 매체 기사는 포함하지 말 것
- 제목에 [단독] [속보] 표기된 기사는 반드시 맨 위 🚨 섹션에 별도 수록
- 동일 사건을 다룬 유사 기사는 대표 제목 하나만 사용하고, 작성 언론사를 "(경향, 한겨레 등)" 형식으로 묶어 표기
- 1그룹: 기사 본문 내용 기반 상세 분석 / 2그룹: 단독·특종 위주 간략 정리
- 뉴스가 없는 분야는 해당 섹션 생략`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("브리핑 내용이 비어있습니다.");
  return text;
}
