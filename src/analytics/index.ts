/** Pure analytics: atlas / skeleton structure / benchmark stats — no React / Pixi Application. */
export {
  buildAtlasAnalysis,
  attachAtlasRenderPasses,
  computeDrawOrderRenderPasses,
  type AtlasAnalysisReport,
  type AtlasRenderPasses,
  type AtlasPageStats,
  type AtlasRegionRow,
  type AtlasSkeletonLinkage,
} from "./atlasAnalysis";
export {
  buildSkeletonStructureStats,
  type SkeletonStructureStats,
  type BoneAnchorRow,
} from "./skeletonStructure";
export {
  buildSpinePerformanceReport,
  impactFromVertices,
  impactFromConstraints,
  summarizeImpactForCompare,
  type SpinePerformanceReport,
  type ImpactLevel,
} from "./spinePerformanceReport";
export { summarizeBenchmark, type BenchmarkSampleInput } from "./benchmarkStats";
export type { PerformanceBaseline } from "./performanceBaseline";
