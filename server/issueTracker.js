/**
 * @file issueTracker.js
 * 최근 N일 리포트 TOP10을 비교해 동일 이슈가 반복되는 항목을 추적
 * Jaccard 유사도 ≥ 0.28 이면 동일 이슈로 판단
 */
import { getReport } from "./reportStore.js";

const SIMILARITY_THRESHOLD = 0.28;

const STOPWORDS = new Set([
  "이","가","은","는","을","를","의","에","로","으로","와","과","도","만","에서",
  "부터","까지","에게","한","하는","하고","하여","하면","했","한다","된","되는",
  "있는","있다","없는","없다","위해","통해","대해","관련","대한","통한","따른",
  "및","또","그","이후","이전","당시","오는","지난","올해","내년","올","지","수",
  "것","등","들","더","이번","이날","오늘","어제","지금","다시","모든","각","약",
]);

function extractKeywords(title) {
  return title
    .replace(/\[.*?\]|\(.*?\)|【.*?】|<.*?>/g, "")
    .split(/[\s,·…·\-\/\+]+/)
    .map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

function similarity(kw1, kw2) {
  const s1 = new Set(kw1), s2 = new Set(kw2);
  const inter = [...s1].filter(k => s2.has(k)).length;
  const union = new Set([...s1, ...s2]).size;
  return union === 0 ? 0 : inter / union;
}

// 날짜 배열에서 최장 연속 일수 계산
function maxConsecutive(sortedDates) {
  if (sortedDates.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

/**
 * date 기준 최근 days일 리포트에서 반복 이슈 추출
 * @param {string} date  기준일 (YYYY-MM-DD)
 * @param {number} days  조회 일수 (기본 7)
 * @returns {Array} 반복 이슈 목록, consecutiveDays 내림차순 정렬
 */
export async function getIssueTracking(date, days = 7) {
  // 1. 날짜 범위 (기준일 포함 최근 days일)
  const dateList = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(date + "T12:00:00+09:00");
    d.setDate(d.getDate() - i);
    dateList.push(d.toISOString().slice(0, 10));
  }

  // 2. 각 날짜 TOP10 로드 → 키워드 추출
  const dailyItems = [];
  for (const d of dateList) {
    const report = await getReport(d);
    if (!report?.top10?.length) continue;
    report.top10.slice(0, 10).forEach((a, idx) => {
      dailyItems.push({
        date: d,
        rank: idx + 1,
        title: a.title,
        url: a.url,
        category: a.category || "",
        sourceName: a.sourceName || "",
        groupSize: a.groupSize || 1,
        keywords: extractKeywords(a.title),
      });
    });
  }

  // 3. O(n²) 클러스터링 — 다른 날짜 간 유사도 ≥ 임계값이면 같은 클러스터
  const n = dailyItems.length;
  const clusterId = Array(n).fill(-1);
  let nextId = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (dailyItems[i].date === dailyItems[j].date) continue;
      if (similarity(dailyItems[i].keywords, dailyItems[j].keywords) >= SIMILARITY_THRESHOLD) {
        const ci = clusterId[i], cj = clusterId[j];
        if (ci === -1 && cj === -1) {
          clusterId[i] = clusterId[j] = nextId++;
        } else if (ci === -1) {
          clusterId[i] = cj;
        } else if (cj === -1) {
          clusterId[j] = ci;
        } else if (ci !== cj) {
          // 두 클러스터 병합
          const merge = Math.min(ci, cj), keep = Math.max(ci, cj);
          for (let k = 0; k < n; k++) if (clusterId[k] === keep) clusterId[k] = merge;
        }
      }
    }
  }

  // 4. 클러스터별 집계
  const clusterMap = {};
  for (let i = 0; i < n; i++) {
    const id = clusterId[i];
    if (id === -1) continue;
    if (!clusterMap[id]) clusterMap[id] = [];
    clusterMap[id].push(dailyItems[i]);
  }

  // 5. 결과 정제 (2일 이상 등장한 이슈만)
  const results = Object.values(clusterMap)
    .filter(items => new Set(items.map(a => a.date)).size >= 2)
    .map(items => {
      const sortedDates = [...new Set(items.map(a => a.date))].sort();
      const repArticle  = items.sort((a, b) => a.date.localeCompare(b.date))[0];
      return {
        title:          repArticle.title,
        category:       repArticle.category,
        keywords:       repArticle.keywords.slice(0, 6),
        dates:          sortedDates,
        totalDays:      sortedDates.length,
        consecutiveDays: maxConsecutive(sortedDates),
        articles:       items
          .sort((a, b) => a.date.localeCompare(b.date) || a.rank - b.rank)
          .map(({ date, rank, title, url, category, sourceName, groupSize }) =>
            ({ date, rank, title, url, category, sourceName, groupSize })
          ),
      };
    })
    .sort((a, b) => b.consecutiveDays - a.consecutiveDays || b.totalDays - a.totalDays);

  return { issues: results, dateRange: { from: dateList[0], to: dateList[dateList.length - 1] } };
}
