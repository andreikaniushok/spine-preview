import { Paper, Stack, Typography } from "@mui/material";
import { memo, useMemo } from "react";
import type { AtlasAnalysisReport, SkeletonStructureStats } from "../analytics";
import type { PerformanceSnapshot, SpineModel } from "../types";
import { useI18n } from "../i18n/useI18n";
import { DataTable, KvGrid } from "./components";

interface PerformanceReportPanelProps {
  metrics: PerformanceSnapshot;
  structure: SkeletonStructureStats | null;
  atlasReport: AtlasAnalysisReport | null;
  activeModel: SpineModel | null;
  modelCount: number;
  drawCalls: number | null;
}

function formatMs(value: number): string {
  return `${value.toFixed(2)} ms`;
}

function formatMemory(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
  const { metrics, structure, atlasReport, activeModel, modelCount, drawCalls } = props;
  const { t } = useI18n();

  const liveItems = useMemo(
    () => [
      { label: t("perf.avg_fps"), value: metrics.avgFps.toFixed(1) },
      { label: t("perf.avg_frame_time"), value: formatMs(metrics.avgFrameTimeMs) },
      { label: t("perf.draw_calls"), value: drawCalls ?? "—" },
      { label: t("perf.memory"), value: formatMemory(metrics.memoryBytes) },
      {
        label: t("perf.load_time"),
        value: activeModel ? formatMs(activeModel.loadTimeMs) : "—",
      },
    ],
    [metrics, drawCalls, activeModel, t],
  );

  const structureItems = useMemo(
    () => [
      { label: t("perf.skeleton_count"), value: modelCount },
      { label: t("perf.bones"), value: structure?.bones ?? "—" },
      { label: t("perf.slots"), value: structure?.slots ?? "—" },
      { label: t("perf.constraints"), value: structure?.constraints ?? "—" },
    ],
    [modelCount, structure, t],
  );

  const boneRows = useMemo(
    () =>
      structure?.boneAnchors.map((bone) => [
        bone.name,
        bone.parent ?? "—",
        bone.length,
        bone.isLeaf ? t("common.yes") : t("common.no"),
      ]) ?? [],
    [structure?.boneAnchors, t],
  );

  const atlasRows = useMemo(
    () =>
      atlasReport?.pages.map((page) => [
        page.fileName,
        `${page.width}×${page.height}`,
        page.regionCount,
        formatMemory(page.estimatedMemoryBytes),
        page.hasMipmaps ? t("common.yes") : t("common.no"),
      ]) ?? [],
    [atlasReport?.pages, t],
  );

  return (
    <Paper component="aside" square sx={panelSx}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{t("perf.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {activeModel
              ? t("perf.active_model", { name: activeModel.name })
              : t("perf.empty")}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.live_metrics")}</Typography>
          <KvGrid items={liveItems} />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.structure")}</Typography>
          <KvGrid items={structureItems} />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.text_bones_title")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t("perf.text_bones_hint")}
          </Typography>
          {boneRows.length > 0 ? (
            <DataTable
              columns={[
                { id: "name", label: t("perf.bone_name") },
                { id: "parent", label: t("perf.bone_parent") },
                { id: "len", label: t("perf.bone_length"), align: "right" },
                { id: "leaf", label: t("perf.bone_leaf") },
              ]}
              rows={boneRows}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("perf.text_bones_empty")}
            </Typography>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t("perf.atlas_memory_title")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t("perf.atlas_memory_hint")}
          </Typography>
          {atlasReport?.parseError ? (
            <Typography variant="body2" color="error">
              {atlasReport.parseError}
            </Typography>
          ) : atlasRows.length > 0 ? (
            <Stack spacing={1}>
              <KvGrid
                items={[
                  {
                    label: t("perf.atlas_memory_total"),
                    value: formatMemory(atlasReport?.totalEstimatedMemoryBytes),
                  },
                  {
                    label: t("perf.atlas_pages"),
                    value: atlasReport?.totalPages ?? 0,
                  },
                ]}
              />
              <DataTable
                columns={[
                  { id: "file", label: t("perf.texture") },
                  { id: "size", label: t("perf.size") },
                  { id: "regions", label: t("perf.regions"), align: "right" },
                  { id: "ram", label: t("perf.atlas_ram"), align: "right" },
                  { id: "mips", label: t("perf.atlas_mipmaps") },
                ]}
                rows={atlasRows}
              />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("perf.atlas_memory_empty")}
            </Typography>
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {t("perf.footer")}
        </Typography>
      </Stack>
    </Paper>
  );
}

export const PerformanceReportPanel = memo(PerformanceReportPanelInner);
