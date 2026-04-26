import { memo, useMemo, useState } from "react";
import type { AtlasAnalysisReport } from "../analysis/atlasAnalysis";
import type { ImpactLevel, SpinePerformanceReport } from "../analysis/spinePerformanceReport";
import {
  impactFromConstraints,
  impactFromVertices,
  summarizeImpactForCompare,
} from "../analysis/spinePerformanceReport";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/messages";
import type { MessageVars } from "../i18n/types";
import type { PerformanceBaseline } from "../types/performanceBaseline";
import type { BenchmarkUiState, SpineModel } from "../types/spine";

interface PerformanceReportPanelProps {
  report: SpinePerformanceReport | null;
  atlasReport: AtlasAnalysisReport | null;
  activeModel: SpineModel | null;
  benchmark: BenchmarkUiState;
  onBenchmarkStart: (durationSec: number) => void;
  onBenchmarkStop: () => void;
  onBenchmarkClear: () => void;
  baseline: PerformanceBaseline | null;
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
}

function impactBadge(level: ImpactLevel): string {
  return level;
}

type Translate = (key: MessageKey, vars?: MessageVars) => string;

function compareLine(
  t: Translate,
  labelKey: MessageKey,
  a: ImpactLevel | number | string,
  b: ImpactLevel | number | string,
): string {
  const label = t(labelKey);
  if (typeof a === "number" && typeof b === "number") {
    const d = b - a;
    const arrow =
      d === 0 ? t("perf.arrow_same") : d > 0 ? t("perf.arrow_up") : t("perf.arrow_down");
    return t("perf.compare_num", { label, a, b, arrow });
  }
  if (typeof a === "string" && typeof b === "string") {
    return t("perf.compare_str", { label, a, b });
  }
  const na = summarizeImpactForCompare(a as ImpactLevel);
  const nb = summarizeImpactForCompare(b as ImpactLevel);
  const arrow =
    nb === na ? t("perf.arrow_same") : nb > na ? t("perf.arrow_up") : t("perf.arrow_down");
  return t("perf.compare_lvl", { label, a: String(a), b: String(b), arrow });
}

