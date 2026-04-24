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

interface PerformanceReportPanelProps {
  report: SpinePerformanceReport | null;
  atlasReport: AtlasAnalysisReport | null;
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

export function PerformanceReportPanel(props: PerformanceReportPanelProps) {
  const { report, atlasReport, baseline, onCaptureBaseline, onClearBaseline } = props;
  const { t } = useI18n();

  if (!report) {
    return (
      <aside className="performance-panel performance-panel-empty">
        <h2 className="performance-title">{t("perf.title")}</h2>
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

      {atlasReport && (
        <section className="perf-section">
          <h3>{t("perf.texture_atlas")}</h3>
          <p className="performance-muted">
            {t("perf.atlas_parsed_lead")} <code>TextureAtlas</code> {t("perf.atlas_parsed_from")}{" "}
            <strong>{atlasReport.atlasFileName}</strong>.
          </p>
          {atlasReport.parseError ? (
            <p className="performance-atlas-error">
              {t("perf.parse_error")} {atlasReport.parseError}
            </p>
          ) : (
            <>
              <h4 className="perf-subheading">{t("perf.atlas_summary")}</h4>
              <div className="perf-kv-grid">
                <span className="perf-k">{t("control.pages")}</span>
                <span className="perf-v">{atlasReport.totalPages}</span>
                <span className="perf-k">{t("control.regions")}</span>
                <span className="perf-v">{atlasReport.totalRegions}</span>
                {atlasReport.renderPasses ? (
                  <>
                    <span className="perf-k">{t("control.draw_calls")}</span>
                    <span className="perf-v">{atlasReport.renderPasses.estimatedDrawCalls}</span>
                    <span className="perf-k">{t("control.page_switches")}</span>
                    <span className="perf-v">{atlasReport.renderPasses.texturePageSwitches}</span>
                  </>
                ) : null}
              </div>
              {atlasReport.renderPasses && (
                <p className="performance-muted">{t("perf.atlas_draw_hint")}</p>
              )}
              <div className="perf-kv-grid">
                <span className="perf-k">{t("perf.page_pixels")}</span>
                <span className="perf-v">{atlasReport.totalPagePixels.toLocaleString()}</span>
                <span className="perf-k">{t("perf.packed_rect_pixels")}</span>
                <span className="perf-v">{atlasReport.totalPackedPixels.toLocaleString()}</span>
                <span className="perf-k">{t("perf.utilization_packed")}</span>
                <span className="perf-v">{atlasReport.overallUtilizationPercent.toFixed(1)}%</span>
              </div>

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
                  <tbody>
                    {atlasReport.pages.map((p) => (
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
                    ))}
                  </tbody>
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
                  <tbody>
                    {atlasReport.topRegionsByArea.map((r) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

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
              {report.perAnimation.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.durationSec.toFixed(2)}s</td>
                  <td>{row.renderImpact}</td>
                  <td>{row.computeImpact}</td>
                  <td>{row.activeFeatures}</td>
                </tr>
              ))}
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
              {report.perAnimationMeshes.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.activeMeshes}</td>
                  <td>{row.totalVertices}</td>
                  <td>{row.deformedVertices}</td>
                  <td>{row.weightedBoneRefs}</td>
                  <td>{row.renderImpact}</td>
                </tr>
              ))}
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
              {report.globalMeshTop.map((row) => (
                <tr key={row.slotName}>
                  <td>{row.slotName}</td>
                  <td>{row.vertices}</td>
                  <td>{row.deformed ? t("common.yes") : t("common.no")}</td>
                  <td>{row.boneWeights}</td>
                  <td>{row.hasParentMesh ? t("common.yes") : t("common.no")}</td>
                </tr>
              ))}
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
              {report.clippingRows.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.hasClipping ? t("common.yes") : t("common.no")}</td>
                  <td>{row.activeMasks}</td>
                  <td>{row.clipVertices}</td>
                  <td>{row.impact}</td>
                </tr>
              ))}
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
              {report.blendRows.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.hasBlendModes ? t("common.yes") : t("common.no")}</td>
                  <td>{row.maxNonNormal}</td>
                  <td>{row.maxAdditive}</td>
                  <td>{row.maxMultiply}</td>
                  <td>{row.impact}</td>
                </tr>
              ))}
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
              {report.constraintAnimRows.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.physics}</td>
                  <td>{row.ik}</td>
                  <td>{row.transform}</td>
                  <td>{row.path}</td>
                  <td>{row.totalActive}</td>
                  <td>{row.impact}</td>
                </tr>
              ))}
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
              {report.constraintBreakdown.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.count}</td>
                  <td>{row.percentOfTotal.toFixed(1)}%</td>
                </tr>
              ))}
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
              {report.transformConstraintDetails.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.targetBone}</td>
                  <td>{row.boneCount}</td>
                  <td className="perf-cell-mono">{row.mixSummary}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="performance-footer performance-muted">{t("perf.footer")}</footer>
    </aside>
  );
}
