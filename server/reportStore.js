import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

function reportPath(date) {
  return path.join(dataDir, `report-${date}.json`);
}

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
