/**
 * Commit Statistics Calculator
 * Processes GitHub stats/commit_activity API response (52 weeks of data)
 * into aggregated weekly, monthly, and trend data.
 */

/**
 * Calculate commit statistics from GitHub's commit activity API response.
 *
 * @param {Array} commitActivityData - Array of 52 week objects from
 *   GET /repos/{owner}/{repo}/stats/commit_activity
 *   Each object: { week: unix_timestamp, total: number, days: number[] }
 * @returns {{
 *   weeklyCommits: Array<{week: Date, count: number}>,
 *   monthlyCommits: Array<{month: string, count: number}>,
 *   totalCommits: number,
 *   avgCommitsPerWeek: number,
 *   peakWeek: {week: Date, count: number},
 *   trend: 'increasing' | 'decreasing' | 'stable'
 * }}
 */
export function calculateCommitStats(commitActivityData) {
  if (!Array.isArray(commitActivityData) || commitActivityData.length === 0) {
    return emptyStats();
  }

  const weeklyCommits = buildWeeklyCommits(commitActivityData);
  const monthlyCommits = buildMonthlyCommits(weeklyCommits);
  const totalCommits = weeklyCommits.reduce((sum, w) => sum + w.count, 0);
  const activeWeeks = weeklyCommits.filter(w => w.count > 0);
  const avgCommitsPerWeek = weeklyCommits.length > 0
    ? totalCommits / weeklyCommits.length
    : 0;
  const peakWeek = findPeakWeek(weeklyCommits);
  const trend = detectTrend(weeklyCommits);

  return {
    weeklyCommits,
    monthlyCommits,
    totalCommits,
    avgCommitsPerWeek: Math.round(avgCommitsPerWeek * 100) / 100,
    peakWeek,
    trend,
    // Derived convenience fields for UI
    activeWeeksCount: activeWeeks.length,
    isInactiveRepo: totalCommits === 0,
  };
}

/**
 * Build weekly commit array from raw API data.
 * Filters out invalid entries; sets count to 0 for sparse/missing weeks.
 */
function buildWeeklyCommits(data) {
  return data.map(entry => {
    const ts = typeof entry.week === 'number' ? entry.week : parseInt(entry.week, 10);
    const count = typeof entry.total === 'number' && entry.total >= 0
      ? entry.total
      : 0;
    return {
      week: new Date(ts * 1000),
      count,
    };
  }).filter(w => !isNaN(w.week.getTime()));
}

/**
 * Aggregate weekly commit data into month buckets.
 * Each week is attributed to the month that contains its Monday (week start).
 *
 * @param {Array<{week: Date, count: number}>} weeklyCommits
 * @returns {Array<{month: string, count: number}>} sorted by month ascending
 */
function buildMonthlyCommits(weeklyCommits) {
  const monthMap = new Map();

  for (const { week, count } of weeklyCommits) {
    const key = formatYearMonth(week);
    monthMap.set(key, (monthMap.get(key) || 0) + count);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

/**
 * Find the week with the highest commit count.
 * Returns {week: Date, count: 0} for all-zero datasets (inactive repos).
 */
function findPeakWeek(weeklyCommits) {
  if (weeklyCommits.length === 0) {
    return { week: new Date(0), count: 0 };
  }

  let peak = weeklyCommits[0];
  for (let i = 1; i < weeklyCommits.length; i++) {
    if (weeklyCommits[i].count > peak.count) {
      peak = weeklyCommits[i];
    }
  }
  return { week: peak.week, count: peak.count };
}

/**
 * Detect commit velocity trend by comparing first 26 weeks to last 26 weeks.
 * Uses a 20% threshold to classify as increasing or decreasing; otherwise stable.
 *
 * @param {Array<{week: Date, count: number}>} weeklyCommits
 * @returns {'increasing' | 'decreasing' | 'stable'}
 */
function detectTrend(weeklyCommits) {
  if (weeklyCommits.length < 2) {
    return 'stable';
  }

  const mid = Math.floor(weeklyCommits.length / 2);
  const firstHalf = weeklyCommits.slice(0, mid);
  const secondHalf = weeklyCommits.slice(weeklyCommits.length - mid);

  const firstSum = firstHalf.reduce((s, w) => s + w.count, 0);
  const secondSum = secondHalf.reduce((s, w) => s + w.count, 0);

  // If both halves are zero, repo is inactive — stable
  if (firstSum === 0 && secondSum === 0) {
    return 'stable';
  }

  // If first half is zero but second has commits: increasing
  if (firstSum === 0) {
    return 'increasing';
  }

  // If second half is zero but first had commits: decreasing
  if (secondSum === 0) {
    return 'decreasing';
  }

  const ratio = secondSum / firstSum;
  const THRESHOLD = 0.20; // 20% change required to qualify as trend

  if (ratio >= 1 + THRESHOLD) {
    return 'increasing';
  }
  if (ratio <= 1 - THRESHOLD) {
    return 'decreasing';
  }
  return 'stable';
}

/**
 * Format a Date as 'YYYY-MM'.
 */
function formatYearMonth(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Return a zero-state stats object for empty/invalid input.
 */
function emptyStats() {
  return {
    weeklyCommits: [],
    monthlyCommits: [],
    totalCommits: 0,
    avgCommitsPerWeek: 0,
    peakWeek: { week: new Date(0), count: 0 },
    trend: 'stable',
    activeWeeksCount: 0,
    isInactiveRepo: true,
  };
}
