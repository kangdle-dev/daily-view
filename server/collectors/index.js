import { collectKhan } from "./khan.js";
import { collectChosun } from "./chosun.js";
import { collectNewstomato } from "./newstomato.js";
import { collectYonhap } from "./yonhap.js";
import { collectNewspim } from "./newspim.js";

export const SOURCES = {
  khan:       { key: "khan",       name: "경향신문",  fn: collectKhan },
  chosun:     { key: "chosun",     name: "조선일보",  fn: collectChosun },
  newstomato: { key: "newstomato", name: "뉴스토마토", fn: collectNewstomato },
  yonhap:     { key: "yonhap",     name: "연합뉴스",  fn: collectYonhap },
  newspim:    { key: "newspim",    name: "뉴스핌",    fn: collectNewspim },
};

/**
 * 지정한 소스(들) 수집
 * @param {"all"|"khan"|"chosun"} source
 * @param {Function|null} onProgress  - SSE 진행상황 콜백
 */
export async function collectAll(source = "all", onProgress = null) {
  const targets = source === "all"
    ? Object.values(SOURCES)
    : SOURCES[source] ? [SOURCES[source]] : [];

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
      results[s.key] = await s.fn();
      const count = Array.isArray(results[s.key]) ? results[s.key].length : 0;
      console.log(`[collect] ${s.name} 완료 → ${count}건`);
      if (onProgress) onProgress({ type: "done", source: s.key, name: s.name, count, index: i, total });
    } catch (err) {
      console.error(`[collect] ${s.name} 오류:`, err.message);
      if (onProgress) onProgress({ type: "error", source: s.key, name: s.name, error: err.message, index: i, total });
      results[s.key] = [];
    }
  }

  if (onProgress) onProgress({ type: "complete", results: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])) });
  return results;
}
