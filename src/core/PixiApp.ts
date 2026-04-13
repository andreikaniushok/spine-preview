import { Application, Container } from "pixi.js";

export interface IAppRenderer {
  readonly app: Application;
  readonly stageRoot: Container;
  initialize(host: HTMLElement): Promise<void>;
  resize(width: number, height: number): void;
  destroy(): void;
}

export class PixiApp implements IAppRenderer {
  public readonly app = new Application();
  public readonly stageRoot = new Container();

  public async initialize(host: HTMLElement): Promise<void> {
    await this.app.init({
      background: "#111317",
      antialias: true,
      resizeTo: host,
    });

    host.innerHTML = "";
    host.appendChild(this.app.canvas);
    this.app.stage.addChild(this.stageRoot);
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
