import { Application, Container } from "pixi.js";

export interface IAppRenderer {
  readonly app: Application;
  readonly stageRoot: Container;
  initialize(host: HTMLElement): Promise<void>;
  resize(width: number, height: number): void;
  setBackground(color: string): void;
  destroy(): void;
}

export class PixiApp implements IAppRenderer {
  public readonly app = new Application();
  public readonly stageRoot = new Container();
  private static readonly defaultBackground = "#0d111a";

  public async initialize(host: HTMLElement): Promise<void> {
    await this.app.init({
      background: PixiApp.defaultBackground,
      antialias: true,
      resizeTo: host,
    });

    host.innerHTML = "";
    host.appendChild(this.app.canvas);
    this.setBackground(PixiApp.defaultBackground);
    this.app.stage.addChild(this.stageRoot);
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  public setBackground(color: string): void {
    this.app.renderer.background.color = color;
    this.app.canvas.style.backgroundColor = color;
  }

  public destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
