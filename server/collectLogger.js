import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "data", "logs");

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export async function saveCollectLog(lines) {
  if (!lines || lines.length === 0) return;
  await fs.mkdir(LOG_DIR, { recursive: true });
  const date = todayKST();
  const file = path.join(LOG_DIR, `collect-${date}.log`);
  const text = lines
    .map(l => `[${l.time}] [${l.level.toUpperCase().padEnd(5)}] ${l.message}`)
    .join("\n");
  // 구분선과 함께 기존 파일에 추가
  const sep = `\n${"─".repeat(60)}\n`;
  await fs.appendFile(file, sep + text + "\n");
  console.log = console.log; // no-op, just to ensure we don't break anything
}

export async function readCollectLog(date) {
  const file = path.join(LOG_DIR, `collect-${date}.log`);
  try {
    const text = await fs.readFile(file, "utf-8");
    return text.split("\n");
  } catch {
    return [];
  }
}
