import { MixBlend, Physics } from "@esotericsoftware/spine-core";
import type { AnimationTrack, PlaybackMode, SpineModel, TrackMix } from "../types";
import { MAX_ANIMATION_TRACKS } from "../types";

export interface PlaybackState {
  animation: string | null;
  mode: PlaybackMode;
  speed: number;
  paused: boolean;
}

export interface IAnimationController {
  readonly state: PlaybackState;
  readonly tracks: AnimationTrack[];
  readonly activeTrackId: string;
  bind(model: SpineModel | null): void;
  play(animation: string): void;
  selectTrack(trackId: string): void;
  setTrackAnimation(trackId: string, animation: string | null): void;
  setTrackMix(trackId: string, mix: TrackMix): void;
  addTrack(): boolean;
  removeTrack(trackId: string): void;
  togglePause(): void;
  reset(): void;
  setMode(mode: PlaybackMode): void;
  setSpeed(speed: number): void;
  setSkin(name: string): void;
  setAlpha(alpha: number): void;
}

function createTrack(): AnimationTrack {
  return { id: crypto.randomUUID(), animation: null, mix: "replace" };
}

export class AnimationController implements IAnimationController {
  private model: SpineModel | null = null;
  private trackList: AnimationTrack[] = [];
  public activeTrackId = "";
  public state: PlaybackState = {
    animation: null,
    mode: "loop",
    speed: 1,
    paused: false,
  };

  public constructor() {
    this.resetTrackList();
  }

  public get tracks(): AnimationTrack[] {
    return this.trackList.map((track) => ({ ...track }));
  }

  public bind(model: SpineModel | null): void {
    this.model = model;
    this.resetTrackList();
    this.state.paused = false;
    if (!this.model) {
      return;
    }
    this.model.spine.state.timeScale = this.state.speed;
    this.model.spine.state.clearTracks();
    this.model.spine.skeleton.setToSetupPose();
  }

  /** Plays `animation` on the track that is currently selected. */
  public play(animation: string): void {
    this.setTrackAnimation(this.activeTrackId, animation);
  }

  public selectTrack(trackId: string): void {
    const track = this.trackList.find((item) => item.id === trackId);
    if (!track) {
      return;
    }
    this.activeTrackId = track.id;
    this.state.animation = track.animation;
  }

  public setTrackAnimation(trackId: string, animation: string | null): void {
    if (!this.model) {
      return;
    }
    const index = this.trackList.findIndex((track) => track.id === trackId);
    if (index < 0) {
      return;
    }
    if (animation && !this.model.animations.includes(animation)) {
      return;
    }
    const current = this.trackList[index];
    if (!current) {
      return;
    }
    this.trackList[index] = { ...current, animation };
    this.activeTrackId = trackId;
    this.state.animation = animation;
    if (animation) {
      this.state.paused = false;
    }
    this.applyTrack(index);
  }

  public setTrackMix(trackId: string, mix: TrackMix): void {
    const index = this.trackList.findIndex((track) => track.id === trackId);
    if (index <= 0) {
      return;
    }
    const current = this.trackList[index];
    if (!current || current.mix === mix) {
      return;
    }
    this.trackList[index] = { ...current, mix };
    if (current.animation) {
      this.applyTrack(index);
    }
  }

  public addTrack(): boolean {
    if (!this.model || this.trackList.length >= MAX_ANIMATION_TRACKS) {
      return false;
    }
    const track = createTrack();
    this.trackList = [...this.trackList, track];
    this.activeTrackId = track.id;
    this.state.animation = null;
    return true;
  }

  public removeTrack(trackId: string): void {
    if (this.trackList.length <= 1) {
      return;
    }
    const index = this.trackList.findIndex((track) => track.id === trackId);
    if (index < 0) {
      return;
    }
    this.trackList = this.trackList.filter((track) => track.id !== trackId);
    if (this.activeTrackId === trackId) {
      const next = this.trackList[Math.min(index, this.trackList.length - 1)];
      if (next) {
        this.activeTrackId = next.id;
        this.state.animation = next.animation;
      }
    }
    this.reapplyAllFromStart();
  }

  public togglePause(): void {
    if (!this.model) {
      return;
    }
    this.state.paused = !this.state.paused;
    this.model.spine.state.timeScale = this.state.paused ? 0 : this.state.speed;
  }

  public reset(): void {
    if (!this.model || !this.trackList.some((track) => track.animation)) {
      return;
    }
    this.state.paused = false;
    this.reapplyAllFromStart();
  }

  public setMode(mode: PlaybackMode): void {
    this.state.mode = mode;
    this.reapplyAllFromStart();
  }

  public setSpeed(speed: number): void {
    this.state.speed = speed;
    if (!this.model || this.state.paused) {
      return;
    }
    this.model.spine.state.timeScale = speed;
  }

  public setSkin(name: string): void {
    if (!this.model) {
      return;
    }
    this.model.spine.skeleton.setSkinByName(name);
    this.model.spine.skeleton.setSlotsToSetupPose();
  }

  public setAlpha(alpha: number): void {
    if (!this.model) {
      return;
    }
    this.model.spine.alpha = alpha;
  }

  private resetTrackList(): void {
    const first = createTrack();
    this.trackList = [first];
    this.activeTrackId = first.id;
    this.state.animation = null;
  }

  private loop(): boolean {
    return this.state.mode === "loop";
  }

  private applyTrack(index: number): void {
    if (!this.model) {
      return;
    }
    const track = this.trackList[index];
    const state = this.model.spine.state;
    if (!track?.animation) {
      state.clearTrack(index);
    } else {
      const entry = state.setAnimation(index, track.animation, this.loop());
      if (index > 0) {
        entry.mixBlend = track.mix === "add" ? MixBlend.add : MixBlend.replace;
      }
    }
    state.timeScale = this.state.paused ? 0 : this.state.speed;
    this.poseNow();
  }

  /** Rebuild every track entry. Used when indexes shift or the loop flag changes. */
  private reapplyAllFromStart(): void {
    if (!this.model) {
      return;
    }
    const state = this.model.spine.state;
    state.clearTracks();
    this.trackList.forEach((track, index) => {
      if (!track.animation) {
        return;
      }
      const entry = state.setAnimation(index, track.animation, this.loop());
      if (index > 0) {
        entry.mixBlend = track.mix === "add" ? MixBlend.add : MixBlend.replace;
      }
    });
    state.timeScale = this.state.paused ? 0 : this.state.speed;
    this.poseNow();
  }

  private poseNow(): void {
    if (!this.model) {
      return;
    }
    const spine = this.model.spine;
    spine.skeleton.setToSetupPose();
    spine.state.apply(spine.skeleton);
    spine.skeleton.updateWorldTransform(Physics.update);
  }
}
