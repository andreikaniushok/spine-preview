import {
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { MessageKey } from "../i18n/messages";
import type { MessageVars } from "../i18n/types";
import { useI18n } from "../i18n/useI18n";
import type { BenchmarkResult, BenchmarkUiState } from "../types";
import { KvGrid, type KvItem } from "./components";

const DURATION_PRESETS_SEC = [3, 5, 10, 30] as const;

type Translate = (key: MessageKey, vars?: MessageVars) => string;

export interface BenchmarkPanelProps {
  state: BenchmarkUiState;
  onStart: (durationSec: number) => void;
  onStop: () => void;
  onClear: () => void;
}

function buildResultItems(result: BenchmarkResult, t: Translate): KvItem[] {
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
    <Stack spacing={1.5} component="section">
      <Typography variant="subtitle2">{t("control.benchmark")}</Typography>
      <Typography variant="caption" color="text.secondary">
        {t("control.benchmark_hint")}
      </Typography>

      <FormControl disabled={running}>
        <InputLabel id="benchmark-duration-label">{t("control.duration")}</InputLabel>
        <Select
          labelId="benchmark-duration-label"
          label={t("control.duration")}
          value={durationSec}
          onChange={(e) => setDurationSec(Number(e.target.value))}
        >
          {DURATION_PRESETS_SEC.map((sec) => (
            <MenuItem key={sec} value={sec}>
              {sec}s
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {running ? (
        <Button color="warning" onClick={onStop}>
          {t("control.stop_early")}
        </Button>
      ) : (
        <Button variant="contained" onClick={() => onStart(durationSec)}>
          {t("control.start")}
        </Button>
      )}

      {state.status === "running" ? (
        <Box>
          <LinearProgress
            variant="determinate"
            value={Math.round(state.progress * 100)}
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
            {t("control.recording", { pct: Math.round(state.progress * 100) })}
          </Typography>
        </Box>
      ) : null}

      {state.status === "done" ? (
        <Stack spacing={1}>
          <KvGrid items={resultItems} />
          <Button variant="text" onClick={onClear}>
            {t("control.clear_results")}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
