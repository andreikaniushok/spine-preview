import {
  Attachment,
  BlendMode,
  MeshAttachment,
  RegionAttachment,
  Skeleton,
  SkeletonData,
  TextureAtlas,
  TextureAtlasPage,
  TextureAtlasRegion,
  TextureFilter,
  TextureWrap,
} from "@esotericsoftware/spine-core";

export interface AtlasPageStats {
  fileName: string;
  width: number;
  height: number;
  totalPixels: number;
  packedPixels: number;
  utilizationPercent: number;
  regionCount: number;
  filterMin: string;
  filterMag: string;
  wrapU: string;
  wrapV: string;
  premultipliedAlpha: boolean;
}

export interface AtlasRegionRow {
  name: string;
  page: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelArea: number;
  rotated: boolean;
  originalWidth: number;
  originalHeight: number;
}

export interface AtlasSkeletonLinkage {
  /** Distinct texture paths from all skins' region/mesh attachments. */
  attachmentTexturePaths: number;
  /** Paths that resolve to an atlas region (by path or file base name). */
  resolvedInAtlas: number;
  /** Paths with no matching atlas region. */
  missingInAtlas: number;
  /** Atlas regions never referenced by any skin attachment path (by region name). */
  orphanRegions: number;
}

/** Batching along `drawOrder` for textured region/mesh slots (current pose). */
export interface AtlasRenderPasses {
  /** Batches when atlas page or slot blend mode changes between consecutive drawables. */
  estimatedDrawCalls: number;
  /** Count of times atlas texture page changes between consecutive drawables. */
  texturePageSwitches: number;
  /** Drawables that had a bound atlas region (same order as used for passes). */
  texturedDrawableSlots: number;
}

export interface AtlasAnalysisReport {
  atlasFileName: string;
  parseError: string | null;
  totalPages: number;
  totalRegions: number;
  totalPagePixels: number;
  totalPackedPixels: number;
  overallUtilizationPercent: number;
  pages: AtlasPageStats[];
  topRegionsByArea: AtlasRegionRow[];
  /** All region names in atlas file order (for asset browser). */
  regionNames: string[];
  linkage: AtlasSkeletonLinkage | null;
  /** Present when skeleton is passed and atlas regions are bound on attachments. */
  renderPasses: AtlasRenderPasses | null;
}

function textureFilterName(v: TextureFilter): string {
  switch (v) {
    case TextureFilter.Nearest:
      return "Nearest";
    case TextureFilter.Linear:
      return "Linear";
    case TextureFilter.MipMap:
      return "MipMap";
    case TextureFilter.MipMapNearestNearest:
      return "MipMapNearestNearest";
    case TextureFilter.MipMapLinearNearest:
      return "MipMapLinearNearest";
    case TextureFilter.MipMapNearestLinear:
      return "MipMapNearestLinear";
    case TextureFilter.MipMapLinearLinear:
      return "MipMapLinearLinear";
    default:
      return String(v);
  }
}

function textureWrapName(v: TextureWrap): string {
  switch (v) {
    case TextureWrap.ClampToEdge:
      return "ClampToEdge";
    case TextureWrap.Repeat:
      return "Repeat";
    case TextureWrap.MirroredRepeat:
      return "MirroredRepeat";
    default:
      return String(v);
  }
}

function findRegionFlexible(atlas: TextureAtlas, key: string): TextureAtlasRegion | null {
  const trimmed = key.trim();
  if (!trimmed) {
    return null;
  }
  let region = atlas.findRegion(trimmed);
  if (region) {
    return region;
  }
  const base = trimmed.split(/[/\\]/).pop();
  if (base && base !== trimmed) {
    region = atlas.findRegion(base);
  }
  return region ?? null;
}

function getDrawableAtlasRegion(att: Attachment): TextureAtlasRegion | null {
  if (!(att instanceof RegionAttachment) && !(att instanceof MeshAttachment)) {
    return null;
  }
  const region = att.region;
  if (!region || !("page" in region)) {
    return null;
  }
  return region as TextureAtlasRegion;
}

/** Estimates GPU batches from draw order: breaks when texture page or blend mode changes. */
export function computeDrawOrderRenderPasses(skeleton: Skeleton): AtlasRenderPasses {
  let estimatedDrawCalls = 0;
  let texturePageSwitches = 0;
  let texturedDrawableSlots = 0;
  let prev: { page: TextureAtlasPage; blend: BlendMode } | null = null;

  for (const slot of skeleton.drawOrder) {
    const att = slot.getAttachment();
    if (!att) {
      continue;
    }
    const atlasRegion = getDrawableAtlasRegion(att);
    if (!atlasRegion?.page) {
      continue;
    }
    texturedDrawableSlots++;
    const page = atlasRegion.page;
    const blend = slot.data.blendMode;
    if (!prev) {
      estimatedDrawCalls = 1;
      prev = { page, blend };
      continue;
    }
    if (prev.page !== page) {
      texturePageSwitches++;
    }
    if (prev.page !== page || prev.blend !== blend) {
      estimatedDrawCalls++;
    }
    prev = { page, blend };
  }

  return { estimatedDrawCalls, texturePageSwitches, texturedDrawableSlots };
}

