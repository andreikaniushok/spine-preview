import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { memo, useMemo } from "react";
import {
  impactFromConstraints,
  impactFromVertices,
  summarizeImpactForCompare,
  type AtlasAnalysisReport,
  type ImpactLevel,
  type PerformanceBaseline,
  type SpinePerformanceReport,
} from "../analytics";
import type { BenchmarkUiState, SpineModel } from "../types";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/messages";
import type { MessageVars } from "../i18n/types";
import { AtlasAssetsSection } from "./AtlasAssetsSection";
import { BenchmarkPanel } from "./BenchmarkPanel";
import { DataTable, KvGrid } from "./components";

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

type Translate = (key: MessageKey, vars?: MessageVars) => string;

function impactColor(level: ImpactLevel): "default" | "success" | "info" | "warning" | "error" {
  switch (level) {
    case "Minimal":
      return "success";
    case "Low":
      return "info";
    case "Moderate":
      return "warning";
    case "High":
      return "error";
    default:
      return "default";
  }
}

function ImpactChip({ level }: { level: ImpactLevel }) {
  return <Chip size="small" label={level} color={impactColor(level)} variant="outlined" />;
}

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

const panelSx = {
  gridArea: "analytics",
  borderLeft: { xs: 0, md: 1 },
  borderTop: { xs: 1, md: 0 },
  borderColor: "divider",
  p: { xs: 1.25, md: 2 },
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  minHeight: 0,
  height: "100%",
  bgcolor: "background.paper",
} as const;

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

  const benchmarkPanel = (
    <BenchmarkPanel
      state={benchmark}
      onStart={onBenchmarkStart}
      onStop={onBenchmarkStop}
      onClear={onBenchmarkClear}
    />
  );

  const perAnimationRows = useMemo(
    () =>
      report?.perAnimation.map((row) => [
        row.name,
        `${row.durationSec.toFixed(2)}s`,
        row.renderImpact,
        row.computeImpact,
        row.activeFeatures,
      ]) ?? [],
    [report?.perAnimation],
  );
  const perAnimationMeshesRows = useMemo(
    () =>
      report?.perAnimationMeshes.map((row) => [
        row.animation,
        row.activeMeshes,
        row.totalVertices,
        row.deformedVertices,
        row.weightedBoneRefs,
        row.renderImpact,
      ]) ?? [],
    [report?.perAnimationMeshes],
  );
  const globalMeshRows = useMemo(
    () =>
      report?.globalMeshTop.map((row) => [
        row.slotName,
        row.vertices,
        row.deformed ? t("common.yes") : t("common.no"),
        row.boneWeights,
        row.hasParentMesh ? t("common.yes") : t("common.no"),
      ]) ?? [],
    [report?.globalMeshTop, t],
  );
  const clippingRows = useMemo(
    () =>
      report?.clippingRows.map((row) => [
        row.animation,
        row.hasClipping ? t("common.yes") : t("common.no"),
        row.activeMasks,
        row.clipVertices,
        row.impact,
      ]) ?? [],
    [report?.clippingRows, t],
  );
  const blendRows = useMemo(
    () =>
      report?.blendRows.map((row) => [
        row.animation,
        row.hasBlendModes ? t("common.yes") : t("common.no"),
        row.maxNonNormal,
        row.maxAdditive,
        row.maxMultiply,
        row.impact,
      ]) ?? [],
    [report?.blendRows, t],
  );
  const constraintAnimRows = useMemo(
    () =>
      report?.constraintAnimRows.map((row) => [
        row.animation,
        row.physics,
        row.ik,
        row.transform,
        row.path,
        row.totalActive,
        row.impact,
      ]) ?? [],
    [report?.constraintAnimRows],
  );
  const constraintBreakdownRows = useMemo(
    () =>
      report?.constraintBreakdown.map((row) => [
        row.type,
        row.count,
        `${row.percentOfTotal.toFixed(1)}%`,
      ]) ?? [],
    [report?.constraintBreakdown],
  );
  const transformConstraintRows = useMemo(
    () =>
      report?.transformConstraintDetails.map((row) => [
        row.name,
        row.targetBone,
        row.boneCount,
        row.mixSummary,
        row.status,
      ]) ?? [],
    [report?.transformConstraintDetails],
  );

  if (!report) {
    return (
      <Paper component="aside" square sx={panelSx}>
        <Stack spacing={2}>
          <Typography variant="h6">{t("perf.title")}</Typography>
          <AtlasAssetsSection activeModel={activeModel} atlasReport={atlasReport} />
          {benchmarkPanel}
          <Typography variant="body2" color="text.secondary">
            {t("perf.empty")}
          </Typography>
        </Stack>
      </Paper>
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
  const worstConstraintActive = report.constraintAnimRows.reduce(
    (m, r) => Math.max(m, r.totalActive),
    0,
  );
  const worstClipVertices = report.clippingRows.reduce((m, r) => Math.max(m, r.clipVertices), 0);
  const worstBlendSlots = report.blendRows.reduce(
    (m, r) => Math.max(m, r.maxAdditive + r.maxMultiply + r.maxNonNormal),
    0,
  );

  return (
    <Paper component="aside" square sx={panelSx}>
      <Stack spacing={2.5}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="h6">{t("perf.title")}</Typography>
            <Stack direction="row" spacing={1} aria-label={t("perf.compare_aria")}>
              <Chip label={`RI ${riScore}`} size="small" color="primary" variant="outlined" />
              <Chip label={`CI ${ciScore}`} size="small" color="secondary" variant="outlined" />
            </Stack>
          </Stack>
          <Typography variant="body2">
            {t("perf.skeleton")}{" "}
            <Box component="strong">{report.skeletonName ?? t("perf.unnamed")}</Box>
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onCaptureBaseline}>
              {t("perf.capture_baseline")}
            </Button>
            <Button onClick={onClearBaseline} disabled={!baseline}>
              {t("perf.clear_baseline")}
            </Button>
          </Stack>
          {baseline ? (
            <Typography variant="caption" color="text.secondary">
              {t("perf.baseline_hint", { model: baseline.modelName, label: baseline.label })}
            </Typography>
          ) : null}
          {cmp ? (
            <Stack spacing={0.5} role="status">
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="caption">RI</Typography>
                <ImpactChip level={report.renderingImpact} />
                <Typography variant="caption">CI</Typography>
                <ImpactChip level={report.computeImpact} />
              </Stack>
              <Typography variant="caption">{cmp.ri}</Typography>
              <Typography variant="caption">{cmp.ci}</Typography>
              <Typography variant="caption">{cmp.verts}</Typography>
            </Stack>
          ) : null}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.summary")}</Typography>
          <KvGrid
            items={[
              { label: t("perf.bones"), value: report.boneCount },
              { label: t("perf.animations"), value: report.animationCount },
              { label: t("perf.skins"), value: report.skinCount },
              { label: t("perf.max_bone_depth"), value: report.maxBoneDepth },
            ]}
          />
        </Stack>

        <AtlasAssetsSection activeModel={activeModel} atlasReport={atlasReport} />
        {benchmarkPanel}

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.rendering_impact")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <ImpactChip level={report.renderingImpact} />
            <Typography variant="caption" color="text.secondary">
              {t("perf.peak_vertices_caption", { count: report.peakVerticesSampled })}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.compute_impact")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <ImpactChip level={report.computeImpact} />
            <Typography variant="caption" color="text.secondary">
              {t("perf.weighted_bone_caption", {
                weighted: report.totalWeightedBoneRefsWorst,
                constraints: report.constraintCountData,
              })}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{t("perf.anim_overview")}</Typography>
          <Typography variant="body2">
            {t("perf.anim_total")} {report.animationCount}
          </Typography>
          <Typography variant="body2">
            {t("perf.anim_physics")} {report.animationsWithPhysics}
          </Typography>
          <Typography variant="body2">
            {t("perf.anim_clipping")} {report.animationsWithClipping}
          </Typography>
          <Typography variant="body2">
            {t("perf.anim_blend")} {report.animationsWithSpecialBlend}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.per_animation")}</Typography>
          <DataTable
            columns={[
              { id: "a", label: t("perf.anim_col") },
              { id: "d", label: t("perf.duration_col") },
              { id: "ri", label: t("perf.render_impact_col") },
              { id: "ci", label: t("perf.compute_impact_col") },
              { id: "f", label: t("perf.active_features_col") },
            ]}
            rows={perAnimationRows}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.global_skeleton")}</Typography>
          <KvGrid
            items={[
              { label: t("perf.total_bones"), value: report.boneCount },
              { label: t("perf.max_bone_depth"), value: report.maxBoneDepth },
              { label: t("perf.total_animations_label"), value: report.animationCount },
              { label: t("perf.skins"), value: report.skinCount },
            ]}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.mesh_stats")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2">{t("perf.mesh_worst_prefix")}</Typography>
            <ImpactChip level={report.renderingImpact} />
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.mesh_per_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "a", label: t("perf.anim_col") },
              { id: "m", label: t("perf.mesh_active") },
              { id: "v", label: t("perf.mesh_total_vertices") },
              { id: "d", label: t("perf.mesh_deformed") },
              { id: "w", label: t("perf.mesh_weighted") },
              { id: "i", label: t("perf.mesh_impact") },
            ]}
            rows={perAnimationMeshesRows}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.global_mesh_detail")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t("perf.global_mesh_showing", {
              shown: report.globalMeshTop.length,
              total: report.globalMeshTotalSlots,
            })}
          </Typography>
          <DataTable
            columns={[
              { id: "s", label: t("perf.mesh_slot") },
              { id: "v", label: t("perf.mesh_vertices") },
              { id: "d", label: t("perf.mesh_deformed_col") },
              { id: "b", label: t("perf.mesh_bone_weights") },
              { id: "p", label: t("perf.mesh_parent") },
            ]}
            rows={globalMeshRows}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.clipping_title")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2">{t("perf.clip_worst_prefix")}</Typography>
            <ImpactChip level={impactFromVertices(worstClipVertices)} />
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.clip_per_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "a", label: t("perf.clip_anim") },
              { id: "h", label: t("perf.clip_has") },
              { id: "m", label: t("perf.clip_masks") },
              { id: "v", label: t("perf.clip_vertices") },
              { id: "i", label: t("perf.clip_impact") },
            ]}
            rows={clippingRows}
          />
          {!report.clippingRows.some((r) => r.hasClipping) ? (
            <Typography variant="caption" color="text.secondary">
              {t("perf.clip_no_masks")}
            </Typography>
          ) : null}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.blend_title")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2">{t("perf.blend_worst_prefix")}</Typography>
            <ImpactChip level={worstBlendSlots > 0 ? "Low" : "Minimal"} />
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.blend_per_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "a", label: t("perf.blend_anim") },
              { id: "h", label: t("perf.blend_has") },
              { id: "n", label: t("perf.blend_non_normal") },
              { id: "ad", label: t("perf.blend_additive") },
              { id: "mu", label: t("perf.blend_multiply") },
              { id: "i", label: t("perf.blend_impact") },
            ]}
            rows={blendRows}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.constraints_title")}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2">{t("perf.constraints_worst_prefix")}</Typography>
            <ImpactChip level={impactFromConstraints(worstConstraintActive)} />
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.constraints_per_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "a", label: t("perf.anim_col") },
              { id: "p", label: t("perf.c_phys") },
              { id: "ik", label: t("perf.c_ik") },
              { id: "tr", label: t("perf.c_transform") },
              { id: "pa", label: t("perf.c_path") },
              { id: "t", label: t("perf.c_total_active") },
              { id: "i", label: t("perf.c_impact") },
            ]}
            rows={constraintAnimRows}
          />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.constraint_breakdown_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "ty", label: t("perf.constraint_type") },
              { id: "c", label: t("perf.constraint_count") },
              { id: "s", label: t("perf.constraint_share") },
            ]}
            rows={constraintBreakdownRows}
          />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {t("perf.transform_constraints_heading")}
          </Typography>
          <DataTable
            columns={[
              { id: "n", label: t("perf.t_name") },
              { id: "tg", label: t("perf.t_target") },
              { id: "b", label: t("perf.t_bones") },
              { id: "m", label: t("perf.t_mix") },
              { id: "st", label: t("perf.t_status") },
            ]}
            rows={transformConstraintRows}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {t("perf.footer")}
        </Typography>
      </Stack>
    </Paper>
  );
}

export const PerformanceReportPanel = memo(PerformanceReportPanelInner);
