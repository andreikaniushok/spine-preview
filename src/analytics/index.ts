/** Pure analytics: atlas / skeleton cost / benchmark stats — no React / Pixi Application. */
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
  buildSpinePerformanceReport,
  impactFromVertices,
  impactFromConstraints,
  summarizeImpactForCompare,
  type SpinePerformanceReport,
  type ImpactLevel,
} from "./spinePerformanceReport";
export { summarizeBenchmark } from "./benchmarkStats";
export type { PerformanceBaseline } from "./performanceBaseline";
