import type { AtlasAnalysisReport } from "../analysis/atlasAnalysis";
import type { ImpactLevel, SpinePerformanceReport } from "../analysis/spinePerformanceReport";
import {
  impactFromConstraints,
  impactFromVertices,
  summarizeImpactForCompare,
} from "../analysis/spinePerformanceReport";
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

function compareLine(
  label: string,
  a: ImpactLevel | number | string,
  b: ImpactLevel | number | string,
): string {
  if (typeof a === "number" && typeof b === "number") {
    const d = b - a;
    const arrow = d === 0 ? "=" : d > 0 ? "up" : "down";
    return `${label}: A ${a} -> B ${b} (${arrow})`;
  }
  if (typeof a === "string" && typeof b === "string") {
    return `${label}: A ${a} / B ${b}`;
  }
  const na = summarizeImpactForCompare(a as ImpactLevel);
  const nb = summarizeImpactForCompare(b as ImpactLevel);
  const arrow = nb === na ? "=" : nb > na ? "up" : "down";
  return `${label}: A ${a} -> B ${b} (${arrow})`;
}

export function PerformanceReportPanel(props: PerformanceReportPanelProps) {
  const { report, atlasReport, baseline, onCaptureBaseline, onClearBaseline } = props;

  if (!report) {
    return (
      <aside className="performance-panel performance-panel-empty">
        <h2 className="performance-title">Spine performance analysis</h2>
        <p className="performance-muted">Load a skeleton to see the report.</p>
      </aside>
    );
  }

  const cmp = baseline
    ? {
        ri: compareLine("RI (render)", baseline.report.renderingImpact, report.renderingImpact),
        ci: compareLine("CI (compute)", baseline.report.computeImpact, report.computeImpact),
        verts: compareLine(
          "Peak vertices",
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
        <h2 className="performance-title">Spine performance analysis</h2>
        <div className="ri-ci-scores" aria-label="Summary impact scores">
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
          Skeleton: <strong>{report.skeletonName ?? "Unnamed"}</strong>
        </p>
        <div className="performance-baseline-actions">
          <button type="button" onClick={onCaptureBaseline}>
            Capture current as baseline A
          </button>
          <button type="button" className="secondary" onClick={onClearBaseline} disabled={!baseline}>
            Clear A
          </button>
        </div>
        {baseline && (
          <p className="performance-baseline-hint">
            Baseline A: <strong>{baseline.modelName}</strong> ({baseline.label}). The active skeleton is{" "}
            <strong>B</strong> for comparison.
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
        <h3>Summary</h3>
        <div className="perf-kv-grid">
          <span className="perf-k">Bones</span>
          <span className="perf-v">{report.boneCount}</span>
          <span className="perf-k">Animations</span>
          <span className="perf-v">{report.animationCount}</span>
          <span className="perf-k">Skins</span>
          <span className="perf-v">{report.skinCount}</span>
          <span className="perf-k">Max bone depth</span>
          <span className="perf-v">{report.maxBoneDepth}</span>
        </div>
      </section>

      {atlasReport && (
        <section className="perf-section">
          <h3>Texture atlas</h3>
          <p className="performance-muted">
            Parsed with Spine <code>TextureAtlas</code> from <strong>{atlasReport.atlasFileName}</strong>.
          </p>
          {atlasReport.parseError ? (
            <p className="performance-atlas-error">Parse error: {atlasReport.parseError}</p>
          ) : (
            <>
              <h4 className="perf-subheading">Atlas summary</h4>
              <div className="perf-kv-grid">
                <span className="perf-k">Pages</span>
                <span className="perf-v">{atlasReport.totalPages}</span>
                <span className="perf-k">Regions</span>
                <span className="perf-v">{atlasReport.totalRegions}</span>
                {atlasReport.renderPasses ? (
                  <>
                    <span className="perf-k">Draw calls</span>
                    <span className="perf-v">{atlasReport.renderPasses.estimatedDrawCalls}</span>
                    <span className="perf-k">Page switches</span>
                    <span className="perf-v">{atlasReport.renderPasses.texturePageSwitches}</span>
                  </>
                ) : null}
              </div>
              {atlasReport.renderPasses && (
                <p className="performance-muted">
                  Draw calls and page switches are estimated from <code>drawOrder</code> for slots with region/mesh
                  attachments bound to an atlas region: a new batch is assumed when the texture page or{" "}
                  <code>BlendMode</code> changes (typical batching split, not a GPU driver count).
                </p>
              )}
              <div className="perf-kv-grid">
                <span className="perf-k">Page pixels</span>
                <span className="perf-v">{atlasReport.totalPagePixels.toLocaleString()}</span>
                <span className="perf-k">Packed rect pixels</span>
                <span className="perf-v">{atlasReport.totalPackedPixels.toLocaleString()}</span>
                <span className="perf-k">Utilization (packed / page)</span>
                <span className="perf-v">{atlasReport.overallUtilizationPercent.toFixed(1)}%</span>
              </div>

              <h4 className="perf-subheading">Pages</h4>
              <div className="perf-table-wrap">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Texture</th>
                      <th>Size</th>
                      <th>Regions</th>
                      <th>Utilization</th>
                      <th>Filter</th>
                      <th>Wrap U/V</th>
                      <th>PMA</th>
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
                        <td>{p.premultipliedAlpha ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {atlasReport.linkage && (
                <>
                  <h4 className="perf-subheading">Atlas vs skeleton skins</h4>
                  <div className="perf-kv-grid">
                    <span className="perf-k">Distinct attachment texture paths</span>
                    <span className="perf-v">{atlasReport.linkage.attachmentTexturePaths}</span>
                    <span className="perf-k">Resolved in atlas</span>
                    <span className="perf-v">{atlasReport.linkage.resolvedInAtlas}</span>
                    <span className="perf-k">Missing in atlas</span>
                    <span className="perf-v">{atlasReport.linkage.missingInAtlas}</span>
                    <span className="perf-k">Unused atlas regions</span>
                    <span className="perf-v">{atlasReport.linkage.orphanRegions}</span>
                  </div>
                  <p className="performance-muted">
                    Matching uses each region/mesh <code>path</code> (fallback <code>name</code>) against{" "}
                    <code>TextureAtlas.findRegion</code>, then the file base name if needed.
                  </p>
                </>
              )}

              <h4 className="perf-subheading">Largest regions (by packed pixel area)</h4>
              <div className="perf-table-wrap">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Page</th>
                      <th>xy</th>
                      <th>size</th>
                      <th>Pixels</th>
                      <th>Rot</th>
                      <th>Original</th>
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
                        <td>{r.rotated ? "Yes" : "No"}</td>
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
        <h3>Rendering impact</h3>
        <p>
          <span className="impact-pill">{impactBadge(report.renderingImpact)}</span>{" "}
          <span className="performance-muted">
            {report.peakVerticesSampled} peak vertices (max across animation time samples)
          </span>
        </p>
      </section>

      <section className="perf-section">
        <h3>Computational impact</h3>
        <p>
          <span className="impact-pill">{impactBadge(report.computeImpact)}</span>{" "}
          <span className="performance-muted">
            {report.totalWeightedBoneRefsWorst} weighted bone references (max), {report.constraintCountData}{" "}
            constraints in skeleton data
          </span>
        </p>
      </section>

      <section className="perf-section">
        <h3>Animation impact overview</h3>
        <ul className="perf-list">
          <li>Total animations: {report.animationCount}</li>
          <li>With physics: {report.animationsWithPhysics}</li>
          <li>With clipping: {report.animationsWithClipping}</li>
          <li>With special blend modes: {report.animationsWithSpecialBlend}</li>
        </ul>
      </section>

      <section className="perf-section">
        <h3>Per-animation impact</h3>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Duration</th>
                <th>Rendering impact</th>
                <th>Computational impact</th>
                <th>Active features</th>
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
        <h3>Global skeleton statistics</h3>
        <div className="perf-kv-grid">
          <span className="perf-k">Total bones</span>
          <span className="perf-v">{report.boneCount}</span>
          <span className="perf-k">Max bone depth</span>
          <span className="perf-v">{report.maxBoneDepth}</span>
          <span className="perf-k">Total animations</span>
          <span className="perf-v">{report.animationCount}</span>
          <span className="perf-k">Skins</span>
          <span className="perf-v">{report.skinCount}</span>
        </div>
      </section>

      <section className="perf-section">
        <h3>Mesh statistics</h3>
        <p>
          Worst-case impact: <span className="impact-pill">{impactBadge(report.renderingImpact)}</span>
        </p>
        <h4 className="perf-subheading">Per-animation breakdown</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Active meshes</th>
                <th>Total vertices</th>
                <th>Deformed</th>
                <th>Weighted</th>
                <th>Impact</th>
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
        <h3>Global mesh details</h3>
        <p className="performance-muted">
          Showing top {report.globalMeshTop.length} meshes by vertex count. Total: {report.globalMeshTotalSlots} meshes
        </p>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Slot / attachment</th>
                <th>Vertices</th>
                <th>Deformed</th>
                <th>Bone weights</th>
                <th>Parent mesh</th>
              </tr>
            </thead>
            <tbody>
              {report.globalMeshTop.map((row) => (
                <tr key={row.slotName}>
                  <td>{row.slotName}</td>
                  <td>{row.vertices}</td>
                  <td>{row.deformed ? "Yes" : "No"}</td>
                  <td>{row.boneWeights}</td>
                  <td>{row.hasParentMesh ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="perf-section">
        <h3>Clipping masks</h3>
        <p>
          Worst-case impact:{" "}
          <span className="impact-pill">{impactBadge(impactFromVertices(worstClipVertices))}</span>
        </p>
        <h4 className="perf-subheading">Per-animation breakdown</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Has clipping</th>
                <th>Active masks</th>
                <th>Total vertices</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {report.clippingRows.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.hasClipping ? "Yes" : "No"}</td>
                  <td>{row.activeMasks}</td>
                  <td>{row.clipVertices}</td>
                  <td>{row.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!report.clippingRows.some((r) => r.hasClipping) && (
          <p className="performance-muted">No active clipping masks found on the sampled poses.</p>
        )}
      </section>

      <section className="perf-section">
        <h3>Blend modes</h3>
        <p>
          Worst-case impact:{" "}
          <span className="impact-pill">
            {impactBadge(worstBlendSlots > 0 ? "Low" : "Minimal")}
          </span>
        </p>
        <h4 className="perf-subheading">Per-animation breakdown (maximum concurrent)</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Has blend modes</th>
                <th>Max non-normal</th>
                <th>Max additive</th>
                <th>Max multiply</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {report.blendRows.map((row) => (
                <tr key={row.animation}>
                  <td>{row.animation}</td>
                  <td>{row.hasBlendModes ? "Yes" : "No"}</td>
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
        <h3>Constraints</h3>
        <p>
          Worst-case impact:{" "}
          <span className="impact-pill">{impactBadge(impactFromConstraints(worstConstraintActive))}</span>
        </p>
        <h4 className="perf-subheading">Per-animation breakdown</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Animation</th>
                <th>Physics</th>
                <th>IK</th>
                <th>Transform</th>
                <th>Path</th>
                <th>Total active</th>
                <th>Impact</th>
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

        <h4 className="perf-subheading">Constraint impact breakdown</h4>
        <div className="perf-table-wrap">
          <table className="perf-table">
            <thead>
              <tr>
                <th>Constraint type</th>
                <th>Count</th>
                <th>Share of all constraints</th>
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

        <h4 className="perf-subheading">Transform constraints</h4>
        <div className="perf-table-wrap">
          <table className="perf-table perf-table-tight">
            <thead>
              <tr>
                <th>Name</th>
                <th>Target</th>
                <th>Bones</th>
                <th>Mix values</th>
                <th>Status</th>
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

      <footer className="performance-footer performance-muted">
        RI/CI bands map raw runtime metrics (vertices, weights, deform, constraint counts) to labels; they are not identical
        to Spine Editor. Animations are sampled uniformly in time (~45 Hz, capped) on a cloned skeleton with{" "}
        <code>Physics.update</code>.
      </footer>
    </aside>
  );
}
