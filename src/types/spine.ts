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
  /** Raw `.atlas` text for tooling (atlas analysis). */
  atlasText: string;
  atlasFileName: string;
  skeletonFileName: string;
}

export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
}

export interface BenchmarkResult {
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
}

export type BenchmarkUiState =
  | { status: "idle" }
  | { status: "running"; progress: number }
  | { status: "done"; result: BenchmarkResult };

export type PlaybackMode = "loop" | "once";
