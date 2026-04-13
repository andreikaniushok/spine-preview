import type { SpineModel, PlaybackMode } from "../types/spine";

export interface PlaybackState {
  animation: string | null;
  mode: PlaybackMode;
  speed: number;
  paused: boolean;
}

export interface IAnimationController {
  readonly state: PlaybackState;
  bind(model: SpineModel | null): void;
  play(animation: string): void;
  togglePause(): void;
  reset(): void;
  setMode(mode: PlaybackMode): void;
  setSpeed(speed: number): void;
  setSkin(name: string): void;
  setAlpha(alpha: number): void;
}

export class AnimationController implements IAnimationController {
  private model: SpineModel | null = null;
  public state: PlaybackState = {
    animation: null,
    mode: "loop",
    speed: 1,
    paused: false,
  };

  public bind(model: SpineModel | null): void {
    this.model = model;
    this.state.animation = null;
    this.state.paused = false;
    if (this.model) {
      this.model.spine.state.timeScale = this.state.speed;
    }
  }

  public play(animation: string): void {
    if (!this.model) {
      return;
    }
    this.state.animation = animation;
    this.state.paused = false;
    this.model.spine.state.setAnimation(0, animation, this.state.mode === "loop");
  }

  public togglePause(): void {
    if (!this.model) {
      return;
    }
    this.state.paused = !this.state.paused;
    this.model.spine.state.timeScale = this.state.paused ? 0 : this.state.speed;
  }

  public reset(): void {
    if (!this.model || !this.state.animation) {
      return;
    }
    this.model.spine.state.setAnimation(0, this.state.animation, this.state.mode === "loop");
  }

  public setMode(mode: PlaybackMode): void {
    this.state.mode = mode;
    if (this.state.animation) {
      this.play(this.state.animation);
    }
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
}
