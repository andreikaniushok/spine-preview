import { useI18n } from "../i18n/useI18n";
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
  } = props;

  const { t } = useI18n();

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

    </aside>
  );
}