function PerformanceReportPanelInner(props: PerformanceReportPanelProps) {
  const {
    report,
    atlasReport,
    activeModel,
    benchmark,
    onBenchmarkStart,
    onBenchmarkStop,
    onBenchmarkClear,
    baseline,
    onCaptureBaseline,
    onClearBaseline,
  } = props;
  const { t } = useI18n();
  const [benchmarkDurationSec, setBenchmarkDurationSec] = useState<number>(5);
  const [largestRegionsOpen, setLargestRegionsOpen] = useState(false);
  const isBenchmarkRunning = benchmark.status === "running";

  const atlasPagesRows = useMemo(
    () =>
      atlasReport?.pages.map((p) => (
        <tr key={p.fileName}>
          <td>{p.fileName}</td>
          <td>
            {p.width}×{p.height}
          </td>
          <td>{p.regionCount}</td>
          <td>{p.utilizationPercent.toFixed(1)}%</td>
          <td>
            {p.filterMin} / {p.filterMag}
          </td>
          <td>
            {p.wrapU} / {p.wrapV}
          </td>
          <td>{p.premultipliedAlpha ? t("common.yes") : t("common.no")}</td>
        </tr>
      )) ?? null,
    [atlasReport?.pages, t],
  );
  const largestRegionsRows = useMemo(
    () =>
      atlasReport?.topRegionsByArea.map((r) => (
        <tr key={`${r.page}:${r.name}`}>
          <td>{r.name}</td>
          <td>{r.page}</td>
          <td>
            {r.x}, {r.y}
          </td>
          <td>
            {r.width}×{r.height}
          </td>
          <td>{r.pixelArea.toLocaleString()}</td>
          <td>{r.rotated ? t("common.yes") : t("common.no")}</td>
          <td>
            {r.originalWidth}×{r.originalHeight}
          </td>
        </tr>
      )) ?? null,
    [atlasReport?.topRegionsByArea, t],
  );
  const perAnimationRows = useMemo(
    () =>
      report?.perAnimation.map((row) => (
        <tr key={row.name}>
          <td>{row.name}</td>
          <td>{row.durationSec.toFixed(2)}s</td>
          <td>{row.renderImpact}</td>
          <td>{row.computeImpact}</td>
          <td>{row.activeFeatures}</td>
        </tr>
      )) ?? null,
    [report?.perAnimation],
  );
  const perAnimationMeshesRows = useMemo(
    () =>
      report?.perAnimationMeshes.map((row) => (
        <tr key={row.animation}>
          <td>{row.animation}</td>
          <td>{row.activeMeshes}</td>
          <td>{row.totalVertices}</td>
          <td>{row.deformedVertices}</td>
          <td>{row.weightedBoneRefs}</td>
          <td>{row.renderImpact}</td>
        </tr>
      )) ?? null,
    [report?.perAnimationMeshes],
  );
  const globalMeshRows = useMemo(
    () =>
      report?.globalMeshTop.map((row) => (
        <tr key={row.slotName}>
          <td>{row.slotName}</td>
          <td>{row.vertices}</td>
          <td>{row.deformed ? t("common.yes") : t("common.no")}</td>
          <td>{row.boneWeights}</td>
          <td>{row.hasParentMesh ? t("common.yes") : t("common.no")}</td>
        </tr>
      )) ?? null,
    [report?.globalMeshTop, t],
  );
  const clippingRows = useMemo(
    () =>
      report?.clippingRows.map((row) => (
        <tr key={row.animation}>
          <td>{row.animation}</td>
          <td>{row.hasClipping ? t("common.yes") : t("common.no")}</td>
          <td>{row.activeMasks}</td>
          <td>{row.clipVertices}</td>
          <td>{row.impact}</td>
        </tr>
      )) ?? null,
    [report?.clippingRows, t],
  );
  const blendRows = useMemo(
    () =>
      report?.blendRows.map((row) => (
        <tr key={row.animation}>
          <td>{row.animation}</td>
          <td>{row.hasBlendModes ? t("common.yes") : t("common.no")}</td>
          <td>{row.maxNonNormal}</td>
          <td>{row.maxAdditive}</td>
          <td>{row.maxMultiply}</td>
          <td>{row.impact}</td>
        </tr>
      )) ?? null,
    [report?.blendRows, t],
  );
  const constraintAnimRows = useMemo(
    () =>
      report?.constraintAnimRows.map((row) => (
        <tr key={row.animation}>
          <td>{row.animation}</td>
          <td>{row.physics}</td>
          <td>{row.ik}</td>
          <td>{row.transform}</td>
          <td>{row.path}</td>
          <td>{row.totalActive}</td>
          <td>{row.impact}</td>
        </tr>
      )) ?? null,
    [report?.constraintAnimRows],
  );
  const constraintBreakdownRows = useMemo(
    () =>
      report?.constraintBreakdown.map((row) => (
        <tr key={row.type}>
          <td>{row.type}</td>
          <td>{row.count}</td>
          <td>{row.percentOfTotal.toFixed(1)}%</td>
        </tr>
      )) ?? null,
    [report?.constraintBreakdown],
  );
  const transformConstraintRows = useMemo(
    () =>
      report?.transformConstraintDetails.map((row) => (
        <tr key={row.name}>
          <td>{row.name}</td>
          <td>{row.targetBone}</td>
          <td>{row.boneCount}</td>
          <td className="perf-cell-mono">{row.mixSummary}</td>
          <td>{row.status}</td>
        </tr>
      )) ?? null,
    [report?.transformConstraintDetails],
  );

  if (!report) {
    return (
      <aside className="performance-panel performance-panel-empty">
        <h2 className="performance-title">{t("perf.title")}</h2>
        <section className="perf-section assets-section">
          <h3>{t("control.assets")}</h3>
          {!activeModel ? (
            <p className="performance-muted">{t("control.assets_load_hint")}</p>
          ) : (
            <>
              <div className="assets-files">
                <div className="assets-file-row">
                  <span className="assets-label">{t("control.sk_label")}</span>
                  <code className="assets-path">{activeModel.skeletonFileName}</code>
                </div>
                <div className="assets-file-row">
                  <span className="assets-label">{t("control.atlas_label")}</span>
                  <code className="assets-path">{activeModel.atlasFileName}</code>
                </div>
              </div>
              {atlasReport?.parseError ? (
                <p className="performance-atlas-error">
                  {t("control.atlas_parse_prefix")} {atlasReport.parseError}
                </p>
              ) : atlasReport ? (
                <>
                  <dl className="assets-stats-grid">
                    <div>
                      <dt>{t("control.pages")}</dt>
                      <dd>{atlasReport.totalPages}</dd>
                    </div>
                    <div>
                      <dt>{t("control.regions")}</dt>
                      <dd>{atlasReport.totalRegions}</dd>
                    </div>
                    <div>
                      <dt>{t("control.draw_calls")}</dt>
                      <dd>{atlasReport.renderPasses?.estimatedDrawCalls ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>{t("control.page_switches")}</dt>
                      <dd>{atlasReport.renderPasses?.texturePageSwitches ?? "—"}</dd>
                    </div>
                  </dl>
                  <p className="assets-stats-hint">{t("control.assets_stats_hint")}</p>
                  <h4 className="perf-subheading">{t("perf.pages_table")}</h4>
                  <div className="perf-table-wrap">
                    <table className="perf-table">
                      <thead>
                        <tr>
                          <th>{t("perf.texture")}</th>
                          <th>{t("perf.size")}</th>
                          <th>{t("perf.regions")}</th>
                          <th>{t("perf.utilization")}</th>
                          <th>{t("perf.filter")}</th>
                          <th>{t("perf.wrap_uv")}</th>
                          <th>{t("perf.pma")}</th>
                        </tr>
                      </thead>
                      <tbody>{atlasPagesRows}</tbody>
                    </table>
                  </div>
                  {atlasReport.linkage && (
                    <>
                      <h4 className="perf-subheading">{t("perf.atlas_vs_skins")}</h4>
                      <div className="perf-kv-grid">
                        <span className="perf-k">{t("perf.distinct_paths")}</span>
                        <span className="perf-v">{atlasReport.linkage.attachmentTexturePaths}</span>
                        <span className="perf-k">{t("perf.resolved_in_atlas")}</span>
                        <span className="perf-v">{atlasReport.linkage.resolvedInAtlas}</span>
                        <span className="perf-k">{t("perf.missing_in_atlas")}</span>
                        <span className="perf-v">{atlasReport.linkage.missingInAtlas}</span>
                        <span className="perf-k">{t("perf.unused_regions")}</span>
                        <span className="perf-v">{atlasReport.linkage.orphanRegions}</span>
                      </div>
                      <p className="performance-muted">{t("perf.atlas_match_hint")}</p>
                    </>
                  )}
                  <h4 className="perf-subheading">{t("perf.largest_regions")}</h4>
                  {largestRegionsOpen ? (
                    <button
                      type="button"
                      className="assets-toggle"
                      onClick={() => setLargestRegionsOpen((open) => !open)}
                      aria-expanded="true"
                    >
                      {t("control.hide_regions")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="assets-toggle"
                      onClick={() => setLargestRegionsOpen((open) => !open)}
                      aria-expanded="false"
                    >
                      {t("control.show_regions", { count: 10 })}
                    </button>
                  )}
                  {largestRegionsOpen && (
                    <div className="perf-table-wrap">
                      <table className="perf-table">
                        <thead>
                          <tr>
                            <th>{t("perf.region_col")}</th>
                            <th>{t("perf.page_col")}</th>
                            <th>{t("perf.xy_col")}</th>
                            <th>{t("perf.size_col")}</th>
                            <th>{t("perf.pixels_col")}</th>
                            <th>{t("perf.rot_col")}</th>
                            <th>{t("perf.original_col")}</th>
                          </tr>
                        </thead>
                        <tbody>{largestRegionsRows}</tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="performance-muted">{t("control.no_atlas_data")}</p>
              )}
            </>
          )}
        </section>
        <section className="perf-section benchmark-section">
          <h3>{t("control.benchmark")}</h3>
          <p className="benchmark-hint">{t("control.benchmark_hint")}</p>
          <div className="perf-controls-row">
            <label>{t("control.duration")}</label>
            <select
              aria-label={t("control.duration")}
              value={benchmarkDurationSec}
              disabled={isBenchmarkRunning}
              onChange={(e) => setBenchmarkDurationSec(Number(e.target.value))}
            >
              {[3, 5, 10, 30].map((sec) => (
                <option key={sec} value={sec}>
                  {sec}s
                </option>
              ))}
            </select>
          </div>
          <div className="perf-controls-row benchmark-actions">
            {!isBenchmarkRunning ? (
              <button type="button" onClick={() => onBenchmarkStart(benchmarkDurationSec)}>
                {t("control.start")}
              </button>
            ) : (
              <button type="button" onClick={onBenchmarkStop}>
                {t("control.stop_early")}
              </button>
            )}
          </div>
          {benchmark.status === "running" && (
            <div className="benchmark-progress" role="status" aria-live="polite">
              <div className="benchmark-progress-track">
                <div
                  className="benchmark-progress-fill"
                  style={{ width: `${Math.round(benchmark.progress * 100)}%` }}
                />
              </div>
              <span className="benchmark-progress-label">
                {t("control.recording", { pct: Math.round(benchmark.progress * 100) })}
              </span>
            </div>
          )}
          {benchmark.status === "done" && (
            <div className="benchmark-results">
              <dl className="benchmark-stats">
                <div>
                  <dt>{t("control.frames")}</dt>
                  <dd>{benchmark.result.frameCount}</dd>
                </div>
                <div>
                  <dt>{t("control.wall_time")}</dt>
                  <dd>{(benchmark.result.wallDurationMs / 1000).toFixed(2)} s</dd>
                </div>
                <div>
                  <dt>{t("control.mean_fps")}</dt>
                  <dd>{benchmark.result.meanFps.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>{t("control.frame_ms_avg")}</dt>
                  <dd>{benchmark.result.frameTimeMs.mean.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t("control.frame_ms_p50")}</dt>
                  <dd>{benchmark.result.frameTimeMs.p50.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t("control.frame_ms_p95")}</dt>
                  <dd>{benchmark.result.frameTimeMs.p95.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t("control.frame_ms_p99")}</dt>
                  <dd>{benchmark.result.frameTimeMs.p99.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t("control.frame_ms_minmax")}</dt>
                  <dd>
                    {benchmark.result.frameTimeMs.min.toFixed(2)} –{" "}
                    {benchmark.result.frameTimeMs.max.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <button type="button" className="benchmark-clear" onClick={onBenchmarkClear}>
                {t("control.clear_results")}
              </button>
            </div>
          )}
        </section>
        <p className="performance-muted">{t("perf.empty")}</p>
      </aside>
    );
  }

  const cmp = baseline
    ? {
        ri: compareLine(t, "perf.cmp_ri", baseline.report.renderingImpact, report.renderingImpact),
        ci: compareLine(t, "perf.cmp_ci", baseline.report.computeImpact, report.computeImpact),
        verts: compareLine(
          t,
          "perf.cmp_verts",
          baseline.report.peakVerticesSampled,
          report.peakVerticesSampled,
        ),
      }
    : null;

  const riScore = summarizeImpactForCompare(report.renderingImpact);
  const ciScore = summarizeImpactForCompare(report.computeImpact);
  const worstConstraintActive = report.constraintAnimRows.reduce((m, r) => Math.max(m, r.totalActive), 0);
  const worstClipVertices = report.clippingRows.reduce((m, r) => Math.max(m, r.clipVertices), 0);
  const worstBlendSlots = report.blendRows.reduce(
    (m, r) => Math.max(m, r.maxAdditive + r.maxMultiply + r.maxNonNormal),
    0,
  );
  return (
    <aside className="performance-panel">
      <header className="performance-header">
        <h2 className="performance-title">{t("perf.title")}</h2>
        <div className="ri-ci-scores" aria-label={t("perf.compare_aria")}>
          <div className="ri-ci-score">
            <span className="ri-ci-num">{riScore}</span>
            <span className="ri-ci-label">RI</span>
          </div>
          <div className="ri-ci-score">
            <span className="ri-ci-num">{ciScore}</span>
            <span className="ri-ci-label">CI</span>
          </div>
        </div>
        <p className="performance-skeleton-name">
          {t("perf.skeleton")}{" "}
          <strong>{report.skeletonName ?? t("perf.unnamed")}</strong>
        </p>
        <div className="performance-baseline-actions">
          <button type="button" onClick={onCaptureBaseline}>
            {t("perf.capture_baseline")}
          </button>
          <button type="button" className="secondary" onClick={onClearBaseline} disabled={!baseline}>
            {t("perf.clear_baseline")}
          </button>
        </div>
        {baseline && (
          <p className="performance-baseline-hint">
            {t("perf.baseline_hint", { model: baseline.modelName, label: baseline.label })}
          </p>
        )}
        {cmp && (
          <div className="performance-compare-strip" role="status">
            <div>
              <span className="ri-ci-label">RI</span>{" "}
              <span className="impact-pill">{impactBadge(report.renderingImpact)}</span>
            </div>
            <div>
              <span className="ri-ci-label">CI</span>{" "}
              <span className="impact-pill">{impactBadge(report.computeImpact)}</span>
            </div>
            <div className="compare-lines">
              <span>{cmp.ri}</span>
              <span>{cmp.ci}</span>
              <span>{cmp.verts}</span>
            </div>
          </div>
        )}
      </header>

      <section className="perf-section">
        <h3>{t("perf.summary")}</h3>
        <div className="perf-kv-grid">
          <span className="perf-k">{t("perf.bones")}</span>
          <span className="perf-v">{report.boneCount}</span>
          <span className="perf-k">{t("perf.animations")}</span>
          <span className="perf-v">{report.animationCount}</span>
          <span className="perf-k">{t("perf.skins")}</span>
          <span className="perf-v">{report.skinCount}</span>
          <span className="perf-k">{t("perf.max_bone_depth")}</span>
          <span className="perf-v">{report.maxBoneDepth}</span>
        </div>
      </section>

      <section className="perf-section assets-section">
        <h3>{t("control.assets")}</h3>
        {!activeModel ? (
          <p className="performance-muted">{t("control.assets_load_hint")}</p>
        ) : (
          <>
            <div className="assets-files">
              <div className="assets-file-row">
                <span className="assets-label">{t("control.sk_label")}</span>
                <code className="assets-path">{activeModel.skeletonFileName}</code>
              </div>
              <div className="assets-file-row">
                <span className="assets-label">{t("control.atlas_label")}</span>
                <code className="assets-path">{activeModel.atlasFileName}</code>
              </div>
            </div>
            {atlasReport?.parseError ? (
              <p className="performance-atlas-error">
                {t("control.atlas_parse_prefix")} {atlasReport.parseError}
              </p>
            ) : atlasReport ? (
              <>
                <dl className="assets-stats-grid">
                  <div>
                    <dt>{t("control.pages")}</dt>
                    <dd>{atlasReport.totalPages}</dd>
                  </div>
                  <div>
                    <dt>{t("control.regions")}</dt>
                    <dd>{atlasReport.totalRegions}</dd>
                  </div>
                  <div>
                    <dt>{t("control.draw_calls")}</dt>
                    <dd>{atlasReport.renderPasses?.estimatedDrawCalls ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("control.page_switches")}</dt>
                    <dd>{atlasReport.renderPasses?.texturePageSwitches ?? "—"}</dd>
                  </div>
                </dl>
                <p className="assets-stats-hint">{t("control.assets_stats_hint")}</p>
                <h4 className="perf-subheading">{t("perf.pages_table")}</h4>
                <div className="perf-table-wrap">
                  <table className="perf-table">
                    <thead>
                      <tr>
                        <th>{t("perf.texture")}</th>
                        <th>{t("perf.size")}</th>
                        <th>{t("perf.regions")}</th>
                        <th>{t("perf.utilization")}</th>
                        <th>{t("perf.filter")}</th>
                        <th>{t("perf.wrap_uv")}</th>
                        <th>{t("perf.pma")}</th>
                      </tr>
                    </thead>
                    <tbody>{atlasPagesRows}</tbody>
                  </table>
                </div>
                {atlasReport.linkage && (
                  <>
                    <h4 className="perf-subheading">{t("perf.atlas_vs_skins")}</h4>
                    <div className="perf-kv-grid">
                      <span className="perf-k">{t("perf.distinct_paths")}</span>
                      <span className="perf-v">{atlasReport.linkage.attachmentTexturePaths}</span>
                      <span className="perf-k">{t("perf.resolved_in_atlas")}</span>
                      <span className="perf-v">{atlasReport.linkage.resolvedInAtlas}</span>
                      <span className="perf-k">{t("perf.missing_in_atlas")}</span>
                      <span className="perf-v">{atlasReport.linkage.missingInAtlas}</span>
                      <span className="perf-k">{t("perf.unused_regions")}</span>
                      <span className="perf-v">{atlasReport.linkage.orphanRegions}</span>
                    </div>
                    <p className="performance-muted">{t("perf.atlas_match_hint")}</p>
                  </>
                )}
                <h4 className="perf-subheading">{t("perf.largest_regions")}</h4>
                {largestRegionsOpen ? (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setLargestRegionsOpen((open) => !open)}
                    aria-expanded="true"
                  >
                    {t("control.hide_regions")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setLargestRegionsOpen((open) => !open)}
                    aria-expanded="false"
                  >
                    {t("control.show_regions", { count: 10 })}
                  </button>
                )}
                {largestRegionsOpen && (
                  <div className="perf-table-wrap">
                    <table className="perf-table">
                      <thead>
                        <tr>
                          <th>{t("perf.region_col")}</th>
                          <th>{t("perf.page_col")}</th>
                          <th>{t("perf.xy_col")}</th>
                          <th>{t("perf.size_col")}</th>
                          <th>{t("perf.pixels_col")}</th>
                          <th>{t("perf.rot_col")}</th>
                          <th>{t("perf.original_col")}</th>
                        </tr>
                      </thead>
                      <tbody>{largestRegionsRows}</tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="performance-muted">{t("control.no_atlas_data")}</p>
            )}
          </>
        )}
      </section>

      <section className="perf-section benchmark-section">
        <h3>{t("control.benchmark")}</h3>
        <p className="benchmark-hint">{t("control.benchmark_hint")}</p>
        <div className="perf-controls-row">
          <label>{t("control.duration")}</label>
          <select
            aria-label={t("control.duration")}
            value={benchmarkDurationSec}
            disabled={isBenchmarkRunning}
            onChange={(e) => setBenchmarkDurationSec(Number(e.target.value))}
          >
            {[3, 5, 10, 30].map((sec) => (
              <option key={sec} value={sec}>
                {sec}s
              </option>
            ))}
          </select>
        </div>
        <div className="perf-controls-row benchmark-actions">
          {!isBenchmarkRunning ? (
            <button type="button" onClick={() => onBenchmarkStart(benchmarkDurationSec)}>
              {t("control.start")}
            </button>
          ) : (
            <button type="button" onClick={onBenchmarkStop}>
              {t("control.stop_early")}
            </button>
          )}
        </div>
        {benchmark.status === "running" && (
          <div className="benchmark-progress" role="status" aria-live="polite">
            <div className="benchmark-progress-track">
              <div
                className="benchmark-progress-fill"
                style={{ width: `${Math.round(benchmark.progress * 100)}%` }}
              />
            </div>
            <span className="benchmark-progress-label">
              {t("control.recording", { pct: Math.round(benchmark.progress * 100) })}
            </span>
          </div>
        )}
        {benchmark.status === "done" && (
          <div className="benchmark-results">
            <dl className="benchmark-stats">
              <div>
                <dt>{t("control.frames")}</dt>
                <dd>{benchmark.result.frameCount}</dd>
              </div>
              <div>
                <dt>{t("control.wall_time")}</dt>
                <dd>{(benchmark.result.wallDurationMs / 1000).toFixed(2)} s</dd>
              </div>
              <div>
                <dt>{t("control.mean_fps")}</dt>
                <dd>{benchmark.result.meanFps.toFixed(1)}</dd>
              </div>
              <div>
                <dt>{t("control.frame_ms_avg")}</dt>
                <dd>{benchmark.result.frameTimeMs.mean.toFixed(2)}</dd>
              </div>
              <div>
                <dt>{t("control.frame_ms_p50")}</dt>
                <dd>{benchmark.result.frameTimeMs.p50.toFixed(2)}</dd>
              </div>
              <div>
                <dt>{t("control.frame_ms_p95")}</dt>
                <dd>{benchmark.result.frameTimeMs.p95.toFixed(2)}</dd>
              </div>
              <div>
                <dt>{t("control.frame_ms_p99")}</dt>
                <dd>{benchmark.result.frameTimeMs.p99.toFixed(2)}</dd>
              </div>
              <div>
                <dt>{t("control.frame_ms_minmax")}</dt>
                <dd>
                  {benchmark.result.frameTimeMs.min.toFixed(2)} –{" "}
                  {benchmark.result.frameTimeMs.max.toFixed(2)}
                </dd>
              </div>
            </dl>
            <button type="button" className="benchmark-clear" onClick={onBenchmarkClear}>
              {t("control.clear_results")}
            </button>
          </div>
        )}
      </section>

      <section className="perf-section">
        <h3>{t("perf.rendering_impact")}</h3>
        <p>
          <span className="impact-pill">{impactBadge(report.renderingImpact)}</span>{" "}
          <span className="performance-muted">
            {t("perf.peak_vertices_caption", { count: report.peakVerticesSampled })}
          </span>
        </p>
      </section>

      <section className="perf-section">
        <h3>{t("perf.compute_impact")}</h3>
        <p>
          <span className="impact-pill">{impactBadge(report.computeImpact)}</span>{" "}
          <span className="performance-muted">
            {t("perf.weighted_bone_caption", {
              weighted: report.totalWeightedBoneRefsWorst,
              constraints: report.constraintCountData,
            })}
          </span>
        </p>
      </section>

      <section className="perf-section">
        <h3>{t("perf.anim_overview")}</h3>
        <ul className="perf-list">
          <li>
            {t("perf.anim_total")} {report.animationCount}
          </li>
          <li>
            {t("perf.anim_physics")} {report.animationsWithPhysics}
          </li>
          <li>
            {t("perf.anim_clipping")} {report.animationsWithClipping}
          </li>
          <li>
            {t("perf.anim_blend")} {report.animationsWithSpecialBlend}
          </li>
        </ul>
      </section>

      <section className="perf-section">
        <h3>{t("perf.per_animation")}</h3>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.anim_col")}</th>
                <th>{t("perf.duration_col")}</th>
                <th>{t("perf.render_impact_col")}</th>
                <th>{t("perf.compute_impact_col")}</th>
                <th>{t("perf.active_features_col")}</th>
              </tr>
            </thead>
            <tbody>
              {perAnimationRows}
            </tbody>
          </table>
        </div>
      </section>

      <section className="perf-section">
        <h3>{t("perf.global_skeleton")}</h3>
        <div className="perf-kv-grid">
          <span className="perf-k">{t("perf.total_bones")}</span>
          <span className="perf-v">{report.boneCount}</span>
          <span className="perf-k">{t("perf.max_bone_depth")}</span>
          <span className="perf-v">{report.maxBoneDepth}</span>
          <span className="perf-k">{t("perf.total_animations_label")}</span>
          <span className="perf-v">{report.animationCount}</span>
          <span className="perf-k">{t("perf.skins")}</span>
          <span className="perf-v">{report.skinCount}</span>
        </div>
      </section>

      <section className="perf-section">
        <h3>{t("perf.mesh_stats")}</h3>
        <p>
          {t("perf.mesh_worst_prefix")}{" "}
          <span className="impact-pill">{impactBadge(report.renderingImpact)}</span>
        </p>
        <h4 className="perf-subheading">{t("perf.mesh_per_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.anim_col")}</th>
                <th>{t("perf.mesh_active")}</th>
                <th>{t("perf.mesh_total_vertices")}</th>
                <th>{t("perf.mesh_deformed")}</th>
                <th>{t("perf.mesh_weighted")}</th>
                <th>{t("perf.mesh_impact")}</th>
              </tr>
            </thead>
            <tbody>
              {perAnimationMeshesRows}
            </tbody>
          </table>
        </div>
      </section>

      <section className="perf-section">
        <h3>{t("perf.global_mesh_detail")}</h3>
        <p className="performance-muted">
          {t("perf.global_mesh_showing", {
            shown: report.globalMeshTop.length,
            total: report.globalMeshTotalSlots,
          })}
        </p>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.mesh_slot")}</th>
                <th>{t("perf.mesh_vertices")}</th>
                <th>{t("perf.mesh_deformed_col")}</th>
                <th>{t("perf.mesh_bone_weights")}</th>
                <th>{t("perf.mesh_parent")}</th>
              </tr>
            </thead>
            <tbody>
              {globalMeshRows}
            </tbody>
          </table>
        </div>
      </section>

      <section className="perf-section">
        <h3>{t("perf.clipping_title")}</h3>
        <p>
          {t("perf.clip_worst_prefix")}{" "}
          <span className="impact-pill">{impactBadge(impactFromVertices(worstClipVertices))}</span>
        </p>
        <h4 className="perf-subheading">{t("perf.clip_per_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.clip_anim")}</th>
                <th>{t("perf.clip_has")}</th>
                <th>{t("perf.clip_masks")}</th>
                <th>{t("perf.clip_vertices")}</th>
                <th>{t("perf.clip_impact")}</th>
              </tr>
            </thead>
            <tbody>
              {clippingRows}
            </tbody>
          </table>
        </div>
        {!report.clippingRows.some((r) => r.hasClipping) && (
          <p className="performance-muted">{t("perf.clip_no_masks")}</p>
        )}
      </section>

      <section className="perf-section">
        <h3>{t("perf.blend_title")}</h3>
        <p>
          {t("perf.blend_worst_prefix")}{" "}
          <span className="impact-pill">
            {impactBadge(worstBlendSlots > 0 ? "Low" : "Minimal")}
          </span>
        </p>
        <h4 className="perf-subheading">{t("perf.blend_per_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.blend_anim")}</th>
                <th>{t("perf.blend_has")}</th>
                <th>{t("perf.blend_non_normal")}</th>
                <th>{t("perf.blend_additive")}</th>
                <th>{t("perf.blend_multiply")}</th>
                <th>{t("perf.blend_impact")}</th>
              </tr>
            </thead>
            <tbody>
              {blendRows}
            </tbody>
          </table>
        </div>
      </section>

      <section className="perf-section">
        <h3>{t("perf.constraints_title")}</h3>
        <p>
          {t("perf.constraints_worst_prefix")}{" "}
          <span className="impact-pill">{impactBadge(impactFromConstraints(worstConstraintActive))}</span>
        </p>
        <h4 className="perf-subheading">{t("perf.constraints_per_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.anim_col")}</th>
                <th>{t("perf.c_phys")}</th>
                <th>{t("perf.c_ik")}</th>
                <th>{t("perf.c_transform")}</th>
                <th>{t("perf.c_path")}</th>
                <th>{t("perf.c_total_active")}</th>
                <th>{t("perf.c_impact")}</th>
              </tr>
            </thead>
            <tbody>
              {constraintAnimRows}
            </tbody>
          </table>
        </div>

        <h4 className="perf-subheading">{t("perf.constraint_breakdown_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>{t("perf.constraint_type")}</th>
                <th>{t("perf.constraint_count")}</th>
                <th>{t("perf.constraint_share")}</th>
              </tr>
            </thead>
            <tbody>
              {constraintBreakdownRows}
            </tbody>
          </table>
        </div>

        <h4 className="perf-subheading">{t("perf.transform_constraints_heading")}</h4>
        <div className="perf-table-wrap">
          <table className="perf-table perf-table-tight">
            <thead>
              <tr>
                <th>{t("perf.t_name")}</th>
                <th>{t("perf.t_target")}</th>
                <th>{t("perf.t_bones")}</th>
                <th>{t("perf.t_mix")}</th>
                <th>{t("perf.t_status")}</th>
              </tr>
            </thead>
            <tbody>
              {transformConstraintRows}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="performance-footer performance-muted">{t("perf.footer")}</footer>
    </aside>
  );
}

export const PerformanceReportPanel = memo(PerformanceReportPanelInner);
