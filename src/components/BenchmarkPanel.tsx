import { useMemo, useState } from "react";
import type { MessageKey } from "../i18n/messages";
import type { MessageVars } from "../i18n/types";
import { useI18n } from "../i18n/useI18n";
import type { BenchmarkResult, BenchmarkUiState } from "../types/spine";
import { Button } from "./ui/Button";
import { FieldRow } from "./ui/FieldRow";
import { ProgressBar } from "./ui/ProgressBar";
import { StatGrid, type StatItem } from "./ui/StatGrid";

const DURATION_PRESETS_SEC = [3, 5, 10, 30] as const;
const DURATION_SELECT_ID = "benchmark-duration";

type Translate = (key: MessageKey, vars?: MessageVars) => string;

export interface BenchmarkPanelProps {
  state: BenchmarkUiState;
  onStart: (durationSec: number) => void;
  onStop: () => void;
  onClear: () => void;
}

function buildResultItems(result: BenchmarkResult, t: Translate): StatItem[] {
  const ft = result.frameTimeMs;
  return [
    { label: t("control.frames"), value: result.frameCount },
    { label: t("control.wall_time"), value: `${(result.wallDurationMs / 1000).toFixed(2)} s` },
    { label: t("control.mean_fps"), value: result.meanFps.toFixed(1) },
    { label: t("control.frame_ms_avg"), value: ft.mean.toFixed(2) },
    { label: t("control.frame_ms_p50"), value: ft.p50.toFixed(2) },
    { label: t("control.frame_ms_p95"), value: ft.p95.toFixed(2) },
    { label: t("control.frame_ms_p99"), value: ft.p99.toFixed(2) },
    {
      label: t("control.frame_ms_minmax"),
      value: `${ft.min.toFixed(2)} – ${ft.max.toFixed(2)}`,
      wide: true,
    },
  ];
}

export function BenchmarkPanel({ state, onStart, onStop, onClear }: BenchmarkPanelProps) {
  const { t } = useI18n();
  const [durationSec, setDurationSec] = useState<number>(5);
  const running = state.status === "running";

  const resultItems = useMemo(() => {
    if (state.status !== "done") {
      return [];
    }
    return buildResultItems(state.result, t);
  }, [state, t]);

  return (
    <section className="perf-section benchmark-section">
      <h3>{t("control.benchmark")}</h3>
      <p className="benchmark-hint">{t("control.benchmark_hint")}</p>

      <FieldRow label={t("control.duration")} htmlFor={DURATION_SELECT_ID}>
        <select
          id={DURATION_SELECT_ID}
          aria-label={t("control.duration")}
          value={durationSec}
          disabled={running}
          onChange={(e) => setDurationSec(Number(e.target.value))}
        >
          {DURATION_PRESETS_SEC.map((sec) => (
            <option key={sec} value={sec}>
              {sec}s
            </option>
          ))}
        </select>
      </FieldRow>

      <div className="benchmark-actions">
        {running ? (
          <Button variant="secondary" onClick={onStop}>
            {t("control.stop_early")}
          </Button>
        ) : (
          <Button onClick={() => onStart(durationSec)}>{t("control.start")}</Button>
        )}
      </div>

      {state.status === "running" ? (
        <ProgressBar
          className="benchmark-progress"
          value={state.progress}
          label={t("control.recording", { pct: Math.round(state.progress * 100) })}
        />
      ) : null}

      {state.status === "done" ? (
        <div className="benchmark-results">
          <StatGrid items={resultItems} />
          <Button variant="ghost" className="benchmark-clear" onClick={onClear}>
            {t("control.clear_results")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
