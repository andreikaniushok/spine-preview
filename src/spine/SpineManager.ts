import { Spine } from "@esotericsoftware/spine-pixi-v8";
import { Assets, Cache, Container } from "pixi.js";
import type { SpineAssetBundle, SpineModel } from "../types";

export interface ISpineManager {
  readonly models: SpineModel[];
  readonly stressInstanceCount: number;
  loadBundle(bundle: SpineAssetBundle): Promise<SpineModel>;
  setActiveModel(id: string): SpineModel | null;
  getActiveModel(): SpineModel | null;
  removeModel(id: string): SpineModel | null;
  /** Total visible stress instances including the active model (min 1). */
  setStressInstanceCount(total: number): number;
  clearStressInstances(): void;
}

export class SpineManager implements ISpineManager {
  private readonly layer: Container;
  private readonly modelRegistry = new Map<string, SpineModel>();
  private readonly stressCopies: Spine[] = [];
  private activeModelId: string | null = null;

  public constructor(layer: Container) {
    this.layer = layer;
  }

  public get models(): SpineModel[] {
    return [...this.modelRegistry.values()];
  }

  public get stressInstanceCount(): number {
    const active = this.getActiveModel();
    if (!active) {
      return 0;
    }
    return 1 + this.stressCopies.length;
  }

  public async loadBundle(bundle: SpineAssetBundle): Promise<SpineModel> {
    const loadStarted = performance.now();
    const baseKey = `bundle-${bundle.id}`;
    const atlasAlias = `${baseKey}-atlas`;
    const skeletonAlias = `${baseKey}-skeleton`;
    const atlasText = await bundle.atlasFile.text();
    const images = await this.createAtlasImagesMap(atlasText, bundle.textureFiles);
    const skeletonUrl = URL.createObjectURL(bundle.skeletonFile);
    const atlasUrl = URL.createObjectURL(bundle.atlasFile);

    const [atlasLoaded, skeletonLoaded] = await Promise.all([
      Assets.load({
        src: atlasUrl,
        parser: "spineTextureAtlasLoader",
        data: { images },
      }),
      Assets.load({
        src: skeletonUrl,
        parser: "spineSkeletonLoader",
      }),
    ]);

    const skeletonAssetRaw = skeletonLoaded;
    const atlasAsset = atlasLoaded;
    if (!skeletonAssetRaw) {
      throw new Error(
        `Skeleton asset is empty after load (${bundle.skeletonFile.name}). Check file format/export.`,
      );
    }
    if (!atlasAsset) {
      throw new Error(`Atlas asset is empty after load (${bundle.atlasFile.name}).`);
    }

    const normalizedSkeletonAsset = this.normalizeSkeletonAsset(
      skeletonAssetRaw,
      bundle.skeletonFile.name,
    );
    Cache.set(skeletonAlias, normalizedSkeletonAsset);
    Cache.set(atlasAlias, atlasAsset);

    let spine: Spine;
    try {
      spine = Spine.from({ skeleton: skeletonAlias, atlas: atlasAlias, autoUpdate: true });
    } catch (error) {
      const details =
        error instanceof Error
          ? error.message
          : "Unknown Spine runtime error while creating model.";
      throw new Error(
        `Spine.from failed for "${bundle.skeletonFile.name}" + "${bundle.atlasFile.name}": ${details}`,
      );
    }
    spine.visible = false;

    const model: SpineModel = {
      id: bundle.id,
      name: bundle.name,
      spine,
      animations: spine.skeleton.data.animations.map((item) => item.name),
      skins: spine.skeleton.data.skins.map((item) => item.name),
      atlasText,
      atlasFileName: bundle.atlasFile.name,
      skeletonFileName: bundle.skeletonFile.name,
      skeletonAlias,
      atlasAlias,
      loadTimeMs: performance.now() - loadStarted,
    };

    this.layer.addChild(spine);
    this.modelRegistry.set(model.id, model);

    if (this.activeModelId === null) {
      this.setActiveModel(model.id);
    }

    return model;
  }

  /**
   * Spawns extra clones of the active model so that `total` spines are updating.
   * Returns the actual instance count after clamping.
   */
  public setStressInstanceCount(total: number): number {
    const active = this.getActiveModel();
    if (!active) {
      this.clearStressInstances();
      return 0;
    }

    const targetExtra = Math.max(0, Math.floor(total) - 1);
    while (this.stressCopies.length > targetExtra) {
      const spine = this.stressCopies.pop();
      if (spine) {
        this.layer.removeChild(spine);
        spine.destroy();
      }
    }

    while (this.stressCopies.length < targetExtra) {
      const clone = Spine.from({
        skeleton: active.skeletonAlias,
        atlas: active.atlasAlias,
        autoUpdate: true,
      });
      clone.visible = true;
      // Offset slightly so clones are not perfectly stacked.
      const i = this.stressCopies.length + 1;
      clone.x = (i % 5) * 24;
      clone.y = Math.floor(i / 5) * 24;
      if (active.spine.state.tracks[0]?.animation) {
        const anim = active.spine.state.tracks[0].animation;
        clone.state.setAnimation(0, anim.name, true);
      }
      this.layer.addChild(clone);
      this.stressCopies.push(clone);
    }

    return this.stressInstanceCount;
  }

