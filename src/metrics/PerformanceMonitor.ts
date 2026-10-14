import type { Application } from "pixi.js";
import type { PerformanceSnapshot } from "../types";

/** ~1s at 60fps — short enough to recover after UI hitches (e.g. opening analytics). */
const ROLLING_WINDOW = 60;

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const weight = rank - low;
  return sorted[low]! * (1 - weight) + sorted[high]! * weight;
}

/** Median — ignores rare hitch frames that pull a mean down vs the HUD. */
function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 50);
}

function readMemoryBytes(): number | null {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize?: number };
  };
  const used = perf.memory?.usedJSHeapSize;
  return typeof used === "number" && used > 0 ? used : null;
}

export interface FrameSample {
  frameTimeMs: number;
  animationUpdateMs: number;
  renderMs: number;
  memoryBytes: number | null;
}

export interface IPerformanceMonitor {
  getSnapshot(): PerformanceSnapshot;
  getLastSample(): FrameSample;
  stop(): void;
}

export class PerformanceMonitor implements IPerformanceMonitor {
  private fps = 0;
  private frameTimeMs = 0;
  private animationUpdateMs = 0;
  private renderMs = 0;
  private memoryBytes: number | null = null;
  /** Same source as the HUD (`ticker.FPS` = 1000 / elapsedMS). */
  private readonly fpsSamples: number[] = [];
  /** Raw `elapsedMS` — same basis as `ticker.FPS`, not capped `deltaMS`. */
  private readonly frameTimes: number[] = [];
  private unsubscribe: (() => void) | null = null;
  private app: Application;
  private updateStart = 0;
  private updateEnd = 0;

  public constructor(app: Application) {
    this.app = app;

    const onTickStart = () => {
      this.updateStart = performance.now();
    };

    const onTickEnd = () => {
      this.updateEnd = performance.now();
      this.animationUpdateMs = Math.max(0, this.updateEnd - this.updateStart);

      const ticker = this.app.ticker;
      // Instantaneous values: match Pixi (FPS from raw elapsedMS).
      this.fps = ticker.FPS;
      this.frameTimeMs = ticker.elapsedMS;

      this.fpsSamples.push(this.fps);
      if (this.fpsSamples.length > ROLLING_WINDOW) {
        this.fpsSamples.shift();
      }

      this.frameTimes.push(this.frameTimeMs);
      if (this.frameTimes.length > ROLLING_WINDOW) {
        this.frameTimes.shift();
      }

      this.memoryBytes = readMemoryBytes();
    };

    const postrenderListener = {
      postrender: () => {
        this.renderMs = Math.max(0, performance.now() - this.updateEnd);
      },
    };

    this.app.ticker.add(onTickStart, undefined, 100);
    this.app.ticker.add(onTickEnd);
    this.app.renderer.runners.postrender.add(postrenderListener);

    this.unsubscribe = () => {
      this.app.ticker.remove(onTickStart);
      this.app.ticker.remove(onTickEnd);
      this.app.renderer.runners.postrender.remove(postrenderListener);
    };
  }

  public getLastSample(): FrameSample {
    return {
      frameTimeMs: this.frameTimeMs,
      animationUpdateMs: this.animationUpdateMs,
      renderMs: this.renderMs,
      memoryBytes: this.memoryBytes,
    };
  }

  public getSnapshot(): PerformanceSnapshot {
    // Median FPS tracks the stable rate the HUD shows; mean is pulled down by UI hitches.
    const avgFps = this.fpsSamples.length > 0 ? median(this.fpsSamples) : this.fps;
    const avgFrameTimeMs =
      this.frameTimes.length > 0 ? median(this.frameTimes) : this.frameTimeMs;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);

    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      avgFps,
      avgFrameTimeMs,
      p95FrameTimeMs: percentile(sorted, 95),
      animationUpdateMs: this.animationUpdateMs,
      renderMs: this.renderMs,
      memoryBytes: this.memoryBytes,
    };
  }

  public stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
