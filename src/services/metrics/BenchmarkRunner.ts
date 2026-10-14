import { summarizeBenchmark } from "../../analysis/benchmarkStats";
import type { BenchmarkResult } from "../../types/spine";

const PROGRESS_EMIT_INTERVAL_MS = 120;

export type BenchmarkTickResult =
  | { kind: "idle" }
  | { kind: "running"; progress: number; shouldEmitProgress: boolean }
  | { kind: "finished"; result: BenchmarkResult };

export interface IBenchmarkRunner {
  readonly isActive: boolean;
  start(durationSec: number): boolean;
  requestStop(): void;
  reset(): void;
  tick(frameTimeMs: number, now?: number): BenchmarkTickResult;
}

/** Owns frame-time sampling and run lifecycle; React-free. */
export class BenchmarkRunner implements IBenchmarkRunner {
  private active = false;
  private durationMs = 10_000;
  private samples: number[] = [];
  private startAt = 0;
  private stopRequested = false;
  private lastProgressEmit = 0;

  public get isActive(): boolean {
    return this.active;
  }

  /** Returns false if a run is already in progress. */
  public start(durationSec: number): boolean {
    if (this.active) {
      return false;
    }
    this.active = true;
    this.durationMs = Math.max(1, durationSec) * 1000;
    this.samples = [];
    this.startAt = performance.now();
    this.stopRequested = false;
    this.lastProgressEmit = 0;
    return true;
  }

  public requestStop(): void {
    if (!this.active) {
      return;
    }
    this.stopRequested = true;
  }

  public reset(): void {
    this.active = false;
    this.stopRequested = false;
    this.samples = [];
    this.lastProgressEmit = 0;
  }

  /** Call once per Pixi tick while the preview is alive. */
  public tick(frameTimeMs: number, now: number = performance.now()): BenchmarkTickResult {
    if (!this.active) {
      return { kind: "idle" };
    }

    this.samples.push(frameTimeMs);
    const elapsed = now - this.startAt;
    const progress = Math.min(1, elapsed / this.durationMs);
    const shouldEmitProgress = now - this.lastProgressEmit > PROGRESS_EMIT_INTERVAL_MS;
    if (shouldEmitProgress) {
      this.lastProgressEmit = now;
    }

    if (elapsed >= this.durationMs || this.stopRequested) {
      const result = summarizeBenchmark(this.samples, elapsed);
      this.reset();
      return { kind: "finished", result };
    }

    return { kind: "running", progress, shouldEmitProgress };
  }
}
