import type { Spine } from "@esotericsoftware/spine-pixi-v8";

export interface SpineAssetBundle {
  id: string;
  name: string;
  skeletonFile: File;
  atlasFile: File;
  textureFiles: File[];
}

export interface SpineModel {
  id: string;
  name: string;
  spine: Spine;
  animations: string[];
  skins: string[];
  /** Raw `.atlas` text for tooling (atlas analysis / draw-call estimate). */
  atlasText: string;
  atlasFileName: string;
  skeletonFileName: string;
  /** Asset aliases used by Spine.from (for stress clones). */
  skeletonAlias: string;
  atlasAlias: string;
  /** Wall time to load + create this model (ms). */
  loadTimeMs: number;
}

export interface PerformanceSnapshot {
  /** Instantaneous ticker FPS. */
  fps: number;
  /** Instantaneous frame time (ms). */
  frameTimeMs: number;
  /** Rolling median of Pixi `ticker.FPS` (same source as the HUD). */
  avgFps: number;
  /** Rolling median frame time from `elapsedMS` (ms). */
  avgFrameTimeMs: number;
  /** Rolling p95 frame time (ms). */
  p95FrameTimeMs: number;
  /** Approx. animation / world-update cost this frame (ms). */
  animationUpdateMs: number;
  /** Approx. GPU/render cost this frame (ms). */
  renderMs: number;
  /** JS heap used when available (Chrome), else null. */
  memoryBytes: number | null;
}

export interface BenchmarkResult {
  id: string;
  capturedAt: number;
  skeletonCount: number;
  frameCount: number;
  wallDurationMs: number;
  meanFps: number;
  frameTimeMs: {
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  };
  animationUpdateMs: { mean: number };
  renderMs: { mean: number };
  /** Estimated draw calls × skeleton count (atlas batch estimate). */
  drawCalls: number | null;
  memoryBytes: number | null;
}

export type BenchmarkUiState =
  | { status: "idle" }
  | { status: "running"; progress: number; skeletonCount: number }
  | { status: "done"; result: BenchmarkResult };

export type PlaybackMode = "loop" | "once";
