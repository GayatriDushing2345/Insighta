export interface ParsedDataset {
  columns: string[];
  rows: Record<string, string | number | null>[];
  rowCount: number;
}

export interface DataStatistics {
  rowCount: number;
  columnCount: number;
  columns: string[];
  numericStats: Record<string, NumericColumnStats>;
  categoricalStats: Record<string, CategoricalColumnStats>;
  missingValues: Record<string, number>;
  trends: TrendData[];
}

interface NumericColumnStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  sum: number;
  stdDev: number;
  growthRate: number | null;
}

interface CategoricalColumnStats {
  unique: number;
  topValues: { value: string; count: number }[];
}

interface TrendData {
  column: string;
  values: number[];
  label: string;
}

function parseCSV(raw: string): ParsedDataset {
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return { columns: [], rows: [], rowCount: 0 };
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string | number | null>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string | number | null> = {};
    headers.forEach((col, idx) => {
      const val = values[idx] ?? "";
      if (val === "" || val === "null" || val === "N/A") {
        row[col] = null;
      } else {
        const num = Number(val);
        row[col] = isNaN(num) ? val : num;
      }
    });
    rows.push(row);
  }

  return { columns: headers, rows, rowCount: rows.length };
}

function parseJSON(raw: string): ParsedDataset {
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    if (arr.length === 0) return { columns: [], rows: [], rowCount: 0 };

    const columns = Object.keys(arr[0]);
    const rows = arr.map((item: Record<string, unknown>) => {
      const row: Record<string, string | number | null> = {};
      columns.forEach((col) => {
        const v = item[col];
        if (v === null || v === undefined) row[col] = null;
        else if (typeof v === "number") row[col] = v;
        else row[col] = String(v);
      });
      return row;
    });

    return { columns, rows, rowCount: rows.length };
  } catch {
    return { columns: [], rows: [], rowCount: 0 };
  }
}

function calcMedian(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcStdDev(nums: number[], mean: number): number {
  if (nums.length === 0) return 0;
  const variance =
    nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / nums.length;
  return Math.sqrt(variance);
}

export function processDataset(raw: string, fileType: string): DataStatistics {
  const parsed =
    fileType === "json" ? parseJSON(raw) : parseCSV(raw);

  const { columns, rows, rowCount } = parsed;

  const numericStats: Record<string, NumericColumnStats> = {};
  const categoricalStats: Record<string, CategoricalColumnStats> = {};
  const missingValues: Record<string, number> = {};
  const trends: TrendData[] = [];

  columns.forEach((col) => {
    const values = rows.map((r) => r[col]);
    const missing = values.filter((v) => v === null).length;
    missingValues[col] = missing;

    const nums = values.filter((v): v is number => typeof v === "number");

    if (nums.length > rows.length * 0.5) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = nums.length > 0 ? sum / nums.length : 0;
      const median = calcMedian(nums);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const stdDev = calcStdDev(nums, mean);

      let growthRate: number | null = null;
      if (nums.length >= 2) {
        const first = nums[0];
        const last = nums[nums.length - 1];
        if (first !== 0) {
          growthRate = ((last - first) / Math.abs(first)) * 100;
        }
      }

      numericStats[col] = { mean, median, min, max, sum, stdDev, growthRate };

      if (nums.length > 1) {
        trends.push({ column: col, values: nums.slice(0, 20), label: col });
      }
    } else {
      const strValues = values.filter((v): v is string => typeof v === "string");
      const freq: Record<string, number> = {};
      strValues.forEach((v) => {
        freq[v] = (freq[v] ?? 0) + 1;
      });
      const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      categoricalStats[col] = { unique: Object.keys(freq).length, topValues };
    }
  });

  return {
    rowCount,
    columnCount: columns.length,
    columns,
    numericStats,
    categoricalStats,
    missingValues,
    trends,
  };
}

export function buildDataSummary(stats: DataStatistics): string {
  const numCols = Object.keys(stats.numericStats).join(", ") || "none";
  const catCols = Object.keys(stats.categoricalStats).join(", ") || "none";

  const growthInfo = Object.entries(stats.numericStats)
    .filter(([, s]) => s.growthRate !== null)
    .map(([col, s]) => `${col}: ${s.growthRate!.toFixed(1)}%`)
    .join(", ");

  return `
Dataset Summary:
- Rows: ${stats.rowCount}
- Columns: ${stats.columnCount} (${stats.columns.join(", ")})
- Numeric columns: ${numCols}
- Categorical columns: ${catCols}
${growthInfo ? `- Growth rates: ${growthInfo}` : ""}
  `.trim();
}

export { parseCSV, parseJSON };
