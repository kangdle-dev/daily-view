import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { get as redisGet, set as redisSet, del as redisDel, isRedisAvailable } from "./redisStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEEDS_FILE = path.join(__dirname, "..", "data", "feeds.json");
const REDIS_KEY = "feeds:all";

async function read() {
  try {
    const raw = await fs.readFile(FEEDS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { sources: [] };
  }
}

async function write(data) {
  await fs.mkdir(path.dirname(FEEDS_FILE), { recursive: true });
  await fs.writeFile(FEEDS_FILE, JSON.stringify(data, null, 2), "utf-8");
  // Redis 캐시 업데이트
  if (isRedisAvailable()) {
    await redisSet(REDIS_KEY, data);
  }
}

export async function getCustomSources() {
  // Redis 캐시 먼저 확인
  if (isRedisAvailable()) {
    const cached = await redisGet(REDIS_KEY);
    if (cached) {
      return cached.sources || [];
    }
  }
  // Redis 없거나 캐시 미스 → 파일에서 읽기
  const data = await read();
  // 파일에서 읽은 후 Redis에 저장
  if (isRedisAvailable()) {
    await redisSet(REDIS_KEY, data);
  }
  return data.sources || [];
}

export async function addCustomSource({ name, key, feeds }) {
  const data = await read();
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
  await write(data);
  return source;
}

export async function updateCustomSource(id, { name, key, feeds }) {
  const data = await read();
  const idx = data.sources.findIndex(s => s.id === id);
  if (idx === -1) throw new Error("소스를 찾을 수 없습니다");
  const updated = { ...data.sources[idx], updatedAt: new Date().toISOString() };
  if (name !== undefined) updated.name = name;
  if (key !== undefined) updated.key = key;
  if (feeds !== undefined) updated.feeds = feeds;
  data.sources[idx] = updated;
  await write(data);
  return data.sources[idx];
}

export async function removeCustomSource(id) {
  const data = await read();
  data.sources = data.sources.filter(s => s.id !== id);
  await write(data);
  // Redis 캐시 무효화
  if (isRedisAvailable()) {
    await redisDel(REDIS_KEY);
  }
}
