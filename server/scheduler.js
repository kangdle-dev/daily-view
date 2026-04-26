/**
 * @file scheduler.js
 * KST 기준 자동화 스케줄 관리
 *   - 06:00~23:50  15분 간격 기사 수집 (수집 후 리포트 캐시 삭제)
 *   - 06:00        일일 리포트 생성 캐싱
 *   - 07:00        종합 리포트 텔레그램 발송
 *   - 설정 시간    AI 브리핑 생성
 */
import cron from "node-cron";
import { generateBriefing } from "./generate.js";
import { saveBriefing, getBriefing } from "./store.js";
import { getSettings } from "./settingsStore.js";
import { sendTelegramMessage } from "./telegramService.js";
import { collectAll } from "./collectors/index.js";
import { generateReport } from "./report.js";
import { getReport, saveReport, deleteReport } from "./reportStore.js";

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

// ── 15분 간격 수집 (06:00~23:50) ──────────────────────────
/** 15분 간격 수집 실행 — 완료 후 당일 리포트 캐시 삭제 */
async function runPeriodicCollection() {
  const date = todayStr();
  const startTime = new Date();
  const timeStr = startTime.toLocaleTimeString("ko-KR");
  console.log(`[scheduler] 15분 수집 시작 — ${timeStr}`);

  try {
    const results = await collectAll("all");
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const totalArticles = Object.values(results).reduce((sum, r) => {
      return sum + (typeof r === "object" ? (r.added ?? r.total ?? 0) : 0);
    }, 0);

    console.log(`[scheduler] 15분 수집 완료 — ${totalArticles}개 기사 (${duration}초)`);

    // 수집 후 리포트 캐시 제거 (다음 요청 시 최신 기사 포함한 리포트 생성)
    await deleteReport(date);
  } catch (err) {
    console.error(`[scheduler] 15분 수집 오류:`, err.message);
  }
}

// ── 06:00 일일 리포트 생성 ──────────────────────────────────
/** 06:00 일일 리포트 생성 — 기존 캐시 삭제 후 재생성 */
async function runDailyReportGeneration() {
  const date = todayStr();
  console.log(`[scheduler] 일일 리포트 생성 시작 — ${date}`);

  try {
    // 기존 캐시 삭제 (새로 생성하도록)
    await deleteReport(date);

    // 새 리포트 생성
    const report = await generateReport(date);
    if (!report) {
      console.warn(`[scheduler] 리포트 생성 실패 — 해당 날짜 기사 없음: ${date}`);
      return;
    }

    // 리포트 캐싱
    await saveReport(date, report);
    console.log(`[scheduler] 리포트 생성 완료 — ${date} (${report.totalArticles}개 기사)`);
  } catch (err) {
    console.error(`[scheduler] 리포트 생성 오류:`, err.message);
  }
}

