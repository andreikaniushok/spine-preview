import { Box, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
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

/** Isolated so FPS ticks don't rebuild bone/atlas tables. */
const LiveMetricsSection = memo(function LiveMetricsSection({
  metrics,
  drawCalls,
  loadTimeMs,
}: {
  metrics: PerformanceSnapshot;
  drawCalls: number | null;
  loadTimeMs: number | null;
}) {
  const { t } = useI18n();
  const items = useMemo(
    () => [
      // Same fields/rounding as the scene HUD — not a separate rolling average.
      { label: t("scene.fps"), value: metrics.fps.toFixed(0) },
      { label: t("scene.frame_ms"), value: formatMs(metrics.frameTimeMs) },
      { label: t("perf.draw_calls"), value: drawCalls ?? "—" },
      { label: t("perf.memory"), value: formatMemory(metrics.memoryBytes) },
      {
        label: t("perf.load_time"),
        value: loadTimeMs == null ? "—" : formatMs(loadTimeMs),
      },
    ],
    [metrics, drawCalls, loadTimeMs, t],
  );

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t("perf.live_metrics")}</Typography>
      <KvGrid items={items} />
    </Stack>
  );
});

const StaticAnalyticsSections = memo(function StaticAnalyticsSections({
  structure,
  atlasReport,
  modelCount,
}: {
  structure: SkeletonStructureStats | null;
  atlasReport: AtlasAnalysisReport | null;
  modelCount: number;
}) {
  const { t } = useI18n();

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
    <>
      <Stack spacing={1}>
        <Typography variant="subtitle2">{t("perf.structure")}</Typography>
        <KvGrid items={structureItems} />
      </Stack>

      <Stack spacing={1} sx={{ minWidth: 0 }}>
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

      <Stack spacing={1} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{t("perf.atlas_memory_title")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("perf.atlas_memory_hint")}
        </Typography>
        {atlasReport?.parseError ? (
          <Typography variant="body2" color="error">
            {atlasReport.parseError}
          </Typography>
        ) : atlasRows.length > 0 ? (
          <Stack spacing={1} sx={{ minWidth: 0 }}>
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
    </>
  );
});

function PerformanceReportPanelInner(props: PerformanceReportPanelProps) {
  const { metrics, structure, atlasReport, activeModel, modelCount, drawCalls } = props;
  const { t } = useI18n();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      component="aside"
      square
      elevation={0}
      sx={
        isPhone
          ? {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
              width: "100%",
              maxWidth: "100%",
              height: "min(36dvh, 240px)",
              maxHeight: "min(36dvh, 240px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderTop: 1,
              borderColor: "divider",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
              bgcolor: "background.paper",
              pb: "env(safe-area-inset-bottom, 0px)",
            }
          : {
              gridArea: "analytics",
              position: "static",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderLeft: 1,
              borderTop: 0,
              borderColor: "divider",
              borderRadius: 0,
              boxShadow: "none",
              bgcolor: "background.paper",
            }
      }
    >
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 1.25, md: 2 },
          pt: { xs: 1.25, md: 2 },
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: { xs: "1rem", md: "1.25rem" }, lineHeight: 1.3 }}
        >
          {t("perf.title")}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activeModel
            ? t("perf.active_model", { name: activeModel.name })
            : t("perf.empty")}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          px: { xs: 1.25, md: 2 },
          pt: 1.5,
          pb: 2,
        }}
      >
        <Stack spacing={{ xs: 1.75, md: 2.5 }} sx={{ width: "100%", minWidth: 0 }}>
          <LiveMetricsSection
            metrics={metrics}
            drawCalls={drawCalls}
            loadTimeMs={activeModel?.loadTimeMs ?? null}
          />
          <StaticAnalyticsSections
            structure={structure}
            atlasReport={atlasReport}
            modelCount={modelCount}
          />
        </Stack>
      </Box>
    </Paper>
  );
}

export const PerformanceReportPanel = memo(PerformanceReportPanelInner);
