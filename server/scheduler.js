import cron from "node-cron";
import { generateBriefing } from "./generate.js";
import { saveBriefing, getBriefing } from "./store.js";
import { getSettings } from "./settingsStore.js";
import { sendTelegramMessage } from "./telegramService.js";
import { collectAll } from "./collectors/index.js";

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

async function runDailyCollection() {
  const date = todayStr();
  const startTime = new Date();
  console.log(`[scheduler] 자동 수집 시작 — ${date} ${startTime.toLocaleTimeString("ko-KR")}`);

  try {
    const results = await collectAll("all");
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const totalArticles = Object.values(results).reduce((sum, r) => {
      return sum + (typeof r === "object" ? (r.added ?? r.total ?? 0) : 0);
    }, 0);

    const message = `✅ <b>뉴스 수집 완료</b>
📊 ${totalArticles}개 기사 수집됨
⏰ ${date} ${endTime.toLocaleTimeString("ko-KR")}
⚡ ${duration}초`;

    console.log(`[scheduler] 수집 완료 — ${totalArticles}개 기사 (${duration}초)`);
    await sendTelegramMessage(message);
  } catch (err) {
    console.error(`[scheduler] 수집 오류:`, err.message);
    const message = `❌ <b>뉴스 수집 실패</b>
⚠️ ${err.message}
⏰ ${new Date().toLocaleTimeString("ko-KR")}`;
    await sendTelegramMessage(message);
  }
}

let briefingTask = null;
let collectionTask = null;

export async function startScheduler() {
  try {
    const settings = await getSettings();
    const cronExpr = `${settings.briefingMinute} ${settings.briefingHour} * * *`;

    // 기존 task 중지
    if (briefingTask) {
      briefingTask.stop();
      briefingTask = null;
    }

    // 새 시간으로 등록
    briefingTask = cron.schedule(
      cronExpr,
      () => { runDailyBriefing(); },
      { timezone: "Asia/Seoul" }
    );

    console.log(`[scheduler] 등록 완료 — 매일 ${settings.briefingHour}:${String(settings.briefingMinute).padStart(2, '0')} KST 자동 생성`);

    // 3 PM 자동 수집 (테스트용)
    if (collectionTask) {
      collectionTask.stop();
      collectionTask = null;
    }
    collectionTask = cron.schedule(
      "0 15 * * *",
      () => { runDailyCollection(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 등록 완료 — 매일 15:00 KST 자동 수집");
  } catch (err) {
    console.error(`[scheduler] 초기화 실패:`, err.message);
    // 폴백: 기본 시간으로 등록
    briefingTask = cron.schedule(
      "0 6 * * *",
      () => { runDailyBriefing(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 폴백 — 매일 06:00 KST로 등록");
  }
}

// 설정 변경 후 스케줄러 재시작
export async function restartScheduler() {
  console.log("[scheduler] 스케줄 재등록 중...");
  await startScheduler();
}

// 수동 트리거 (API에서 호출)
export { runDailyBriefing, runDailyCollection };
