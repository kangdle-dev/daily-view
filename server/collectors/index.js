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
 */
export async function collectAll(source = "all") {
  const targets = source === "all"
    ? Object.values(SOURCES)
    : SOURCES[source] ? [SOURCES[source]] : [];

  const results = {};
  for (const s of targets) {
    console.log(`\n${"─".repeat(40)}`);
    console.log(`[collect] ${s.name} 수집 시작`);
    console.log("─".repeat(40));
    results[s.key] = await s.fn();
  }
  return results;
}
