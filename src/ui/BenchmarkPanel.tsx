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
import { useState } from "react";
import { useI18n } from "../i18n/useI18n";
import type { BenchmarkUiState } from "../types";

const DURATION_PRESETS_SEC = [3, 5, 10, 30] as const;
const SKELETON_COUNT_PRESETS = [1, 2, 5, 10, 20] as const;

export interface BenchmarkPanelProps {
  state: BenchmarkUiState;
  onStart: (durationSec: number, skeletonCount: number) => void;
  onStop: () => void;
  onClear: () => void;
}

export function BenchmarkPanel({ state, onStart, onStop, onClear }: BenchmarkPanelProps) {
  const { t } = useI18n();
  const [durationSec, setDurationSec] = useState(5);
  const [skeletonCount, setSkeletonCount] = useState(1);
  const running = state.status === "running";

  return (
    <Stack spacing={1.5} component="section">
      <Typography variant="subtitle2">{t("perf.benchmark_title")}</Typography>
      <Typography variant="caption" color="text.secondary">
        {t("perf.benchmark_hint")}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <FormControl disabled={running} fullWidth size="small">
          <InputLabel id="benchmark-count-label">{t("perf.skeleton_count")}</InputLabel>
          <Select
            labelId="benchmark-count-label"
            label={t("perf.skeleton_count")}
            value={skeletonCount}
            onChange={(e) => setSkeletonCount(Number(e.target.value))}
          >
            {SKELETON_COUNT_PRESETS.map((count) => (
              <MenuItem key={count} value={count}>
                {count}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl disabled={running} fullWidth size="small">
          <InputLabel id="benchmark-duration-label">{t("perf.duration")}</InputLabel>
          <Select
            labelId="benchmark-duration-label"
            label={t("perf.duration")}
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
      </Stack>

      {running ? (
        <Button color="warning" onClick={onStop}>
          {t("perf.stop_early")}
        </Button>
      ) : (
        <Button variant="contained" onClick={() => onStart(durationSec, skeletonCount)}>
          {t("perf.start")}
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
            {t("perf.recording", {
              pct: Math.round(state.progress * 100),
              count: state.skeletonCount,
            })}
          </Typography>
        </Box>
      ) : null}

      {state.status === "done" ? (
        <Button variant="text" onClick={onClear}>
          {t("perf.clear_latest")}
        </Button>
      ) : null}
    </Stack>
  );
}
