import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveBriefing(date, content) {
  await ensureDir();
  const file = path.join(DATA_DIR, `briefing-${date}.json`);
  await fs.writeFile(
    file,
    JSON.stringify({ date, content, generatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

export async function getBriefing(date) {
  const file = path.join(DATA_DIR, `briefing-${date}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listDates() {
  try {
    await ensureDir();
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((f) => f.startsWith("briefing-") && f.endsWith(".json"))
      .map((f) => f.replace("briefing-", "").replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
