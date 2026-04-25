import { useMemo, useState } from "react";
import type { AtlasAnalysisReport } from "../analysis/atlasAnalysis";
import { useI18n } from "../i18n/useI18n";
import type { BenchmarkUiState, PlaybackMode, SpineModel } from "../types/spine";

interface ControlPanelProps {
  models: SpineModel[];
  activeModel: SpineModel | null;
  activeAnimation: string | null;
  speed: number;
  mode: PlaybackMode;
  paused: boolean;
  selectedSkin: string;
  alpha: number;
  debugBones: boolean;
  onModelSelect: (id: string) => void;
  onModelRemove: (id: string) => void;
  onAnimationPlay: (name: string) => void;
  onSpeedChange: (value: number) => void;
  onModeChange: (value: PlaybackMode) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onSkinChange: (name: string) => void;
  onAlphaChange: (value: number) => void;
  onDebugToggle: (value: boolean) => void;
  benchmark: BenchmarkUiState;
  onBenchmarkStart: (durationSec: number) => void;
  onBenchmarkStop: () => void;
  onBenchmarkClear: () => void;
  atlasReport: AtlasAnalysisReport | null;
}

const speedPreset = [0.5, 1, 1.5, 2];
const benchmarkDurationsSec = [3, 5, 10, 30] as const;

export function ControlPanel(props: ControlPanelProps) {
  const {
    models,
    activeModel,
    activeAnimation,
    speed,
    mode,
    paused,
    selectedSkin,
    alpha,
    debugBones,
    onModelSelect,
    onModelRemove,
    onAnimationPlay,
    onSpeedChange,
    onModeChange,
    onPauseToggle,
    onReset,
    onSkinChange,
    onAlphaChange,
    onDebugToggle,
    benchmark,
    onBenchmarkStart,
    onBenchmarkStop,
    onBenchmarkClear,
    atlasReport,
  } = props;

  const { t } = useI18n();
  const [benchmarkDurationSec, setBenchmarkDurationSec] = useState<number>(5);
  const [assetsRegionsOpen, setAssetsRegionsOpen] = useState(false);
  const isBenchmarkRunning = benchmark.status === "running";

  const regionPreview = useMemo(() => {
    const names = atlasReport?.regionNames;
    if (!names?.length) {
      return [];
    }
    return names.slice(0, 500);
  }, [atlasReport?.regionNames]);

  return (
    <aside className="control-panel">
      <section>
        <h2>{t("control.models")}</h2>
        <div className="row model-row">
          <select
            aria-label={t("control.select_model")}
            value={activeModel?.id ?? ""}
            onChange={(e) => onModelSelect(e.target.value)}
          >
            <option value="">{t("control.select_model")}</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!activeModel}
            onClick={() => activeModel && onModelRemove(activeModel.id)}
          >
            {t("control.delete_model")}
          </button>
        </div>
      </section>

      <section className="assets-section">
        <h2>{t("control.assets")}</h2>
        {!activeModel ? (
          <p className="hint">{t("control.assets_load_hint")}</p>
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
              <p className="assets-parse-error">
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
                {assetsRegionsOpen ? (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setAssetsRegionsOpen((o) => !o)}
                    aria-expanded="true"
                  >
                    {t("control.hide_regions")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setAssetsRegionsOpen((o) => !o)}
                    aria-expanded="false"
                  >
                    {t("control.show_regions", { count: atlasReport.totalRegions })}
                  </button>
                )}
                {assetsRegionsOpen && (
                  <div className="scroll-list assets-region-list" role="list">
                    {regionPreview.map((name) => (
                      <span key={name} className="assets-region-chip" role="listitem">
                        {name}
                      </span>
                    ))}
                    {atlasReport.totalRegions > regionPreview.length && (
                      <span className="hint">
                        {t("control.regions_more", {
                          count: atlasReport.totalRegions - regionPreview.length,
                        })}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="hint">{t("control.no_atlas_data")}</p>
            )}
          </>
        )}
      </section>

      <section>
        <h2>{t("control.animations")}</h2>
        <div className="scroll-list">
          {activeModel?.animations.map((name) => (
            <button
              key={name}
              className={activeAnimation === name ? "active" : ""}
              onClick={() => onAnimationPlay(name)}
            >
              {name}
            </button>
          )) ?? <span className="hint">{t("control.no_animations")}</span>}
        </div>
      </section>

      <section>
        <h2>{t("control.playback")}</h2>
        <div className="row">
          <button onClick={onPauseToggle}>{paused ? t("control.play") : t("control.pause")}</button>
          <button onClick={onReset}>{t("control.reset")}</button>
        </div>
        <div className="row">
          <label>{t("control.mode")}</label>
          <select
            aria-label={t("control.mode")}
            value={mode}
            onChange={(e) => onModeChange(e.target.value as PlaybackMode)}
          >
            <option value="loop">{t("control.loop")}</option>
            <option value="once">{t("control.once")}</option>
          </select>
        </div>
        <div className="row">
          <label>{t("control.speed")}</label>
          <select aria-label={t("control.speed")} value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))}>
            {speedPreset.map((item) => (
              <option key={item} value={item}>
                {item}x
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h2>{t("control.appearance")}</h2>
        <div className="row">
          <label>{t("control.skin")}</label>
          <select aria-label={t("control.skin")} value={selectedSkin} onChange={(e) => onSkinChange(e.target.value)}>
            {activeModel?.skins.map((skinName) => (
              <option key={skinName} value={skinName}>
                {skinName}
              </option>
            )) ?? <option value="">{t("control.default_skin")}</option>}
          </select>
        </div>
        <div className="row">
          <label>{t("control.alpha")}</label>
          <input
            type="range"
            aria-label={t("control.alpha")}
            min="0.2"
            max="1"
            step="0.05"
            value={alpha}
            onChange={(e) => onAlphaChange(Number(e.target.value))}
          />
        </div>
        <div className="row checkbox-row">
          <label>{t("control.debug_bones")}</label>
          <input
            type="checkbox"
            aria-label={t("control.debug_bones")}
            checked={debugBones}
            onChange={(e) => onDebugToggle(e.target.checked)}
          />
        </div>
      </section>

      <section className="benchmark-section">
        <h2>{t("control.benchmark")}</h2>
        <p className="benchmark-hint">{t("control.benchmark_hint")}</p>
        <div className="row">
          <label>{t("control.duration")}</label>
          <select
            aria-label={t("control.duration")}
            value={benchmarkDurationSec}
            disabled={isBenchmarkRunning}
            onChange={(e) => setBenchmarkDurationSec(Number(e.target.value))}
          >
            {benchmarkDurationsSec.map((sec) => (
              <option key={sec} value={sec}>
                {sec}s
              </option>
            ))}
          </select>
        </div>
        <div className="row benchmark-actions">
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

    </aside>
  );
}
