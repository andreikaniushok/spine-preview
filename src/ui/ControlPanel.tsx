import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useI18n } from "../i18n/useI18n";
import type { PlaybackMode, SpineModel } from "../types";

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
    <Paper
      component="aside"
      square
      sx={{
        gridArea: "controls",
        borderRight: { xs: 0, md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: "divider",
        p: { xs: 1.25, md: 2 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1.25, md: 2 },
        minWidth: 0,
        minHeight: 0,
        maxHeight: { xs: "38dvh", md: "none" },
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2">{t("control.models")}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <FormControl>
            <InputLabel id="model-select-label">{t("control.select_model")}</InputLabel>
            <Select
              labelId="model-select-label"
              label={t("control.select_model")}
              value={activeModel?.id ?? ""}
              onChange={(e) => onModelSelect(e.target.value)}
            >
              <MenuItem value="">
                <em>{t("control.select_model")}</em>
              </MenuItem>
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            color="error"
            disabled={!activeModel}
            onClick={() => activeModel && onModelRemove(activeModel.id)}
            sx={{ flexShrink: 0 }}
          >
            {t("control.delete_model")}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ minHeight: 0 }}>
        <Typography variant="subtitle2">{t("control.animations")}</Typography>
        <List
          dense
          sx={{
            maxHeight: 180,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            py: 0,
          }}
        >
          {activeModel?.animations.length ? (
            activeModel.animations.map((name) => (
              <ListItemButton
                key={name}
                selected={activeAnimation === name}
                onClick={() => onAnimationPlay(name)}
              >
                <ListItemText
                  primary={name}
                  slotProps={{ primary: { variant: "body2" } }}
                />
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("control.no_animations")}
              </Typography>
            </Box>
          )}
        </List>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">{t("control.playback")}</Typography>
        <Stack direction="row" spacing={1}>
          <Button fullWidth onClick={onPauseToggle}>
            {paused ? t("control.play") : t("control.pause")}
          </Button>
          <Button fullWidth onClick={onReset}>
            {t("control.reset")}
          </Button>
        </Stack>
        <FormControl>
          <InputLabel id="mode-label">{t("control.mode")}</InputLabel>
          <Select
            labelId="mode-label"
            label={t("control.mode")}
            value={mode}
            onChange={(e) => onModeChange(e.target.value as PlaybackMode)}
          >
            <MenuItem value="loop">{t("control.loop")}</MenuItem>
            <MenuItem value="once">{t("control.once")}</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="speed-label">{t("control.speed")}</InputLabel>
          <Select
            labelId="speed-label"
            label={t("control.speed")}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            {speedPreset.map((item) => (
              <MenuItem key={item} value={item}>
                {item}x
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">{t("control.appearance")}</Typography>
        <FormControl>
          <InputLabel id="skin-label">{t("control.skin")}</InputLabel>
          <Select
            labelId="skin-label"
            label={t("control.skin")}
            value={selectedSkin}
            onChange={(e) => onSkinChange(e.target.value)}
          >
            {activeModel?.skins.map((skinName) => (
              <MenuItem key={skinName} value={skinName}>
                {skinName}
              </MenuItem>
            )) ?? <MenuItem value="">{t("control.default_skin")}</MenuItem>}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: "block" }}>
            {t("control.alpha")}: {alpha.toFixed(2)}
          </Typography>
          <Slider
            aria-label={t("control.alpha")}
            min={0.2}
            max={1}
            step={0.05}
            value={alpha}
            onChange={(_, value) => onAlphaChange(value as number)}
          />
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={debugBones}
              onChange={(e) => onDebugToggle(e.target.checked)}
              slotProps={{ input: { "aria-label": t("control.debug_bones") } }}
            />
          }
          label={t("control.debug_bones")}
        />
      </Stack>
    </Paper>
  );
}
