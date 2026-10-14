import type { BenchmarkResult } from "../types";

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

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export interface BenchmarkSampleInput {
  frameTimeMs: readonly number[];
  animationUpdateMs: readonly number[];
  renderMs: readonly number[];
  wallDurationMs: number;
  skeletonCount: number;
  drawCalls: number | null;
  memoryBytes: number | null;
}

export function summarizeBenchmark(input: BenchmarkSampleInput): BenchmarkResult {
  const { frameTimeMs: samples, wallDurationMs } = input;
  const n = samples.length;
  if (n === 0) {
    return {
      id: crypto.randomUUID(),
      capturedAt: Date.now(),
      skeletonCount: input.skeletonCount,
      frameCount: 0,
      wallDurationMs,
      meanFps: 0,
      frameTimeMs: { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 },
      animationUpdateMs: { mean: 0 },
      renderMs: { mean: 0 },
      drawCalls: input.drawCalls,
      memoryBytes: input.memoryBytes,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const avg = mean(samples);
  const meanFps = avg > 0 ? 1000 / avg : 0;

  return {
    id: crypto.randomUUID(),
    capturedAt: Date.now(),
    skeletonCount: input.skeletonCount,
    frameCount: n,
    wallDurationMs,
    meanFps,
    frameTimeMs: {
      min: sorted[0]!,
      max: sorted[n - 1]!,
      mean: avg,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    },
    animationUpdateMs: { mean: mean(input.animationUpdateMs) },
    renderMs: { mean: mean(input.renderMs) },
    drawCalls: input.drawCalls,
    memoryBytes: input.memoryBytes,
  };
}