  public clearStressInstances(): void {
    while (this.stressCopies.length > 0) {
      const spine = this.stressCopies.pop();
      if (spine) {
        this.layer.removeChild(spine);
        spine.destroy();
      }
    }
  }

  public setActiveModel(id: string): SpineModel | null {
    if (this.activeModelId !== id) {
      this.clearStressInstances();
    }
    const model = this.modelRegistry.get(id) ?? null;
    this.activeModelId = model?.id ?? null;

    for (const item of this.modelRegistry.values()) {
      item.spine.visible = item.id === this.activeModelId;
    }

    return model;
  }

  public getActiveModel(): SpineModel | null {
    if (!this.activeModelId) {
      return null;
    }
    return this.modelRegistry.get(this.activeModelId) ?? null;
  }

  public removeModel(id: string): SpineModel | null {
    const model = this.modelRegistry.get(id) ?? null;
    if (!model) {
      return null;
    }

    if (this.activeModelId === id) {
      this.clearStressInstances();
    }

    this.layer.removeChild(model.spine);
    model.spine.destroy();
    this.modelRegistry.delete(id);

    if (this.activeModelId === id) {
      const next = this.models[0] ?? null;
      this.activeModelId = next?.id ?? null;
      for (const item of this.modelRegistry.values()) {
        item.spine.visible = item.id === this.activeModelId;
      }
      return next;
    }

    return this.getActiveModel();
  }

  private async createAtlasImagesMap(
    atlasText: string,
    textures: File[],
  ): Promise<Record<string, unknown>> {
    const pageNames = this.extractAtlasPageNames(atlasText);
    const mapping: Record<string, unknown> = {};

    for (const pageName of pageNames) {
      const matched = this.matchTextureByPageName(pageName, textures);
      if (!matched) {
        continue;
      }
      const texture = await Assets.load({
        src: URL.createObjectURL(matched),
        parser: "loadTextures",
      });
      mapping[pageName] =
        texture && typeof texture === "object" && "source" in (texture as object)
          ? (texture as { source: unknown }).source
          : texture;
    }

    return mapping;
  }

  private extractAtlasPageNames(atlasText: string): string[] {
    const lines = atlasText.split(/\r?\n/).map((line) => line.trim());
    const names: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      if (!line || line.includes(":")) {
        continue;
      }
      const lower = line.toLowerCase();
      if (
        !lower.endsWith(".png") &&
        !lower.endsWith(".webp") &&
        !lower.endsWith(".jpg") &&
        !lower.endsWith(".jpeg")
      ) {
        continue;
      }
      if (seen.has(line)) {
        continue;
      }
      seen.add(line);
      names.push(line);
    }

    return names;
  }

  private matchTextureByPageName(pageName: string, textures: File[]): File | null {
    const normalizedPage = pageName.replaceAll("\\", "/").toLowerCase();
    const pageBase = normalizedPage.split("/").pop() ?? normalizedPage;

    for (const texture of textures) {
      const name = texture.name.toLowerCase();
      if (name === normalizedPage || name === pageBase) {
        return texture;
      }
      if (normalizedPage.endsWith(`/${name}`)) {
        return texture;
      }
    }

    return null;
  }

  private getExtension(fileName: string): string {
    const index = fileName.lastIndexOf(".");
    if (index === -1) {
      return "";
    }
    return fileName.slice(index).toLowerCase();
  }

  private normalizeSkeletonAsset(asset: unknown, fileName: string): unknown {
    const ext = this.getExtension(fileName);

    if (ext === ".json") {
      if (asset && typeof asset === "object" && "bones" in (asset as object)) {
        return asset;
      }
      if (typeof asset === "string") {
        try {
          return JSON.parse(asset);
        } catch {
          throw new Error(`Skeleton JSON is not valid JSON text: "${fileName}".`);
        }
      }
      if (asset instanceof Uint8Array) {
        try {
          const text = new TextDecoder().decode(asset);
          return JSON.parse(text);
        } catch {
          throw new Error(`Skeleton JSON binary payload is not valid JSON: "${fileName}".`);
        }
      }
      throw new Error(
        `Unsupported JSON skeleton asset type: ${this.getAssetType(asset)} for "${fileName}".`,
      );
    }

    if (ext === ".skel") {
      if (asset instanceof Uint8Array) {
        return asset;
      }
      if (asset instanceof ArrayBuffer) {
        return new Uint8Array(asset);
      }
      throw new Error(
        `Unsupported SKEL skeleton asset type: ${this.getAssetType(asset)} for "${fileName}".`,
      );
    }

    // Unknown extension: return as-is and let runtime decide.
    return asset;
  }

  private getAssetType(asset: unknown): string {
    if (asset === null) return "null";
    if (asset === undefined) return "undefined";
    if (asset instanceof Uint8Array) return "Uint8Array";
    if (asset instanceof ArrayBuffer) return "ArrayBuffer";
    if (typeof asset === "object") return asset.constructor?.name ?? "object";
    return typeof asset;
  }
}
