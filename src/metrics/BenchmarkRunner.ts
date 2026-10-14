import { summarizeBenchmark } from "../analytics";
import type { BenchmarkResult } from "../types";
import type { FrameSample } from "./PerformanceMonitor";

const PROGRESS_EMIT_INTERVAL_MS = 120;

export type BenchmarkTickResult =
  | { kind: "idle" }
  | { kind: "running"; progress: number; shouldEmitProgress: boolean }
  | { kind: "finished"; result: BenchmarkResult };

export interface BenchmarkStartOptions {
  durationSec: number;
  skeletonCount: number;
  /** Per-instance draw-call estimate; multiplied by skeletonCount. */
  drawCallsPerSkeleton: number | null;
}

export interface IBenchmarkRunner {
  readonly isActive: boolean;
  start(options: BenchmarkStartOptions): boolean;
  requestStop(): void;
  reset(): void;
  tick(sample: FrameSample, now?: number): BenchmarkTickResult;
}

/** Owns frame sampling and run lifecycle; React-free. */
export class BenchmarkRunner implements IBenchmarkRunner {
  private active = false;
  private durationMs = 10_000;
  private skeletonCount = 1;
  private drawCallsPerSkeleton: number | null = null;
  private frameTimes: number[] = [];
  private animationUpdates: number[] = [];
  private renders: number[] = [];
  private lastMemory: number | null = null;
  private startAt = 0;
  private stopRequested = false;
  private lastProgressEmit = 0;

  public get isActive(): boolean {
    return this.active;
  }

  /** Returns false if a run is already in progress. */
  public start(options: BenchmarkStartOptions): boolean {
    if (this.active) {
      return false;
    }
    this.active = true;
    this.durationMs = Math.max(1, options.durationSec) * 1000;
    this.skeletonCount = Math.max(1, options.skeletonCount);
    this.drawCallsPerSkeleton = options.drawCallsPerSkeleton;
    this.frameTimes = [];
    this.animationUpdates = [];
    this.renders = [];
    this.lastMemory = null;
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
    this.frameTimes = [];
    this.animationUpdates = [];
    this.renders = [];
    this.lastProgressEmit = 0;
  }

  /** Call once per Pixi tick while the preview is alive. */
  public tick(sample: FrameSample, now: number = performance.now()): BenchmarkTickResult {
    if (!this.active) {
      return { kind: "idle" };
    }

    this.frameTimes.push(sample.frameTimeMs);
    this.animationUpdates.push(sample.animationUpdateMs);
    this.renders.push(sample.renderMs);
    this.lastMemory = sample.memoryBytes;

    const elapsed = now - this.startAt;
    const progress = Math.min(1, elapsed / this.durationMs);
    const shouldEmitProgress = now - this.lastProgressEmit > PROGRESS_EMIT_INTERVAL_MS;
    if (shouldEmitProgress) {
      this.lastProgressEmit = now;
    }

    if (elapsed >= this.durationMs || this.stopRequested) {
      const drawCalls =
        this.drawCallsPerSkeleton == null
          ? null
          : this.drawCallsPerSkeleton * this.skeletonCount;
      const result = summarizeBenchmark({
        frameTimeMs: this.frameTimes,
        animationUpdateMs: this.animationUpdates,
        renderMs: this.renders,
        wallDurationMs: elapsed,
        skeletonCount: this.skeletonCount,
        drawCalls,
        memoryBytes: this.lastMemory,
      });
      this.reset();
      return { kind: "finished", result };
    }

    return { kind: "running", progress, shouldEmitProgress };
  }
}
