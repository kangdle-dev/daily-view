import { useState } from "react";

const Y = "#FFD600";   // Seoul Yellow
const B = "#111111";   // Black
const S = "#48C4F8";   // Sky Blue

const G1 = ["경향신문","한겨레신문","조선일보","동아일보","중앙일보","뉴스토마토"];
const G2 = ["KBS","MBC","SBS","YTN","서울신문","세계일보","한국일보","국민일보","매일경제","한국경제","서울경제","이데일리"];

const today = () => new Date().toISOString().split("T")[0];

const fmtDate = (d) => {
  const dt = new Date(d + "T12:00:00");
  return `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일`;
};
const prevDay = (d) => {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일`;
};

function Logo({ size = 28 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:size, height:size, background:Y, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", flexShrink:0 }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40%", background:S, opacity:.7 }}/>
        <span style={{ fontWeight:900, fontSize:size*.48, color:B, position:"relative", zIndex:1, letterSpacing:-1 }}>D</span>
      </div>
      <span style={{ fontWeight:900, fontSize:size*.72, letterSpacing:-1, color:B }}>Daily View</span>
    </div>
  );
}

function Badge({ children, variant = "yellow" }) {
  const styles = {
    yellow: { background:Y, color:B },
    blue:   { background:S, color:"#fff" },
    dark:   { background:B, color:Y },
    ghost:  { background:"#f0f0f0", color:"#555" },
    red:    { background:"#FF3B30", color:"#fff" },
  };
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, display:"inline-block", ...styles[variant] }}>
      {children}
    </span>
  );
}

// ─── 브리핑 텍스트를 섹션별로 파싱해 구조화된 UI로 렌더링 ───
function BriefingReport({ text, date }) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { if (current) current.lines.push(""); continue; }

    // 섹션 헤더 감지
    const isBreaking = /🚨|단독\s*[··]\s*속보|속보\s*[··]\s*단독/.test(line);
    const isTop5     = /TOP\s*5|주요\s*뉴스/.test(line);
    const isCat      = /^(🏛|💰|💻|🎭|📌|🌐)/.test(line);
    const isDivider  = /^━+/.test(line);

    if (isDivider) continue;

    if (isBreaking) {
      current = { type:"breaking", title: line.replace(/━+/g,"").trim(), lines:[] };
      sections.push(current);
    } else if (isTop5) {
      current = { type:"top5", title: line.replace(/━+/g,"").trim(), lines:[] };
      sections.push(current);
    } else if (isCat) {
      current = { type:"category", title: line.trim(), lines:[] };
      sections.push(current);
    } else {
      if (!current) { current = { type:"header", title:"", lines:[] }; sections.push(current); }
      current.lines.push(line);
    }
  }

  const headerSection = sections.find(s => s.type === "header");
  const breakingSection = sections.find(s => s.type === "breaking");
  const top5Section = sections.find(s => s.type === "top5");
  const catSections = sections.filter(s => s.type === "category");

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif" }}>

      {/* 리포트 헤더 */}
      <div style={{ background:B, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:14, height:14, background:Y, borderRadius:3 }}/>
          <span style={{ color:"#fff", fontWeight:800, fontSize:13 }}>Daily View — {fmtDate(date)}</span>
        </div>
        <span style={{ color:S, fontSize:10, fontWeight:700, letterSpacing:.5 }}>AI REPORT</span>
      </div>
      <div style={{ height:3, background:`linear-gradient(90deg,${Y},${S})` }}/>

      <div style={{ padding:"0 0 8px" }}>

        {/* 단독·속보 섹션 */}
        {breakingSection && breakingSection.lines.filter(l=>l.trim()).length > 0 && (
          <div style={{ margin:"12px 14px", background:"#fff8f8", border:"2px solid #FF3B30", borderRadius:10, overflow:"hidden" }}>
            <div style={{ background:"#FF3B30", padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:15 }}>🚨</span>
              <span style={{ color:"#fff", fontWeight:800, fontSize:13 }}>단독 · 속보</span>
            </div>
            <div style={{ padding:"10px 14px" }}>
              {breakingSection.lines.filter(l=>l.trim()).map((l,i) => (
                <div key={i} style={{ fontSize:13, lineHeight:1.8, color:"#1a1a1a", padding:"4px 0", borderBottom: i < breakingSection.lines.filter(ll=>ll.trim()).length-1 ? "1px solid #ffe4e4" : "none" }}>
                  {l.replace(/^[•·\-]\s*/, "")}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP 5 */}
        {top5Section && (
          <div style={{ margin:"12px 14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:4, height:18, background:Y, borderRadius:2 }}/>
              <span style={{ fontWeight:900, fontSize:14, letterSpacing:-.5 }}>전체 주요 뉴스 TOP 5</span>
            </div>
            <Top5Lines lines={top5Section.lines} />
          </div>
        )}

        {/* 분야별 브리핑 */}
        {catSections.length > 0 && (
          <div style={{ margin:"16px 14px 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:4, height:18, background:S, borderRadius:2 }}/>
              <span style={{ fontWeight:900, fontSize:14, letterSpacing:-.5 }}>분야별 브리핑</span>
            </div>
            {catSections.map((sec, i) => (
              <CategorySection key={i} section={sec} />
            ))}
          </div>
        )}

        {/* 파싱 안 된 경우 원문 fallback */}
        {!top5Section && !breakingSection && catSections.length === 0 && (
          <div style={{ padding:"16px", fontSize:13, lineHeight:1.9, color:"#1a1a1a", whiteSpace:"pre-wrap" }}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

function Top5Lines({ lines }) {
  // 번호로 시작하는 항목 묶기
  const items = [];
  let cur = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^\d+\./.test(line)) {
      if (cur) items.push(cur);
      cur = { headline: line.replace(/^\d+\.\s*/, ""), details: [] };
    } else if (cur) {
      cur.details.push(line);
    }
  }
  if (cur) items.push(cur);

  if (items.length === 0) {
    return (
      <div style={{ fontSize:13, lineHeight:1.9, color:"#333", whiteSpace:"pre-wrap" }}>
        {lines.join("\n")}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ background:"#fff", border:`1.5px solid ${B}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ background: idx === 0 ? Y : "#f7f7f7", padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontWeight:900, fontSize:16, color: idx === 0 ? B : "#aaa", flexShrink:0, lineHeight:1.3 }}>{idx+1}</span>
            <span style={{ fontWeight:800, fontSize:13, lineHeight:1.5, color:B }}>{item.headline}</span>
          </div>
          {item.details.length > 0 && (
            <div style={{ padding:"8px 14px 10px" }}>
              {item.details.map((d, di) => {
                const isKw = /키워드/.test(d);
                const isCore = /핵심/.test(d);
                const isSrc = /출처/.test(d);
                return (
                  <div key={di} style={{ fontSize:12, lineHeight:1.8, color: isSrc ? "#888" : "#333", display:"flex", gap:6 }}>
                    <span style={{ color: isKw ? S : isCore ? B : "#aaa", fontWeight:700, flexShrink:0 }}>
                      {isKw ? "키" : isCore ? "핵" : isSrc ? "출" : "▸"}
                    </span>
                    <span>{d.replace(/^[▸►]\s*(키워드|핵심|출처)[:\s]*/, "")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CategorySection({ section }) {
  const items = section.lines.filter(l => l.trim());
  return (
    <div style={{ marginBottom:10, background:"#fff", border:"1.5px solid #e8e8e8", borderRadius:8, overflow:"hidden" }}>
      <div style={{ padding:"10px 14px", background:"#fafafa", borderBottom:"1.5px solid #e8e8e8" }}>
        <span style={{ fontWeight:800, fontSize:13 }}>{section.title}</span>
      </div>
      {items.length > 0 ? (
        <div style={{ padding:"8px 0" }}>
          {items.map((line, i) => (
            <div key={i} style={{ padding:"6px 14px", fontSize:13, lineHeight:1.7, color:"#222", borderBottom: i < items.length-1 ? "1px solid #f0f0f0" : "none" }}>
              {line.replace(/^[•·]\s*/, "")}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding:"12px 14px", fontSize:12, color:"#bbb" }}>해당 분야 기사 없음</div>
      )}
    </div>
  );
}

function BriefingApp({ onBack }) {
  const [date, setDate] = useState(today());
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const generate = async ({ force = false } = {}) => {
    setLoading(true); setBriefing(""); setErr(""); setFromCache(false);

    try {
      // 1) 캐시 먼저 확인
      if (!force) {
        const cached = await fetch(`/api/briefing?date=${date}`);
        if (cached.ok) {
          const data = await cached.json();
          setBriefing(data.content);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }

      // 2) 캐시 없으면 생성 요청 (오래 걸릴 수 있음)
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setBriefing(data.content);
      setFromCache(!!data.cached);
    } catch (e) {
      setErr("오류: " + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(briefing).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2000); });
  };

  return (
    <div style={{ fontFamily:"system-ui,'Apple SD Gothic Neo',sans-serif", background:"#f2f4f7", minHeight:"100vh" }}>

      {/* Nav */}
      <nav style={{ background:"#fff", borderBottom:`2px solid ${B}`, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ cursor:"pointer", display:"flex", alignItems:"center" }} onClick={onBack}>
          <span style={{ fontSize:18, marginRight:8 }}>←</span>
          <Logo size={22}/>
        </div>
        <Badge variant="blue">뉴스 브리핑</Badge>
      </nav>
      <div style={{ height:3, background:`linear-gradient(90deg,${Y},${S})` }}/>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"16px 12px 60px" }}>

        {/* 날짜 + 생성 버튼 */}
        <div style={{ background:"#fff", border:`1.5px solid #ddd`, borderRadius:10, overflow:"hidden", marginBottom:12 }}>
          <div style={{ background:B, padding:"8px 14px", display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:Y }}/>
            <div style={{ width:7, height:7, borderRadius:"50%", background:S }}/>
            <span style={{ color:"#555", fontSize:11, marginLeft:2 }}>브리핑 설정</span>
          </div>
          <div style={{ padding:"14px 16px" }}>
            <label style={{ fontSize:11, fontWeight:700, color:"#888", display:"block", marginBottom:6, letterSpacing:.5, textTransform:"uppercase" }}>날짜 선택</label>
            <input type="date" value={date} max={today()} onChange={e=>setDate(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", border:`1.5px solid ${B}`, borderRadius:7, padding:"11px 12px", fontSize:15, fontFamily:"inherit", outline:"none", fontWeight:600, marginBottom:12 }}/>
            <button onClick={() => generate()} disabled={loading}
              style={{ width:"100%", background: loading?"#aaa":S, color:"#fff", border:"none", padding:"14px", borderRadius:8, fontWeight:800, fontSize:15, cursor: loading?"not-allowed":"pointer", marginBottom:8 }}>
              {loading ? "⏳ 뉴스 수집·분석 중..." : "⚡ 브리핑 생성"}
            </button>
            {briefing && (
              <button onClick={() => generate({ force: true })} disabled={loading}
                style={{ width:"100%", background:"#fff", color:"#888", border:"1.5px solid #ddd", padding:"10px", borderRadius:8, fontWeight:700, fontSize:13, cursor: loading?"not-allowed":"pointer" }}>
                🔄 재생성 (캐시 무시)
              </button>
            )}
          </div>
        </div>

        {/* 커버리지 태그 */}
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          <Badge variant="yellow">1그룹 6개사 — 상세</Badge>
          <Badge variant="blue">2그룹 12개사 — 단독위주</Badge>
          <Badge variant="ghost">단독·속보 별도 수록</Badge>
          {fromCache && <Badge variant="dark">⚡ 캐시</Badge>}
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ background:"#fff", border:`2px solid ${S}`, borderRadius:10, padding:"48px 16px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>뉴스 수집 및 분석 중...</div>
            <div style={{ color:"#aaa", fontSize:12, marginBottom:20 }}>18개 언론사 기사를 검색·교차 확인하고 있습니다</div>
            <div style={{ display:"flex", justifyContent:"center", gap:7 }}>
              {[Y,S,B].map((c,i) => (
                <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c, animation:`bop .9s ${i*.18}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {/* 오류 */}
        {err && !loading && (
          <div style={{ background:"#fff3f3", border:"2px solid #f99", borderRadius:10, padding:"16px", color:"#c00", fontSize:13, fontWeight:600 }}>
            ⚠️ {err}
          </div>
        )}

        {/* 리포트 출력 */}
        {briefing && !loading && (
          <div style={{ background:"#fff", border:`2px solid ${B}`, borderRadius:10, overflow:"hidden" }}>
            <BriefingReport text={briefing} date={date} />
            <div style={{ borderTop:"1.5px solid #eee", padding:"10px 14px", display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={copy}
                style={{ border:`2px solid ${B}`, background: copied?Y:"#fff", color:B, padding:"10px 18px", borderRadius:7, fontWeight:700, fontSize:13, cursor:"pointer", minHeight:44 }}>
                {copied ? "✓ 복사됨!" : "📋 전체 복사"}
              </button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!briefing && !loading && !err && (
          <div style={{ background:"#fff", border:"2px dashed #ddd", borderRadius:10, padding:"48px 16px", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📰</div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6, color:"#bbb" }}>날짜를 선택하고 브리핑을 생성하세요</div>
            <div style={{ fontSize:12, color:"#ccc" }}>매일 07:10 이후 전날 뉴스가 자동 집계됩니다</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bop {
          0%,80%,100%{transform:scale(0)}
          40%{transform:scale(1)}
        }
        * { -webkit-tap-highlight-color: transparent; }
        input, button { touch-action: manipulation; }
      `}</style>
    </div>
  );
}

function Landing({ onOpen }) {
  return (
    <div style={{ fontFamily:"system-ui,'Apple SD Gothic Neo',sans-serif", background:"#fff", color:B, minHeight:"100vh" }}>

      {/* Nav */}
      <nav style={{ borderBottom:`2px solid ${B}`, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:54, position:"sticky", top:0, background:"#fff", zIndex:20 }}>
        <Logo size={26}/>
        <button onClick={onOpen} style={{ background:S, color:"#fff", border:"none", padding:"10px 18px", borderRadius:7, fontWeight:800, fontSize:13, cursor:"pointer", minHeight:40 }}>
          브리핑 생성 →
        </button>
      </nav>

      {/* Hero */}
      <section style={{ padding:"56px 20px 52px", textAlign:"center", borderBottom:`2px solid ${B}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240, borderRadius:"50%", background:S, opacity:.08, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-40, left:-30, width:160, height:160, borderRadius:"50%", background:Y, opacity:.15, pointerEvents:"none" }}/>
        <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:20 }}>
          <Badge variant="yellow">매일 07:10 자동 발송</Badge>
          <Badge variant="blue">AI 팩트체크</Badge>
          <Badge variant="red">단독·속보 별도 수록</Badge>
        </div>
        <h1 style={{ fontSize:"clamp(30px,8vw,54px)", fontWeight:900, lineHeight:1.1, letterSpacing:-2, margin:"0 0 18px" }}>
          하루를 이기는<br/>
          <span style={{ color:S }}>뉴스</span>
          <span style={{ color:B }}>, 한 눈에.</span>
        </h1>
        <p style={{ fontSize:15, color:"#555", lineHeight:1.8, margin:"0 auto 36px", maxWidth:400 }}>
          경향·조선·동아·한겨레·KBS·MBC 등<br/>
          <strong style={{ color:B }}>18개 주요 언론사</strong> 톱기사·단독·특종을<br/>
          AI가 분석·정리해 매일 아침 전달합니다.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
          <input placeholder="이메일 주소를 입력하세요"
            style={{ border:`2px solid ${B}`, borderRadius:8, padding:"13px 16px", fontSize:15, width:"100%", maxWidth:320, boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}/>
          <button style={{ background:B, color:Y, border:"none", padding:"13px 24px", borderRadius:8, fontWeight:800, fontSize:15, cursor:"pointer", width:"100%", maxWidth:320, minHeight:48 }}>
            무료 구독하기
          </button>
        </div>
        <p style={{ marginTop:12, fontSize:11, color:"#aaa" }}>무료 · 광고 없음 · 언제든 해지 가능</p>
      </section>

      {/* Stats */}
      <section style={{ background:B, padding:"0 16px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", maxWidth:480, margin:"0 auto" }}>
          {[
            { n:"18개", l:"모니터링 언론사" },
            { n:"07:10", l:"매일 자동 발송" },
            { n:"5개", l:"뉴스 분야" },
            { n:"100%", l:"AI 팩트체크" },
          ].map((s,i) => (
            <div key={i} style={{ padding:"20px 12px", textAlign:"center", borderRight: i%2===0 ? "1px solid #2a2a2a" : "none", borderBottom: i<2 ? "1px solid #2a2a2a" : "none" }}>
              <div style={{ fontSize:22, fontWeight:900, color: i%2===0 ? Y : S, letterSpacing:-1 }}>{s.n}</div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:"52px 16px", background:"#fafafa", borderTop:`2px solid ${B}`, borderBottom:`2px solid ${B}` }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <Badge variant="blue">왜 Daily View인가</Badge>
          <h2 style={{ fontSize:22, fontWeight:900, marginTop:12, letterSpacing:-.8 }}>기자를 위한, 기자에 의한 브리핑</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:480, margin:"0 auto" }}>
          {[
            { icon:"⚡", t:"매일 07:10 자동", d:"출근 전 뉴스 파악", c:Y },
            { icon:"📡", t:"18개사 동시 분석", d:"1·2그룹 전수 모니터링", c:S },
            { icon:"🚨", t:"단독·속보 별도", d:"중요 기사 즉시 분리", c:"#FF3B30" },
            { icon:"📂", t:"유사기사 자동 묶음", d:"중복 없이 핵심만", c:S },
          ].map((f,i) => (
            <div key={i} style={{ background:"#fff", border:`1.5px solid ${B}`, borderRadius:10, padding:"18px 14px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:f.c }}/>
              <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:4 }}>{f.t}</div>
              <div style={{ color:"#777", fontSize:12, lineHeight:1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Coverage */}
      <section style={{ padding:"52px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <Badge variant="blue">커버리지</Badge>
          <h2 style={{ fontSize:20, fontWeight:900, marginTop:10, marginBottom:20, letterSpacing:-.8 }}>18개 언론사 전수 모니터링</h2>
          <div style={{ border:`2px solid ${B}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ background:Y, padding:"12px 16px", borderBottom:`2px solid ${B}` }}>
              <span style={{ fontWeight:800, fontSize:13 }}>1그룹</span>
              <span style={{ fontSize:11, color:"#555", marginLeft:8 }}>— 톱기사 상세 분석</span>
            </div>
            <div style={{ padding:"14px 16px", display:"flex", flexWrap:"wrap", gap:6, borderBottom:`2px solid ${B}` }}>
              {G1.map(m => <span key={m} style={{ border:`1.5px solid ${B}`, borderRadius:6, padding:"5px 10px", fontSize:12, fontWeight:700 }}>{m}</span>)}
            </div>
            <div style={{ background:S, padding:"12px 16px", borderBottom:`2px solid ${B}` }}>
              <span style={{ fontWeight:800, fontSize:13, color:"#fff" }}>2그룹</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginLeft:8 }}>— 단독·특종 위주</span>
            </div>
            <div style={{ padding:"14px 16px", display:"flex", flexWrap:"wrap", gap:6 }}>
              {G2.map(m => <span key={m} style={{ border:`1.5px solid #ccc`, borderRadius:6, padding:"5px 10px", fontSize:12, color:"#555" }}>{m}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"56px 20px", textAlign:"center", borderTop:`2px solid ${B}`, background:"#fafafa" }}>
        <Badge variant="blue">지금 시작하세요</Badge>
        <h2 style={{ fontSize:26, fontWeight:900, margin:"14px 0 10px", letterSpacing:-1 }}>
          뉴스 걱정 없이<br/>
          <span style={{ color:S }}>하루를 시작하세요.</span>
        </h2>
        <p style={{ color:"#666", marginBottom:28, fontSize:14 }}>매일 아침 07:10, Daily View가 대신 읽어드립니다.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
          <button onClick={onOpen} style={{ background:B, color:Y, border:"none", padding:"15px 32px", borderRadius:8, fontWeight:900, fontSize:15, cursor:"pointer", width:"100%", maxWidth:320, minHeight:52 }}>
            브리핑 앱 사용하기 →
          </button>
          <button style={{ background:"#fff", color:B, border:`2px solid ${B}`, padding:"14px 32px", borderRadius:8, fontWeight:800, fontSize:15, cursor:"pointer", width:"100%", maxWidth:320, minHeight:52 }}>
            이메일 구독하기
          </button>
        </div>
      </section>

      <footer style={{ background:B, padding:"20px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <Logo size={22}/>
        <span style={{ fontSize:11, color:"#555" }}>© 2026 Daily View.</span>
        <div style={{ display:"flex", gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:Y }}/>
          <div style={{ width:7, height:7, borderRadius:"50%", background:S }}/>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#444" }}/>
        </div>
      </footer>
    </div>
  );
}

export default function Root() {
  const [view, setView] = useState("landing");
  return view === "app"
    ? <BriefingApp onBack={() => setView("landing")} />
    : <Landing onOpen={() => setView("app")} />;
}
