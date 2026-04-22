import redis from "redis";

let redisClient = null;
let isConnected = false;

export async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log("[redis] REDIS_URL not set, skipping Redis initialization");
    return false;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 5000, reconnectStrategy: () => 5000 },
    });

    redisClient.on("error", (err) => {
      console.error("[redis] Connection error:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("[redis] Connected successfully");
      isConnected = true;
    });

    await redisClient.connect();
    isConnected = true;
    return true;
  } catch (err) {
    console.warn("[redis] Failed to connect:", err.message);
    isConnected = false;
    return false;
  }
}

export async function get(key) {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`[redis] get(${key}) failed:`, err.message);
    return null;
  }
}

export async function set(key, value, ttl = 3600) {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[redis] set(${key}) failed:`, err.message);
    return false;
  }
}

export async function del(key) {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn(`[redis] del(${key}) failed:`, err.message);
    return false;
  }
}

export function isRedisAvailable() {
  return isConnected && !!redisClient;
}

export async function seedData(key, defaultValue) {
  if (!isRedisAvailable()) return;
  try {
    const existing = await get(key);
    if (!existing) {
      await set(key, defaultValue, 0); // TTL 0 = 무제한
      console.log(`[redis] ${key} 초기 데이터 로드됨`);
    }
  } catch (err) {
    console.warn(`[redis] seedData(${key}) failed:`, err.message);
  }
}
