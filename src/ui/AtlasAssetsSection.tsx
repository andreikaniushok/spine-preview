import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { AtlasAnalysisReport } from "../analytics";
import { useI18n } from "../i18n/useI18n";
import type { SpineModel } from "../types";
import { DataTable, KvGrid } from "./components";

export function AtlasAssetsSection({
  activeModel,
  atlasReport,
}: {
  activeModel: SpineModel | null;
  atlasReport: AtlasAnalysisReport | null;
}) {
  const { t } = useI18n();
  const [largestRegionsOpen, setLargestRegionsOpen] = useState(false);

  const pageColumns = useMemo(
    () => [
      { id: "tex", label: t("perf.texture") },
      { id: "size", label: t("perf.size") },
      { id: "regions", label: t("perf.regions") },
      { id: "util", label: t("perf.utilization") },
      { id: "filter", label: t("perf.filter") },
      { id: "wrap", label: t("perf.wrap_uv") },
      { id: "pma", label: t("perf.pma") },
    ],
    [t],
  );

  const pageRows = useMemo(
    () =>
      atlasReport?.pages.map((p) => [
        p.fileName,
        `${p.width}×${p.height}`,
        p.regionCount,
        `${p.utilizationPercent.toFixed(1)}%`,
        `${p.filterMin} / ${p.filterMag}`,
        `${p.wrapU} / ${p.wrapV}`,
        p.premultipliedAlpha ? t("common.yes") : t("common.no"),
      ]) ?? [],
    [atlasReport?.pages, t],
  );

  const regionColumns = useMemo(
    () => [
      { id: "name", label: t("perf.region_col") },
      { id: "page", label: t("perf.page_col") },
      { id: "xy", label: t("perf.xy_col") },
      { id: "size", label: t("perf.size_col") },
      { id: "px", label: t("perf.pixels_col") },
      { id: "rot", label: t("perf.rot_col") },
      { id: "orig", label: t("perf.original_col") },
    ],
    [t],
  );

  const regionRows = useMemo(
    () =>
      atlasReport?.topRegionsByArea.slice(0, 10).map((r) => [
        r.name,
        r.page,
        `${r.x}, ${r.y}`,
        `${r.width}×${r.height}`,
        r.pixelArea.toLocaleString(),
        r.rotated ? t("common.yes") : t("common.no"),
        `${r.originalWidth}×${r.originalHeight}`,
      ]) ?? [],
    [atlasReport?.topRegionsByArea, t],
  );

  return (
    <Stack spacing={1.5} component="section">
      <Typography variant="subtitle2">{t("control.assets")}</Typography>
      {!activeModel ? (
        <Typography variant="body2" color="text.secondary">
          {t("control.assets_load_hint")}
        </Typography>
      ) : (
        <>
          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary">
              {t("control.sk_label")}:{" "}
              <Box component="code" sx={{ fontSize: "0.75rem" }}>
                {activeModel.skeletonFileName}
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("control.atlas_label")}:{" "}
              <Box component="code" sx={{ fontSize: "0.75rem" }}>
                {activeModel.atlasFileName}
              </Box>
            </Typography>
          </Stack>

          {atlasReport?.parseError ? (
            <Alert severity="error" variant="outlined">
              {t("control.atlas_parse_prefix")} {atlasReport.parseError}
            </Alert>
          ) : atlasReport ? (
            <>
              <KvGrid
                items={[
                  { label: t("control.pages"), value: atlasReport.totalPages },
                  { label: t("control.regions"), value: atlasReport.totalRegions },
                  {
                    label: t("control.draw_calls"),
                    value: atlasReport.renderPasses?.estimatedDrawCalls ?? "—",
                  },
                  {
                    label: t("control.page_switches"),
                    value: atlasReport.renderPasses?.texturePageSwitches ?? "—",
                  },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                {t("control.assets_stats_hint")}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t("perf.pages_table")}
              </Typography>
              <DataTable columns={pageColumns} rows={pageRows} />
              {atlasReport.linkage ? (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {t("perf.atlas_vs_skins")}
                  </Typography>
                  <KvGrid
                    items={[
                      {
                        label: t("perf.distinct_paths"),
                        value: atlasReport.linkage.attachmentTexturePaths,
                      },
                      {
                        label: t("perf.resolved_in_atlas"),
                        value: atlasReport.linkage.resolvedInAtlas,
                      },
                      {
                        label: t("perf.missing_in_atlas"),
                        value: atlasReport.linkage.missingInAtlas,
                      },
                      {
                        label: t("perf.unused_regions"),
                        value: atlasReport.linkage.orphanRegions,
                      },
                    ]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t("perf.atlas_match_hint")}
                  </Typography>
                </>
              ) : null}
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t("perf.largest_regions")}
              </Typography>
              <Button
                onClick={() => setLargestRegionsOpen((open) => !open)}
                aria-expanded={largestRegionsOpen}
              >
                {largestRegionsOpen
                  ? t("control.hide_regions")
                  : t("control.show_regions", { count: 10 })}
              </Button>
              {largestRegionsOpen ? <DataTable columns={regionColumns} rows={regionRows} /> : null}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("control.no_atlas_data")}
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}