// ── 07:00 일일 텔레그램 발송 ────────────────────────────────
/** 07:00 종합 리포트 텔레그램 자동 발송 — 06:00 생성된 캐시 사용 */
async function runDailyTelegramSend() {
  const date = todayStr();
  console.log(`[scheduler] 텔레그램 발송 시작 — ${date}`);

  try {
    const report = await getReport(date);
    if (!report) {
      console.warn(`[scheduler] 텔레그램 발송 실패 — 리포트 없음: ${date}`);
      return;
    }

    // 메시지 포맷팅 (server/index.js의 로직 복제)
    function escapeHtml(text) {
      return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    const targetCats = ["정치", "경제", "사회", "국제", "증권·금융"].filter(c => report.categories[c]);

    let msgLines = [
      `📊 <b>뉴스 텔레그램 리포트</b>`,
      `📅 ${date}`,
      ``,
      `<b>📰 종합 주요기사</b>`,
    ];

    report.top10.slice(0, 5).forEach((a, i) => {
      msgLines.push(`${i + 1}. <a href="${a.url}">${escapeHtml(a.title)}</a>`);
    });

    msgLines.push(``, `<b>📂 카테고리별 중요기사</b>`);

    targetCats.forEach(cat => {
      const articles = report.categories[cat] || [];
      msgLines.push(``, `<b>${cat}</b>`);
      articles.slice(0, 3).forEach((a, i) => {
        msgLines.push(`${i + 1}. <a href="${a.url}">${escapeHtml(a.title)}</a>`);
      });
    });

    const message = msgLines.join("\n");

    // 텔레그램 발송
    const result = await sendTelegramMessage(message);
    if (!result) {
      throw new Error("Telegram 발송 실패");
    }

    console.log(`[scheduler] 텔레그램 발송 완료 — ${date}`);
  } catch (err) {
    console.error(`[scheduler] 텔레그램 발송 오류:`, err.message);
  }
}

// ── AI 브리핑 생성 (기존 로직) ──────────────────────────────
/** 설정된 시간에 AI 브리핑 생성 — 이미 캐시된 날짜는 스킵 */
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

let periodicCollectionTask = null;
let reportGenerationTask = null;
let telegramSendTask = null;
let briefingTask = null;

/** 모든 cron 작업 등록 — 설정 변경 시 restartScheduler()로 재등록 */
export async function startScheduler() {
  try {
    const settings = await getSettings();

    // ── 06:00~23:50 15분 간격 수집 ──────────────────────
    if (periodicCollectionTask) {
      periodicCollectionTask.stop();
      periodicCollectionTask = null;
    }
    periodicCollectionTask = cron.schedule(
      "*/15 6-23 * * *",
      () => { runPeriodicCollection(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 등록 완료 — 매일 06:00~23:50 15분 간격 자동 수집");

    // ── 06:00 일일 리포트 생성 ──────────────────────────
    if (reportGenerationTask) {
      reportGenerationTask.stop();
      reportGenerationTask = null;
    }
    reportGenerationTask = cron.schedule(
      "0 6 * * *",
      () => { runDailyReportGeneration(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 등록 완료 — 매일 06:00 KST 일일 리포트 생성");

    // ── 07:00 텔레그램 발송 ──────────────────────────────
    if (telegramSendTask) {
      telegramSendTask.stop();
      telegramSendTask = null;
    }
    telegramSendTask = cron.schedule(
      "0 7 * * *",
      () => { runDailyTelegramSend(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 등록 완료 — 매일 07:00 KST 텔레그램 발송");

    // ── 브리핑 생성 (설정된 시간) ───────────────────────
    const briefingCronExpr = `${settings.briefingMinute} ${settings.briefingHour} * * *`;
    if (briefingTask) {
      briefingTask.stop();
      briefingTask = null;
    }
    briefingTask = cron.schedule(
      briefingCronExpr,
      () => { runDailyBriefing(); },
      { timezone: "Asia/Seoul" }
    );
    console.log(`[scheduler] 등록 완료 — 매일 ${settings.briefingHour}:${String(settings.briefingMinute).padStart(2, '0')} KST AI 브리핑 생성`);
  } catch (err) {
    console.error(`[scheduler] 초기화 실패:`, err.message);
    // 폴백: 기본 시간으로 등록
    periodicCollectionTask = cron.schedule(
      "*/15 6-23 * * *",
      () => { runPeriodicCollection(); },
      { timezone: "Asia/Seoul" }
    );
    reportGenerationTask = cron.schedule(
      "0 6 * * *",
      () => { runDailyReportGeneration(); },
      { timezone: "Asia/Seoul" }
    );
    telegramSendTask = cron.schedule(
      "0 7 * * *",
      () => { runDailyTelegramSend(); },
      { timezone: "Asia/Seoul" }
    );
    briefingTask = cron.schedule(
      "0 6 * * *",
      () => { runDailyBriefing(); },
      { timezone: "Asia/Seoul" }
    );
    console.log("[scheduler] 폴백 — 기본 시간으로 등록");
  }
}

// 설정 변경 후 스케줄러 재시작
export async function restartScheduler() {
  console.log("[scheduler] 스케줄 재등록 중...");
  await startScheduler();
}

// 수동 트리거 (API에서 호출)
export {
  runPeriodicCollection,
  runDailyReportGeneration,
  runDailyTelegramSend,
  runDailyBriefing
};
