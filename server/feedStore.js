/**
 * @file feedStore.js
 * RSS 피드 소스 관리 — Redis "feeds:all" 키에 TTL 없이 영구 저장
 * Redis 미연결 시 data/feeds.json 파일로 폴백
 * 스키마: { sources: [{ id, key, name, feeds: [{ url, mainCategory }] }] }
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { get as redisGet, set as redisSet, isRedisAvailable } from "./redisStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEEDS_PATH = path.join(__dirname, "../data/feeds.json");
const REDIS_KEY = "feeds:all";

function readFile() {
  try { return JSON.parse(fs.readFileSync(FEEDS_PATH, "utf-8")); }
  catch { return { sources: [] }; }
}

function writeFile(data) {
  fs.writeFileSync(FEEDS_PATH, JSON.stringify(data, null, 2));
}

async function getData() {
  if (isRedisAvailable()) {
    const data = await redisGet(REDIS_KEY);
    return data || { sources: [] };
  }
  return readFile();
}

async function saveData(data) {
  if (isRedisAvailable()) {
    await redisSet(REDIS_KEY, data, 0); // TTL 0 = 영구 저장
  } else {
    writeFile(data);
  }
}

/** 전체 RSS 소스 목록 반환 */
export async function getCustomSources() {
  const data = await getData();
  return data.sources || [];
}

/** 새 RSS 소스 추가 — key 중복 시 에러 */
export async function addCustomSource({ name, key, feeds }) {
  const data = await getData();
  if (data.sources.some(s => s.key === key)) {
    throw new Error(`키 '${key}'가 이미 존재합니다`);
  }
  const source = {
    id: Date.now().toString(),
    key,
    name,
    feeds: feeds || [],
    createdAt: new Date().toISOString(),
  };
  data.sources.push(source);
  await saveData(data);
  return source;
}

/** id로 소스 수정 — 전달된 필드만 변경 */
export async function updateCustomSource(id, { name, key, feeds }) {
  const data = await getData();
  const idx = data.sources.findIndex(s => s.id === id);
  if (idx === -1) throw new Error("소스를 찾을 수 없습니다");
  const updated = { ...data.sources[idx], updatedAt: new Date().toISOString() };
  if (name !== undefined) updated.name = name;
  if (key !== undefined) updated.key = key;
  if (feeds !== undefined) updated.feeds = feeds;
  data.sources[idx] = updated;
  await saveData(data);
  return data.sources[idx];
}

/** id로 소스 삭제 */
export async function removeCustomSource(id) {
  const data = await getData();
  data.sources = data.sources.filter(s => s.id !== id);
  await saveData(data);
}
