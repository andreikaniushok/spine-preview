import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ControlPanel } from "./components/ControlPanel";
import { PerformanceReportPanel } from "./components/PerformanceReportPanel";
import { useI18n } from "./i18n/useI18n";
import { useSpinePreview } from "./hooks/useSpinePreview";

function App() {
  const { t } = useI18n();
  const preview = useSpinePreview();
  const vm = preview.viewModel;
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
  const [isMetricsVisible, setIsMetricsVisible] = useState(true);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const classes = useMemo(
    () => `app app-${vm.theme}${isAnalyticsVisible ? "" : " app-analytics-hidden"}`,
    [isAnalyticsVisible, vm.theme],
  );

  useEffect(() => {
    if (!folderInputRef.current) {
      return;
    }
    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  return (
    <div className={classes}>
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

      <div className="scene-column">
      <main
        className={`scene-wrap ${isDraggingFiles ? "drag-over" : ""}`}
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
      >
        <div className="overlay scene-actions">
          <button type="button" onClick={() => filesInputRef.current?.click()}>
            {t("scene.select_files")}
          </button>
          <button type="button" onClick={() => folderInputRef.current?.click()}>
            {t("scene.select_folder")}
          </button>
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
        </div>

        <div ref={preview.hostRef} className="pixi-host" />
        {isMetricsVisible && (
          <div className="overlay metrics">
            <span>
              {t("scene.fps")}: {vm.metrics.fps.toFixed(0)}
            </span>
            <span>
              {t("scene.frame_ms")}: {vm.metrics.frameTimeMs.toFixed(2)} ms
            </span>
          </div>
        )}
        <div className="notices">
          {vm.notices.map((notice) => (
            <div key={notice.id} className={`notice notice-${notice.level}`}>
              <span>{t(notice.messageKey, notice.vars)}</span>
              <button
                type="button"
                aria-label={t("common.dismiss")}
                onClick={() => preview.actions.dismissNotice(notice.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {!vm.activeModel && (
          <div className="overlay drop-hint">
            {t("scene.drop_title")}
            <br />
            <code>{t("scene.drop_hint_sub")}</code>
          </div>
        )}
      </main>
      </div>

      {isAnalyticsVisible && (
        <PerformanceReportPanel
          report={vm.performanceReport}
          atlasReport={vm.atlasReport}
          activeModel={vm.activeModel}
          benchmark={vm.benchmark}
          onBenchmarkStart={preview.actions.startBenchmark}
          onBenchmarkStop={preview.actions.stopBenchmark}
          onBenchmarkClear={preview.actions.clearBenchmark}
          baseline={vm.performanceBaseline}
          onCaptureBaseline={preview.actions.capturePerformanceBaseline}
          onClearBaseline={preview.actions.clearPerformanceBaseline}
        />
      )}
    </div>
  );
}

export default App;
