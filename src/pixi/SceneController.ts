import { Container, FederatedPointerEvent, Point } from "pixi.js";

export interface ISceneController {
  readonly viewport: Container;
  attach(host: HTMLElement): void;
  center(content: Container): void;
  centerInView(width: number, height: number): void;
  setZoom(nextZoom: number): void;
  zoomBy(delta: number): void;
  resetView(): void;
}

export class SceneController implements ISceneController {
  public readonly viewport = new Container();
  private isDragging = false;
  private dragStart = new Point(0, 0);
  private positionStart = new Point(0, 0);
  private zoom = 1;
  private minZoom = 0.2;
  private maxZoom = 5;

  public attach(host: HTMLElement): void {
    this.viewport.eventMode = "static";
    this.viewport.on("pointerdown", this.onPointerDown);
    this.viewport.on("pointerup", this.onPointerUp);
    this.viewport.on("pointerupoutside", this.onPointerUp);
    this.viewport.on("pointermove", this.onPointerMove);

    host.addEventListener("wheel", this.onWheel, { passive: false });
  }

  public center(content: Container): void {
    const bounds = content.getLocalBounds();
    content.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    content.position.set(0, 0);
    this.setZoom(1);
  }

  public centerInView(width: number, height: number): void {
    this.viewport.position.set(width / 2, height / 2);
  }

  public setZoom(nextZoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
    this.viewport.scale.set(this.zoom);
  }

  public zoomBy(delta: number): void {
    this.setZoom(this.zoom + delta);
  }

  public resetView(): void {
    this.viewport.position.set(0, 0);
    this.setZoom(1);
  }

  private onPointerDown = (event: FederatedPointerEvent): void => {
    this.isDragging = true;
    this.dragStart.copyFrom(event.global);
    this.positionStart.copyFrom(this.viewport.position);
  };

  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.global.x - this.dragStart.x;
    const deltaY = event.global.y - this.dragStart.y;
    this.viewport.position.set(this.positionStart.x + deltaX, this.positionStart.y + deltaY);
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 0.15 : -0.15;
    this.zoomBy(factor);
  };
}
