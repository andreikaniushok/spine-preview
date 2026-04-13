import type { PlaybackMode, SpineModel } from "../types/spine";

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
}

const speedPreset = [0.5, 1, 1.5, 2];

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
  } = props;

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
        <div className="row checkbox-row">
          <label>White theme</label>
          <input
            type="checkbox"
            aria-label="Toggle light theme"
            checked={theme === "light"}
            onChange={(e) => onThemeToggle(e.target.checked ? "light" : "dark")}
          />
        </div>
      </section>
    </aside>
  );
}
