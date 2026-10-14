import type { Application } from "pixi.js";
import type { PerformanceSnapshot } from "../types";

const ROLLING_WINDOW = 120;

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const weight = rank - low;
  return sorted[low]! * (1 - weight) + sorted[high]! * weight;
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
      this.fps = ticker.FPS;
      this.frameTimeMs = ticker.deltaMS;
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

    // High priority: mark start of update phase.
    this.app.ticker.add(onTickStart, undefined, 100);
    // Default priority: sample after other updaters (incl. Spine autoUpdate).
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
    const n = this.frameTimes.length;
    let sum = 0;
    for (const v of this.frameTimes) sum += v;
    const avgFrameTimeMs = n > 0 ? sum / n : this.frameTimeMs;
    const avgFps = avgFrameTimeMs > 0 ? 1000 / avgFrameTimeMs : 0;
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
