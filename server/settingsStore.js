import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const DEFAULT_SETTINGS = {
  mainCategories: ["정치", "경제", "사회", "문화", "스포츠", "국제", "산업", "북한"],
  collectHour: 9,
  collectMinute: 0,
  collectEnabled: true,
  briefingHour: 6,
  briefingMinute: 0,
};

function read() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function write(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

export async function getSettings() {
  return read();
}

export async function saveSettings(data) {
  // Validate data
  if (!Array.isArray(data.mainCategories)) {
    throw new Error("mainCategories must be an array");
  }
  if (typeof data.collectHour !== "number" || data.collectHour < 0 || data.collectHour > 23) {
    throw new Error("collectHour must be 0-23");
  }
  if (typeof data.collectMinute !== "number" || data.collectMinute < 0 || data.collectMinute > 59) {
    throw new Error("collectMinute must be 0-59");
  }
  if (typeof data.briefingHour !== "number" || data.briefingHour < 0 || data.briefingHour > 23) {
    throw new Error("briefingHour must be 0-23");
  }
  if (typeof data.briefingMinute !== "number" || data.briefingMinute < 0 || data.briefingMinute > 59) {
    throw new Error("briefingMinute must be 0-59");
  }

  write(data);
  return data;
}