function collectTexturePathsFromSkins(data: SkeletonData): Set<string> {
  const keys = new Set<string>();
  for (const skin of data.skins) {
    for (const entry of skin.getAttachments()) {
      const att = entry.attachment;
      if (att instanceof RegionAttachment || att instanceof MeshAttachment) {
        const key = (att.path || att.name).trim();
        if (key) {
          keys.add(key);
        }
      }
    }
  }
  return keys;
}

export function buildAtlasAnalysis(atlasText: string, atlasFileName: string, skeleton: Skeleton | null): AtlasAnalysisReport {
  const emptyLinkage = (paths: number): AtlasSkeletonLinkage => ({
    attachmentTexturePaths: paths,
    resolvedInAtlas: 0,
    missingInAtlas: paths,
    orphanRegions: 0,
  });

  let atlas: TextureAtlas;
  try {
    atlas = new TextureAtlas(atlasText);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to parse atlas.";
    return {
      atlasFileName,
      parseError: message,
      totalPages: 0,
      totalRegions: 0,
      totalPagePixels: 0,
      totalPackedPixels: 0,
      overallUtilizationPercent: 0,
      pages: [],
      topRegionsByArea: [],
      regionNames: [],
      linkage: skeleton ? emptyLinkage(collectTexturePathsFromSkins(skeleton.data).size) : null,
      renderPasses: null,
    };
  }

  try {
    const pages: AtlasPageStats[] = [];
    let totalPagePixels = 0;
    let totalPackedPixels = 0;

    for (const page of atlas.pages) {
      const w = page.width;
      const h = page.height;
      const totalPixels = Math.max(0, w) * Math.max(0, h);
      const regionsOnPage = atlas.regions.filter((r) => r.page === page);
      let packed = 0;
      for (const r of regionsOnPage) {
        packed += Math.max(0, r.width) * Math.max(0, r.height);
      }
      const utilization = totalPixels > 0 ? (packed / totalPixels) * 100 : 0;
      totalPagePixels += totalPixels;
      totalPackedPixels += packed;

      pages.push({
        fileName: page.name,
        width: w,
        height: h,
        totalPixels,
        packedPixels: packed,
        utilizationPercent: Math.round(utilization * 10) / 10,
        regionCount: regionsOnPage.length,
        filterMin: textureFilterName(page.minFilter),
        filterMag: textureFilterName(page.magFilter),
        wrapU: textureWrapName(page.uWrap),
        wrapV: textureWrapName(page.vWrap),
        premultipliedAlpha: page.pma,
      });
    }

    const overallUtilization =
      totalPagePixels > 0 ? Math.round((totalPackedPixels / totalPagePixels) * 1000) / 10 : 0;

    const regionRows: AtlasRegionRow[] = atlas.regions.map((r) => ({
      name: r.name,
      page: r.page.name,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      pixelArea: Math.max(0, r.width) * Math.max(0, r.height),
      rotated: r.degrees !== 0,
      originalWidth: r.originalWidth,
      originalHeight: r.originalHeight,
    }));
    regionRows.sort((a, b) => b.pixelArea - a.pixelArea);
    const topRegionsByArea = regionRows.slice(0, 24);
    const regionNames = atlas.regions.map((r) => r.name);

    let linkage: AtlasSkeletonLinkage | null = null;
    if (skeleton) {
      const paths = collectTexturePathsFromSkins(skeleton.data);
      const usedRegionNames = new Set<string>();
      let missing = 0;
      for (const path of paths) {
        const region = findRegionFlexible(atlas, path);
        if (region) {
          usedRegionNames.add(region.name);
        } else {
          missing++;
        }
      }
      let orphan = 0;
      for (const r of atlas.regions) {
        if (!usedRegionNames.has(r.name)) {
          orphan++;
        }
      }
      linkage = {
        attachmentTexturePaths: paths.size,
        resolvedInAtlas: paths.size - missing,
        missingInAtlas: missing,
        orphanRegions: orphan,
      };
    }

    return {
      atlasFileName,
      parseError: null,
      totalPages: atlas.pages.length,
      totalRegions: atlas.regions.length,
      totalPagePixels,
      totalPackedPixels,
      overallUtilizationPercent: overallUtilization,
      pages,
      topRegionsByArea,
      regionNames,
      linkage,
      renderPasses: null,
    };
  } finally {
    atlas.dispose();
  }
}

/** Fills `renderPasses` from the current skeleton pose (cheap; call often). */
export function attachAtlasRenderPasses(
  report: AtlasAnalysisReport,
  skeleton: Skeleton | null,
): AtlasAnalysisReport {
  if (report.parseError || !skeleton) {
    return { ...report, renderPasses: null };
  }
  return {
    ...report,
    renderPasses: computeDrawOrderRenderPasses(skeleton),
  };
}
