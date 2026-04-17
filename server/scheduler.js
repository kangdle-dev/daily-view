import cron from "node-cron";
import { generateBriefing } from "./generate.js";
import { saveBriefing, getBriefing } from "./store.js";

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function todayKST() {
  return new Date(
    new Date().toLocaleString("en-CA", { timeZone: "Asia/Seoul" }).split(",")[0]
  );
}

function todayStr() {
  const d = todayKST();
  return d.toISOString().split("T")[0];
}

async function runDailyBriefing() {
  const date = todayStr();
  console.log(`[scheduler] 브리핑 생성 시작 — ${date}`);

  // 이미 생성된 경우 스킵
  const existing = await getBriefing(date);
  if (existing) {
    console.log(`[scheduler] 이미 캐시됨 — ${date}, 스킵`);
    return;
  }

  try {
    const content = await generateBriefing(date);
    await saveBriefing(date, content);
    console.log(`[scheduler] 완료 — ${date} (${content.length}자)`);
  } catch (err) {
    console.error(`[scheduler] 오류 — ${date}:`, err.message);
  }
}

export function startScheduler() {
  // 매일 06:00 KST 자동 생성
  cron.schedule(
    "0 6 * * *",
    () => { runDailyBriefing(); },
    { timezone: "Asia/Seoul" }
  );

  console.log("[scheduler] 등록 완료 — 매일 06:00 KST 자동 생성");
}

// 수동 트리거 (API에서 호출)
export { runDailyBriefing };
