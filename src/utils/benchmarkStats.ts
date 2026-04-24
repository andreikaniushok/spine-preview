import type { BenchmarkResult } from "../types/spine";

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  if (sorted.length === 1) {
    return sorted[0]!;
  }
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const weight = rank - low;
  return sorted[low]! * (1 - weight) + sorted[high]! * weight;
}

export function summarizeBenchmark(
  frameTimeMsSamples: readonly number[],
  wallDurationMs: number,
): BenchmarkResult {
  const n = frameTimeMsSamples.length;
  if (n === 0) {
    return {
      frameCount: 0,
      wallDurationMs,
      meanFps: 0,
      frameTimeMs: { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 },
    };
  }

  const sorted = [...frameTimeMsSamples].sort((a, b) => a - b);
  let sum = 0;
  for (const v of frameTimeMsSamples) {
    sum += v;
  }
  const mean = sum / n;
  const meanFps = mean > 0 ? 1000 / mean : 0;

  return {
    frameCount: n,
    wallDurationMs,
    meanFps,
    frameTimeMs: {
      min: sorted[0]!,
      max: sorted[n - 1]!,
      mean,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    },
  };
}
