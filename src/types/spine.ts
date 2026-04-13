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
}

export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
}

export type PlaybackMode = "loop" | "once";
