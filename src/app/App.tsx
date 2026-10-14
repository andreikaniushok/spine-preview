import "./App.css";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import { Alert, Box, Button, IconButton, Paper, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { useSpinePreview } from "../hooks";
import { AppHeader, ControlPanel, PerformanceReportPanel } from "../ui";
import { AppThemeProvider } from "../ui/theme";

function App() {
  const { t } = useI18n();
  const footerYear = 2026;
  const footerAuthor = "@andreikaniushok";
  const preview = useSpinePreview();
  const vm = preview.viewModel;
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
  const [isMetricsVisible, setIsMetricsVisible] = useState(true);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!folderInputRef.current) {
      return;
    }
    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  const latestNotice = vm.notices[vm.notices.length - 1] ?? null;

  return (
    <AppThemeProvider mode={vm.theme}>
      <Box
        sx={{
          display: "grid",
          width: "100%",
          height: "100dvh",
          minHeight: "100dvh",
          overflow: "hidden",
          bgcolor: "background.default",
          gridTemplateColumns: {
            xs: "1fr",
            md: isAnalyticsVisible
              ? "minmax(240px, 300px) minmax(0, 1fr) minmax(280px, 520px)"
              : "minmax(240px, 300px) minmax(0, 1fr)",
          },
          gridTemplateRows: {
            xs: isAnalyticsVisible
              ? "auto auto minmax(36dvh, 1fr) minmax(28dvh, 38dvh)"
              : "auto auto minmax(0, 1fr)",
            md: "auto 1fr",
          },
          gridTemplateAreas: {
            xs: isAnalyticsVisible
              ? `"header" "controls" "scene" "analytics"`
              : `"header" "controls" "scene"`,
            md: isAnalyticsVisible
              ? `"header header header" "controls scene analytics"`
              : `"header header" "controls scene"`,
          },
        }}
      >
        <AppHeader
          theme={vm.theme}
          onThemeChange={preview.actions.setTheme}
          analyticsVisible={isAnalyticsVisible}
          onAnalyticsVisibleChange={setIsAnalyticsVisible}
          metricsVisible={isMetricsVisible}
          onMetricsVisibleChange={setIsMetricsVisible}
        />

        <ControlPanel
          models={vm.models}
          activeModel={vm.activeModel}
          activeAnimation={vm.activeAnimation}
          speed={vm.speed}
          mode={vm.mode}
          paused={vm.paused}
          selectedSkin={vm.selectedSkin}
          alpha={vm.alpha}
          debugBones={vm.debugBones}
          onModelSelect={preview.actions.selectModel}
          onModelRemove={preview.actions.removeModel}
          onAnimationPlay={preview.actions.playAnimation}
          onSpeedChange={preview.actions.changeSpeed}
          onModeChange={preview.actions.setPlaybackMode}
          onPauseToggle={preview.actions.togglePause}
          onReset={preview.actions.reset}
          onSkinChange={preview.actions.setSkin}
          onAlphaChange={preview.actions.setModelAlpha}
          onDebugToggle={preview.actions.toggleDebug}
        />

        <Box
          sx={{
            gridArea: "scene",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <Box
            component="main"
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingFiles(false);
              if (event.dataTransfer.files.length > 0) {
                void preview.actions.loadFiles(event.dataTransfer.files);
              }
            }}
            sx={{
              position: "relative",
              flex: 1,
              minHeight: { xs: 220, md: 0 },
              outline: isDraggingFiles ? "2px dashed" : "none",
              outlineColor: "primary.main",
              outlineOffset: -4,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                position: "absolute",
                zIndex: 2,
                top: { xs: 8, md: 10 },
                left: { xs: 8, md: 10 },
                right: { xs: 8, md: "auto" },
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={() => filesInputRef.current?.click()}
                sx={{ flex: { xs: "1 1 auto", md: "0 0 auto" } }}
              >
                {t("scene.select_files")}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => folderInputRef.current?.click()}
                sx={{ flex: { xs: "1 1 auto", md: "0 0 auto" } }}
              >
                {t("scene.select_folder")}
              </Button>
              <input
                ref={filesInputRef}
                className="sr-only"
                type="file"
                aria-label={t("scene.aria_select_files")}
                multiple
                onChange={(event) => {
                  const files = event.currentTarget.files;
                  if (files && files.length > 0) {
                    void preview.actions.loadFiles(files);
                  }
                  event.currentTarget.value = "";
                }}
              />
              <input
                ref={folderInputRef}
                className="sr-only"
                type="file"
                aria-label={t("scene.aria_select_folder")}
                multiple
                onChange={(event) => {
                  const files = event.currentTarget.files;
                  if (files && files.length > 0) {
                    void preview.actions.loadFiles(files);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </Stack>

            <Box ref={preview.hostRef} className="pixi-host" />

            <Tooltip title={t("scene.recenter")} placement="left" enterDelay={400}>
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  zIndex: 2,
                  right: { xs: 8, md: 10 },
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <IconButton
                  color="primary"
                  size="small"
                  disabled={!vm.activeModel}
                  onClick={preview.actions.recenterView}
                  aria-label={t("scene.recenter_aria")}
                  sx={{
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <CenterFocusStrongIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>

            {isMetricsVisible ? (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 2,
                  top: { xs: "auto", md: 10 },
                  bottom: { xs: 8, md: "auto" },
                  right: { xs: 8, md: 10 },
                  px: 1.25,
                  py: 0.75,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  maxWidth: "calc(100% - 16px)",
                }}
              >
                <Typography variant="caption">
                  {t("scene.fps")}: {vm.metrics.fps.toFixed(0)}
                </Typography>
                <Typography variant="caption">
                  {t("scene.frame_ms")}: {vm.metrics.frameTimeMs.toFixed(2)} ms
                </Typography>
              </Paper>
            ) : null}

            {!vm.activeModel ? (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 1,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  px: { xs: 1.5, md: 2 },
                  py: 1.5,
                  width: { xs: "calc(100% - 24px)", sm: "auto" },
                  maxWidth: 360,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography variant="body2">{t("scene.drop_title")}</Typography>
                <Typography variant="caption" component="code" sx={{ mt: 0.5, display: "block" }}>
                  {t("scene.drop_hint_sub")}
                </Typography>
              </Paper>
            ) : null}
          </Box>

          <Box
            component="footer"
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              alignItems: "center",
              px: 1.5,
              py: 1,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t("common.footer_copyright", { year: footerYear, author: footerAuthor })}
            </Typography>
          </Box>
        </Box>

        {isAnalyticsVisible ? (
          <PerformanceReportPanel
            metrics={vm.metrics}
            structure={vm.skeletonStructure}
            atlasReport={vm.atlasReport}
            activeModel={vm.activeModel}
            modelCount={vm.models.length}
            drawCalls={vm.drawCalls}
          />
        ) : null}

        {latestNotice ? (
          <Snackbar
            open
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            sx={{
              bottom: { xs: 12, md: 24 },
              left: { xs: 8, md: "50%" },
              right: { xs: 8, md: "auto" },
              transform: { md: "translateX(-50%)" },
              width: { xs: "auto", md: "auto" },
            }}
          >
            <Alert
              severity={
                latestNotice.level === "error"
                  ? "error"
                  : latestNotice.level === "success"
                    ? "success"
                    : "info"
              }
              variant="filled"
              onClose={() => preview.actions.dismissNotice(latestNotice.id)}
              sx={{ width: "100%" }}
            >
              {t(latestNotice.messageKey, latestNotice.vars)}
            </Alert>
          </Snackbar>
        ) : null}
      </Box>
    </AppThemeProvider>
  );
}

export default App;
