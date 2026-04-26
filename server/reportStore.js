/**
 * @file reportStore.js
 * 리포트 캐시 — data/report-{YYYY-MM-DD}.json
 * 수집 후 캐시 삭제 → 다음 요청 시 최신 기사로 재생성
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

function reportPath(date) {
  return path.join(dataDir, `report-${date}.json`);
}

/** 날짜별 리포트 캐시 조회 — 없으면 null */
export async function getReport(date) {
  try {
    const filePath = reportPath(date);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(`[reportStore] getReport(${date}) failed:`, err.message);
    return null;
  }
}

/** 리포트를 날짜별 JSON 파일로 캐싱 */
export async function saveReport(date, report) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = reportPath(date);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`[reportStore] 리포트 캐시 저장됨 — ${date}`);
    return report;
  } catch (err) {
    console.error(`[reportStore] saveReport(${date}) failed:`, err.message);
    throw err;
  }
}

/** 날짜별 리포트 캐시 삭제 — 15분 수집 후 호출해 최신 기사 반영 */
export async function deleteReport(date) {
  try {
    const filePath = reportPath(date);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[reportStore] 리포트 캐시 삭제됨 — ${date}`);
    }
  } catch (err) {
    console.warn(`[reportStore] deleteReport(${date}) failed:`, err.message);
  }
}

/** 전체 리포트 캐시 일괄 삭제 — 수동 수집 완료 시 호출 */
export async function deleteAllReports() {
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith("report-") && f.endsWith(".json"));
    for (const file of files) {
      fs.unlinkSync(path.join(dataDir, file));
    }
    console.log(`[reportStore] 모든 리포트 캐시 삭제됨 (${files.length}개)`);
  } catch (err) {
    console.warn(`[reportStore] deleteAllReports() failed:`, err.message);
  }
}
