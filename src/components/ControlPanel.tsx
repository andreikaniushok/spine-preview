import { useMemo, useState } from "react";
import type { AtlasAnalysisReport } from "../analysis/atlasAnalysis";
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
  theme: "dark" | "light";
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
  onThemeToggle: (value: "dark" | "light") => void;
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
    theme,
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
    onThemeToggle,
    benchmark,
    onBenchmarkStart,
    onBenchmarkStop,
    onBenchmarkClear,
    atlasReport,
  } = props;

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
      <h1>Spine Preview</h1>

      <section>
        <h2>Models</h2>
        <div className="row model-row">
          <select
            aria-label="Select model"
            value={activeModel?.id ?? ""}
            onChange={(e) => onModelSelect(e.target.value)}
          >
            <option value="">Select model</option>
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
            Delete
          </button>
        </div>
      </section>

      <section className="assets-section">
        <h2>Assets</h2>
        {!activeModel ? (
          <p className="hint">Load a model to see skeleton and atlas files.</p>
        ) : (
          <>
            <div className="assets-files">
              <div className="assets-file-row">
                <span className="assets-label">Skeleton</span>
                <code className="assets-path">{activeModel.skeletonFileName}</code>
              </div>
              <div className="assets-file-row">
                <span className="assets-label">Atlas</span>
                <code className="assets-path">{activeModel.atlasFileName}</code>
              </div>
            </div>
            {atlasReport?.parseError ? (
              <p className="assets-parse-error">Atlas: {atlasReport.parseError}</p>
            ) : atlasReport ? (
              <>
                <dl className="assets-stats-grid">
                  <div>
                    <dt>Pages</dt>
                    <dd>{atlasReport.totalPages}</dd>
                  </div>
                  <div>
                    <dt>Regions</dt>
                    <dd>{atlasReport.totalRegions}</dd>
                  </div>
                  <div>
                    <dt>Draw calls</dt>
                    <dd>{atlasReport.renderPasses?.estimatedDrawCalls ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Page switches</dt>
                    <dd>{atlasReport.renderPasses?.texturePageSwitches ?? "—"}</dd>
                  </div>
                </dl>
                <p className="assets-stats-hint">
                  Draw calls and page switches follow the current pose; they are estimated from draw order (atlas page and
                  blend mode).
                </p>
                {assetsRegionsOpen ? (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setAssetsRegionsOpen((o) => !o)}
                    aria-expanded="true"
                  >
                    Hide atlas regions
                  </button>
                ) : (
                  <button
                    type="button"
                    className="assets-toggle"
                    onClick={() => setAssetsRegionsOpen((o) => !o)}
                    aria-expanded="false"
                  >
                    Show atlas regions ({atlasReport.totalRegions})
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
                      <span className="hint">… and {atlasReport.totalRegions - regionPreview.length} more</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="hint">No atlas data for this model.</p>
            )}
          </>
        )}
      </section>

      <section>
        <h2>Animations</h2>
        <div className="scroll-list">
          {activeModel?.animations.map((name) => (
            <button
              key={name}
              className={activeAnimation === name ? "active" : ""}
              onClick={() => onAnimationPlay(name)}
            >
              {name}
            </button>
          )) ?? <span className="hint">No animation loaded</span>}
        </div>
      </section>

      <section>
        <h2>Playback</h2>
        <div className="row">
          <button onClick={onPauseToggle}>{paused ? "Play" : "Pause"}</button>
          <button onClick={onReset}>Reset</button>
        </div>
        <div className="row">
          <label>Mode</label>
          <select
            aria-label="Playback mode"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as PlaybackMode)}
          >
            <option value="loop">Loop</option>
            <option value="once">Once</option>
          </select>
        </div>
        <div className="row">
          <label>Speed</label>
          <select aria-label="Playback speed" value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))}>
            {speedPreset.map((item) => (
              <option key={item} value={item}>
                {item}x
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <h2>Appearance</h2>
        <div className="row">
          <label>Skin</label>
          <select aria-label="Skin selector" value={selectedSkin} onChange={(e) => onSkinChange(e.target.value)}>
            {activeModel?.skins.map((skinName) => (
              <option key={skinName} value={skinName}>
                {skinName}
              </option>
            )) ?? <option value="">Default</option>}
          </select>
        </div>
        <div className="row">
          <label>Alpha</label>
          <input
            type="range"
            aria-label="Model alpha"
            min="0.2"
            max="1"
            step="0.05"
            value={alpha}
            onChange={(e) => onAlphaChange(Number(e.target.value))}
          />
        </div>
        <div className="row checkbox-row">
          <label>Debug bones</label>
          <input
            type="checkbox"
            aria-label="Toggle debug bones"
            checked={debugBones}
            onChange={(e) => onDebugToggle(e.target.checked)}
          />
        </div>
      </section>

      <section className="benchmark-section">
        <h2>Benchmark</h2>
        <p className="benchmark-hint">
          Records frame times from the Pixi ticker for the chosen duration. Mean FPS is derived from
          average frame time.
        </p>
        <div className="row">
          <label>Duration</label>
          <select
            aria-label="Benchmark duration"
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
              Start
            </button>
          ) : (
            <button type="button" onClick={onBenchmarkStop}>
              Stop early
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
              Recording… {Math.round(benchmark.progress * 100)}%
            </span>
          </div>
        )}
        {benchmark.status === "done" && (
          <div className="benchmark-results">
            <dl className="benchmark-stats">
              <div>
                <dt>Frames</dt>
                <dd>{benchmark.result.frameCount}</dd>
              </div>
              <div>
                <dt>Wall time</dt>
                <dd>{(benchmark.result.wallDurationMs / 1000).toFixed(2)} s</dd>
              </div>
              <div>
                <dt>Mean FPS</dt>
                <dd>{benchmark.result.meanFps.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Frame ms (avg)</dt>
                <dd>{benchmark.result.frameTimeMs.mean.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Frame ms (p50)</dt>
                <dd>{benchmark.result.frameTimeMs.p50.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Frame ms (p95)</dt>
                <dd>{benchmark.result.frameTimeMs.p95.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Frame ms (p99)</dt>
                <dd>{benchmark.result.frameTimeMs.p99.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Frame ms (min–max)</dt>
                <dd>
                  {benchmark.result.frameTimeMs.min.toFixed(2)} –{" "}
                  {benchmark.result.frameTimeMs.max.toFixed(2)}
                </dd>
              </div>
            </dl>
            <button type="button" className="benchmark-clear" onClick={onBenchmarkClear}>
              Clear results
            </button>
          </div>
        )}
      </section>

      <section>
        <h2>Settings</h2>
        <div className="row checkbox-row">
          <label htmlFor="theme-switch">White theme</label>
          <label className="theme-toggle" htmlFor="theme-switch">
            <input
              id="theme-switch"
              className="theme-toggle-input"
              type="checkbox"
              aria-label="Toggle light theme"
              checked={theme === "light"}
              onChange={(event) => onThemeToggle(event.target.checked ? "light" : "dark")}
            />
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
          </label>
        </div>
      </section>
    </aside>
  );
}
