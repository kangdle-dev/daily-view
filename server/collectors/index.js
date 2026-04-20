import { collectCustomSource } from "./custom.js";
import { getCustomSources } from "../feedStore.js";
import { getArticleUrls } from "../articleStore.js";

/** 커스텀 소스만 사용 (모든 소스는 커스텀) */
async function getActiveSources() {
  const customs = await getCustomSources();
  const customMap = {};
  for (const cs of customs) {
    customMap[cs.key] = {
      key:  cs.key,
      name: cs.name,
      fn:   (skipUrls) => collectCustomSource(cs.key, skipUrls),
    };
  }
  return customMap;
}

/**
 * 지정한 소스(들) 수집
 * @param {"all"|string} source
 * @param {Function|null} onProgress  - SSE 진행상황 콜백
 */
export async function collectAll(source = "all", onProgress = null) {
  const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  // 오늘 이미 수집된 URL Set (중복 스킵용)
  const skipUrls = await getArticleUrls(todayDate);

  const allSources = await getActiveSources();

  const targets = source === "all"
    ? Object.values(allSources)
    : allSources[source] ? [allSources[source]] : [];

  const total = targets.length;
  if (onProgress) onProgress({ type: "init", total, sources: targets.map(s => ({ key: s.key, name: s.name })) });

  const results = {};
  for (let i = 0; i < targets.length; i++) {
    const s = targets[i];
    console.log(`\n${"─".repeat(40)}`);
    console.log(`[collect] ${s.name} 수집 시작`);
    console.log("─".repeat(40));

    if (onProgress) onProgress({ type: "start", source: s.key, name: s.name, index: i, total });

    try {
      results[s.key] = await s.fn(skipUrls);
      const count = typeof results[s.key] === "object"
        ? (results[s.key].added ?? results[s.key].total ?? 0)
        : 0;
      console.log(`[collect] ${s.name} 완료 → 신규 ${count}건`);
      if (onProgress) onProgress({ type: "done", source: s.key, name: s.name, count, index: i, total });
    } catch (err) {
      console.error(`[collect] ${s.name} 오류:`, err.message);
      if (onProgress) onProgress({ type: "error", source: s.key, name: s.name, error: err.message, index: i, total });
      results[s.key] = [];
    }
  }

  if (onProgress) onProgress({
    type: "complete",
    results: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, typeof v === "object" ? (v.added ?? 0) : 0])
    ),
  });
  return results;
}
