import type { Application } from "pixi.js";
import type { PerformanceSnapshot } from "../types/spine";

export interface IPerformanceMonitor {
  getSnapshot(): PerformanceSnapshot;
  stop(): void;
}

export class PerformanceMonitor implements IPerformanceMonitor {
  private fps = 0;
  private frameTimeMs = 0;
  private unsubscribe: (() => void) | null = null;
  private app: Application;

  public constructor(app: Application) {
    this.app = app;

    const tick = () => {
      const ticker = this.app.ticker;
      this.fps = ticker.FPS;
      this.frameTimeMs = ticker.deltaMS;
    };

    this.app.ticker.add(tick);
    this.unsubscribe = () => this.app.ticker.remove(tick);
  }

  public getSnapshot(): PerformanceSnapshot {
    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
    };
  }

  public stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
