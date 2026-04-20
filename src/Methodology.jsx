import { useState, useEffect } from "react";
import Nav from "./Nav.jsx";

const C = {
  bg: "#F1F5F9", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#2563EB", nav: "#1E293B",
  teal: "#0D9488", gold: "#D97706", green: "#16A34A",
  purple: "#7C3AED", red: "#DC2626",
};


function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function Section({ title, color = C.accent, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function ScoreRow({ label, desc, score, color = C.accent }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ minWidth: 44, textAlign: "center" }}>
        <span style={{ background: color + "20", color, fontWeight: 700, fontSize: 15, padding: "2px 8px", borderRadius: 6 }}>
          {score}
        </span>
      </div>
      <div>
        <div style={{ fontWeight: 600, color: C.txt1, fontSize: 14 }}>{label}</div>
        <div style={{ color: C.txt2, fontSize: 13, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

function Formula({ children }) {
  return (
    <div style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: "0 6px 6px 0", padding: "10px 16px", fontFamily: "monospace", fontSize: 14, color: C.txt1, margin: "10px 0" }}>
      {children}
    </div>
  );
}

function Tag({ children, color = C.accent }) {
  return (
    <span style={{ background: color + "18", color, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 12, marginRight: 6, display: "inline-block", marginBottom: 4 }}>
      {children}
    </span>
  );
}

function ReliabilityBar({ label, value, max = 100, color = C.accent }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: C.txt1, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ background: "#E2E8F0", borderRadius: 4, height: 8 }}>
        <div style={{ width: `${(value / max) * 100}%`, background: color, borderRadius: 4, height: 8, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

export default function Methodology() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      <Nav current="/methodology" />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 24px" }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: isMobile ? 22 : 28, color: C.txt1, fontWeight: 800 }}>분석 방법론</h1>
          <p style={{ margin: 0, color: C.txt2, fontSize: 14, lineHeight: 1.6 }}>
            이 시스템이 뉴스 기사를 수집·분류·점수화하는 방식과 각 수치의 신뢰도 범위를 설명합니다.
            모든 분석은 규칙 기반(rule-based) 알고리즘과 AI 언어 모델의 두 계층으로 구성됩니다.
          </p>
        </div>

        {/* ── 1. RSS 소스 및 카테고리 관리 ── */}
        <Section title="1. RSS 소스 및 카테고리 관리" color={C.teal}>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>소스 구조</div>
            <p style={{ margin: "0 0 12px", color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              각 언론사(소스)는 여러 카테고리의 RSS 피드를 보유합니다. 관리자는 피드 관리 페이지에서 피드를 추가·편집·삭제하고, 각 피드마다 <strong>대표 카테고리(mainCategory)</strong>를 지정합니다.
            </p>
            <Formula style={{ background: "#F0FDF4", borderLeft: `3px solid ${C.teal}` }}>
              경향신문 → [정치, 경제, 사회, 국제, 스포츠, 문화] RSS<br />
              조선일보 → [정치, 경제, 사회, 국제, 문화, 스포츠, 엔터] RSS<br />
              ... (각 피드마다 mainCategory 지정)
            </Formula>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, color: C.txt1, fontSize: 13, marginBottom: 6 }}>카테고리 매핑 흐름</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 8 }}>
                {[
                  { num: "1", label: "피드 선택", desc: "경향신문 경제 RSS" },
                  { num: "2", label: "mainCategory 지정", desc: "\"경제\"로 설정" },
                  { num: "3", label: "기사 수집", desc: "RSS 파싱" },
                  { num: "4", label: "카테고리 적용", desc: "article.category = \"경제\"" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#F0FDF4", border: `1px solid #86EFAC`, borderRadius: 6, padding: 12, textAlign: "center" }}>
                    <div style={{ color: C.teal, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{item.num}</div>
                    <div style={{ fontWeight: 600, color: C.txt1, fontSize: 13, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ color: C.txt2, fontSize: 12 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>설정 관리</div>
            <p style={{ margin: "0 0 12px", color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              설정 페이지에서 시스템에서 사용할 대표 카테고리 목록을 관리합니다. 기본 카테고리는 정치, 경제, 사회, 문화, 스포츠, 국제, 산업, 북한입니다.
            </p>
            <Formula style={{ background: "#F0FDF4", borderLeft: `3px solid ${C.teal}` }}>
              설정 페이지 → "카테고리" 탭 → 추가/삭제 → 저장<br />
              피드 관리 페이지 → 각 피드의 mainCategory 드롭다운에서 선택
            </Formula>
          </Card>
        </Section>

        {/* ── 2. 수집 파이프라인 ── */}
        <Section title="2. 수집 파이프라인" color={C.teal}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { step: "RSS 파싱", detail: "각 언론사의 RSS 피드를 rss-parser로 읽어 24시간 이내 기사만 필터링합니다. 메타 정보(제목, URL, 발행일, 요약)를 우선 수집합니다." },
                { step: "카테고리 매핑", detail: "RSS 피드마다 설정된 mainCategory를 기사에 적용합니다. mainCategory가 없으면 피드의 category 필드를 사용합니다." },
                { step: "중복 URL 스킵", detail: "수집 시작 시 당일 이미 저장된 URL Set을 구성합니다. 동일 URL은 본문 스크래핑(fetchContent) 자체를 건너뜁니다. 네트워크 비용과 서버 부하를 최소화하는 핵심 최적화입니다." },
                { step: "본문 스크래핑", detail: "Axios + Cheerio로 기사 원문 페이지를 로드하고, 언론사별 CSS 셀렉터 목록을 순차 시도해 본문 텍스트를 추출합니다. 300ms 딜레이로 서버 부하를 조절합니다." },
                { step: "JSON 저장", detail: "data/articles/{source}-{YYYY-MM-DD}.json에 누적 저장. category는 이미 매핑된 mainCategory 또는 피드의 category입니다." },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ minWidth: 28, height: 28, background: C.teal, color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: C.txt1, fontSize: 14, marginBottom: 3 }}>{r.step}</div>
                    <div style={{ color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── 3. 기사 유사도 그룹핑 ── */}
        <Section title="3. 기사 유사도 그룹핑" color={C.purple}>
          <Card style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 12px", color: C.txt2, fontSize: 14, lineHeight: 1.6 }}>
              여러 언론사가 같은 사건을 보도한 기사를 하나의 이슈 그룹으로 묶습니다. 제목에서 추출한 키워드의 <strong>Jaccard 유사도</strong>를 사용합니다.
            </p>
            <Formula>
              Jaccard(A, B) = |A ∩ B| / |A ∪ B|
            </Formula>
            <Formula>
              유사도 ≥ 0.35 → 같은 이슈 그룹으로 분류
            </Formula>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, color: C.txt1, fontSize: 13, marginBottom: 8 }}>키워드 전처리 단계</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["[단독] [속보] 태그 제거", "특수문자 제거", "2글자 미만 제거", "불용어 제거 (조사·접속사 등 60여개)", "결과: 의미 명사·고유명사만 유지"].map((t, i) => (
                  <Tag key={i} color={C.purple}>{i + 1}. {t}</Tag>
                ))}
              </div>
            </div>
          </Card>
          <Card style={{ background: "#FAF5FF", border: `1px solid #E9D5FF` }}>
            <div style={{ fontWeight: 600, color: C.purple, fontSize: 13, marginBottom: 6 }}>임계값 0.35의 근거</div>
            <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              뉴스 제목은 짧아 공통 키워드가 절대적으로 적습니다. 0.35는 "같은 사건을 다르게 표현한 경우"를 묶되 "단순히 같은 키워드가 등장하는 다른 기사"는 분리하는 경험적 임계값입니다. 너무 낮으면 무관한 기사가 묶이고(과합집합), 너무 높으면 같은 사건이 분리됩니다(과분리).
            </p>
          </Card>
        </Section>

        {/* ── 4. 기사 중요도 점수 ── */}
        <Section title="4. 기사 중요도 점수 계산" color={C.gold}>
          <Card style={{ marginBottom: 12 }}>
            <Formula>
              점수 = 속보 + 복수보도 + 최신성 + 카테고리 + 본문유무
            </Formula>
            <div style={{ marginTop: 4 }}>
              <ScoreRow label="단독·속보" desc="제목에 [단독], [속보], (속보) 포함 시 부여. 독점 취재 및 긴급 사안을 우선 노출합니다." score="+5" color={C.red} />
              <ScoreRow label="복수 언론사 보도" desc="같은 이슈를 보도한 언론사 수 - 1. 최대 +5. 여러 매체가 주목할수록 사회적 중요도가 높다고 판단합니다." score="+0~5" color={C.gold} />
              <ScoreRow label="최신성 (6시간 이내)" desc="발행 후 6시간 이내 기사. 시의성이 높은 속보성 기사를 상위 노출합니다." score="+2" color={C.teal} />
              <ScoreRow label="최신성 (6~12시간)" desc="발행 후 6~12시간 이내 기사." score="+1" color={C.teal} />
              <ScoreRow label="카테고리 중요도 (고)" desc="정치·경제·사회·북한: 임원 보고 관점에서 우선 관심 영역." score="+2" color={C.purple} />
              <ScoreRow label="카테고리 중요도 (중)" desc="국제·세계·글로벌·산업·마켓·증권·금융: 비즈니스 연관도 높은 영역." score="+1.5" color={C.purple} />
              <ScoreRow label="카테고리 중요도 (기본)" desc="문화·스포츠·연예·전국 등 그 외 카테고리." score="+1" color={C.txt3} />
              <ScoreRow label="본문 수집 성공" desc="본문 텍스트 100자 이상 수집된 경우. 실제 내용이 있는 기사를 선호합니다." score="+1" color={C.green} />
            </div>
          </Card>
          <Card style={{ background: "#FFFBEB", border: `1px solid #FDE68A` }}>
            <div style={{ fontWeight: 600, color: C.gold, fontSize: 13, marginBottom: 6 }}>이론적 최고 점수</div>
            <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              속보(+5) + 5개 언론사 동시 보도(+5) + 6시간 이내(+2) + 정치 카테고리(+2) + 본문 수집(+1) = <strong style={{ color: C.gold }}>최대 15점</strong>.
              실제 TOP 10 기사는 대부분 7~12점 범위에 분포합니다.
            </p>
          </Card>
        </Section>

        {/* ── 5. 인사이트 분석 ── */}
        <Section title="5. 인사이트 분석 방법" color={C.teal}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card>
              <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>키워드 빈도 분석</div>
              <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
                전체 기사 제목에서 불용어를 제거한 명사를 추출해 빈도순으로 정렬. 상위 20개를 표시합니다. 동일 기사에서 같은 단어가 여러 번 등장해도 기사당 1회로 카운트하지 않고 제목 단어 수 그대로 집계합니다.
              </p>
            </Card>
            <Card>
              <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>언론사 × 카테고리 매트릭스</div>
              <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
                각 언론사가 카테고리별로 몇 건을 보도했는지 교차표로 표시. 카테고리는 전체 기사 수 기준 내림차순으로 최대 10개를 선정합니다. 특정 언론사의 취재 집중도를 한눈에 파악할 수 있습니다.
              </p>
            </Card>
            <Card>
              <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>크로스소스 이슈 감지</div>
              <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
                특정 키워드를 3개 이상의 언론사가 공통으로 사용한 경우를 "크로스소스 이슈"로 분류. 언론사 수 → 기사 수 순으로 정렬해 상위 10개를 제시합니다. 사회적 공론화 수준을 반영합니다.
              </p>
            </Card>
            <Card>
              <div style={{ fontWeight: 600, color: C.teal, fontSize: 14, marginBottom: 8 }}>AI 요약 (Claude Haiku)</div>
              <p style={{ margin: 0, color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
                속보 우선으로 정렬한 최대 60개 기사 제목을 Claude Haiku에 전달. 전반적 흐름, 분야별 주요 이슈, 복수 언론사 집중 보도 사안, 특이사항을 400자 내외로 요약합니다.
              </p>
            </Card>
          </div>
        </Section>

        {/* ── 6. 신뢰도 ── */}
        <Section title="6. 수치별 신뢰도 평가" color={C.red}>
          <Card style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 16px", color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              규칙 기반 분석의 특성상 각 수치에는 고유한 한계가 있습니다. 아래 신뢰도는 "해당 수치가 실제 현실을 얼마나 정확히 반영하는가"에 대한 정성적 평가입니다.
            </p>
            <ReliabilityBar label="기사 수집 완전성 (URL 누락 없음)" value={85} color={C.green} />
            <ReliabilityBar label="유사 기사 그룹핑 정확도" value={75} color={C.teal} />
            <ReliabilityBar label="기사 중요도 순위 (TOP 5 기준)" value={80} color={C.gold} />
            <ReliabilityBar label="키워드 빈도 순위" value={90} color={C.purple} />
            <ReliabilityBar label="크로스소스 이슈 감지" value={85} color={C.accent} />
            <ReliabilityBar label="AI 요약 정확성 (Claude Haiku)" value={70} color={C.red} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Card style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
              <div style={{ fontWeight: 600, color: C.red, fontSize: 13, marginBottom: 8 }}>알려진 한계</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.txt2, fontSize: 13, lineHeight: 1.8 }}>
                <li>동음이의어 구분 불가 (예: "금리" 인상 vs 인상착의)</li>
                <li>본문 스크래핑 실패 시 제목만으로 분석</li>
                <li>신생·비정형 소스는 CSS 셀렉터 적중률 낮음</li>
                <li>카테고리 중요도 가중치는 뉴스핌 편집 기준 반영</li>
                <li>Jaccard 0.35 임계값은 단편적 제목에 민감</li>
              </ul>
            </Card>
            <Card style={{ background: "#F0FDF4", border: `1px solid #BBF7D0` }}>
              <div style={{ fontWeight: 600, color: C.green, fontSize: 13, marginBottom: 8 }}>신뢰도 향상 조건</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.txt2, fontSize: 13, lineHeight: 1.8 }}>
                <li>수집 언론사가 많을수록 복수보도 가중치 정확도 ↑</li>
                <li>하루 100건 이상 수집 시 키워드 통계 안정화</li>
                <li>정기 수집(06시 이전) 완료 후 분석 시 최신성 점수 유효</li>
                <li>커스텀 소스 추가로 커버리지 확대 가능</li>
                <li>AI 요약은 속보 기사 비중이 낮을수록 품질 향상</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* ── 7. 뉴스핌 분석 방법 ── */}
        <Section title="7. 뉴스핌 비교 분석 방법" color={C.purple}>
          <Card>
            <p style={{ margin: "0 0 14px", color: C.txt2, fontSize: 13, lineHeight: 1.6 }}>
              뉴스핌분석 페이지는 인사이트의 <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 3 }}>sourceStats</code>와 <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: 3 }}>crossSourceIssues</code>를 활용해 뉴스핌과 타 언론사를 비교합니다.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { metric: "카테고리 점유율 (Share%)", formula: "뉴스핌 카테고리 기사 수 / 전체 언론사 해당 카테고리 기사 수 × 100", desc: "카테고리별로 뉴스핌이 전체 보도의 몇 %를 차지하는지 측정합니다." },
                { metric: "카테고리 순위 (Rank)", formula: "해당 카테고리에서 기사 수 기준 언론사 순위", desc: "1위 카테고리는 뉴스핌의 '강점 영역'으로 표시됩니다." },
                { metric: "특화 영역 점유율", formula: "증권·금융, 산업, 부동산, 경제 4개 카테고리 기사 합계 / 전체 기사 수", desc: "뉴스핌이 경제·금융 전문 매체로서의 특화 집중도를 나타냅니다." },
                { metric: "공동 이슈 참여율", formula: "3개+ 언론사가 보도한 크로스소스 이슈 중 뉴스핌이 포함된 비율", desc: "주요 의제 설정에 뉴스핌이 얼마나 참여하고 있는지 반영합니다." },
              ].map((r, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontWeight: 600, color: C.txt1, fontSize: 14, marginBottom: 4 }}>{r.metric}</div>
                  <Formula>{r.formula}</Formula>
                  <div style={{ color: C.txt2, fontSize: 13 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* 푸터 */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 8, color: C.txt3, fontSize: 12, textAlign: "center", lineHeight: 1.8 }}>
          분석 알고리즘 소스: server/report.js · server/insight.js · server/collectors/custom.js<br />
          설정 관리: server/feedStore.js · server/settingsStore.js<br />
          AI 모델: Claude Haiku (인사이트 요약) · Claude Sonnet (브리핑 생성)<br />
          알고리즘 버전: 1.1 (피드 카테고리 매핑 추가) · 2026-04-20
        </div>
      </div>
    </div>
  );
}
