import type { SpineAssetBundle } from "../types";

const SKELETON_EXTENSIONS = [".json", ".skel"];

/**
 * Groups local FileList entries (file picker or drag-and-drop) into Spine asset bundles.
 * No React / Pixi — only file matching by extension and basename.
 */
export class SpineBundleParser {
  public static parseBundles(files: FileList): SpineAssetBundle[] {
    const entries = Array.from(files);
    const skeletonFiles = entries.filter((file) =>
      SKELETON_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    );
    const atlasFiles = entries.filter((file) => file.name.toLowerCase().endsWith(".atlas"));
    const textureFiles = entries.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.name.toLowerCase().endsWith(".png") ||
        file.name.toLowerCase().endsWith(".webp") ||
        file.name.toLowerCase().endsWith(".jpg") ||
        file.name.toLowerCase().endsWith(".jpeg"),
    );

    if (skeletonFiles.length === 0 || atlasFiles.length === 0) {
      return [];
    }

    const bundles: SpineAssetBundle[] = [];
    const atlasByBase = new Map<string, File>();
    for (const atlas of atlasFiles) {
      atlasByBase.set(SpineBundleParser.baseName(atlas.name), atlas);
    }

    const fallbackAtlas = atlasFiles[0];
    for (const skeletonFile of skeletonFiles) {
      const groupName = SpineBundleParser.baseName(skeletonFile.name);
      const atlasFile = atlasByBase.get(groupName) ?? fallbackAtlas;

      bundles.push({
        id: `${groupName}-${crypto.randomUUID()}`,
        name: groupName,
        skeletonFile,
        atlasFile,
        textureFiles,
      });
    }

    return bundles;
  }

  private static baseName(fileName: string): string {
    const parts = fileName.split(".");
    parts.pop();
    return parts.join(".");
  }
}
