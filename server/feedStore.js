import { get as redisGet, set as redisSet, del as redisDel, isRedisAvailable } from "./redisStore.js";

const REDIS_KEY = "feeds:all";

async function getData() {
  if (!isRedisAvailable()) {
    throw new Error("Redis 연결이 필요합니다");
  }
  const data = await redisGet(REDIS_KEY);
  return data || { sources: [] };
}

async function saveData(data) {
  if (!isRedisAvailable()) {
    throw new Error("Redis 연결이 필요합니다");
  }
  await redisSet(REDIS_KEY, data, 0); // TTL 0 = 영구 저장
}

export async function getCustomSources() {
  const data = await getData();
  return data.sources || [];
}

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

export async function removeCustomSource(id) {
  const data = await getData();
  data.sources = data.sources.filter(s => s.id !== id);
  await saveData(data);
}
