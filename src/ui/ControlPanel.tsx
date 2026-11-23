import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useI18n } from "../i18n/useI18n";
import { MAX_ANIMATION_TRACKS, type AnimationTrack, type PlaybackMode, type SpineModel, type TrackMix } from "../types";

interface ControlPanelProps {
  models: SpineModel[];
  activeModel: SpineModel | null;
  activeAnimation: string | null;
  animationTracks: AnimationTrack[];
  activeTrackId: string | null;
  speed: number;
  mode: PlaybackMode;
  paused: boolean;
  selectedSkin: string;
  alpha: number;
  debugBones: boolean;
  onModelSelect: (id: string) => void;
  onModelRemove: (id: string) => void;
  onAnimationPlay: (name: string) => void;
  onTrackSelect: (trackId: string) => void;
  onTrackAnimation: (trackId: string, animation: string | null) => void;
  onTrackMix: (trackId: string, mix: TrackMix) => void;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
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
    animationTracks,
    activeTrackId,
    speed,
    mode,
    paused,
    selectedSkin,
    alpha,
    debugBones,
    onModelSelect,
    onModelRemove,
    onAnimationPlay,
    onTrackSelect,
    onTrackAnimation,
    onTrackMix,
    onAddTrack,
    onRemoveTrack,
    onSpeedChange,
    onModeChange,
    onPauseToggle,
    onReset,
    onSkinChange,
    onAlphaChange,
    onDebugToggle,
  } = props;

  const { t } = useI18n();
  const animations = activeModel?.animations ?? [];
  const hasModel = activeModel !== null;
  const skins = activeModel?.skins ?? [];
  const shownTracks: AnimationTrack[] =
    animationTracks.length > 0
      ? animationTracks
      : [{ id: "pending", animation: null, mix: "replace" }];
  const activeTrackIndex = Math.max(
    0,
    animationTracks.findIndex((track) => track.id === activeTrackId),
  );
  const canAddTrack =
    hasModel && animationTracks.length > 0 && animationTracks.length < MAX_ANIMATION_TRACKS;

  return (
    <Paper
      component="aside"
      square
      elevation={0}
      sx={{
        gridArea: "controls",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        borderRight: { xs: 0, md: 1 },
        borderBottom: { xs: 1, md: 0 },
        borderColor: "divider",
        p: { xs: 1.25, md: 2 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1.25, md: 2 },
        minHeight: 0,
        height: { xs: "auto", md: "100%" },
        maxHeight: { xs: "min(42dvh, 100%)", md: "none" },
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2">{t("control.models")}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <FormControl fullWidth size="small" disabled={models.length === 0} sx={{ minWidth: 0 }}>
            <InputLabel id="model-select-label">{t("control.select_model")}</InputLabel>
            <Select
              labelId="model-select-label"
              label={t("control.select_model")}
              value={activeModel?.id ?? ""}
              disabled={models.length === 0}
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
            size="small"
            disabled={!activeModel}
            onClick={() => activeModel && onModelRemove(activeModel.id)}
            sx={{ flexShrink: 0 }}
          >
            {t("control.delete_model")}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ flexShrink: 0 }}>
        <Typography variant="subtitle2">{t("control.animations")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t("control.assign_track", { index: activeTrackIndex })}
        </Typography>

        <FormControl
          fullWidth
          size="small"
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <Select
            value={activeAnimation ?? ""}
            displayEmpty
            disabled={animations.length === 0}
            aria-label={t("control.animations")}
            onChange={(e) => {
              const name = e.target.value;
              if (name) onAnimationPlay(name);
            }}
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography component="span" variant="body2" color="text.secondary">
                    {animations.length === 0
                      ? t("control.no_animations")
                      : t("control.select_animation")}
                  </Typography>
                );
              }
              return selected;
            }}
            MenuProps={{
              slotProps: {
                paper: { sx: { maxHeight: "50dvh" } },
              },
            }}
          >
            {animations.length === 0 ? (
              <MenuItem value="" disabled>
                <em>{t("control.no_animations")}</em>
              </MenuItem>
            ) : (
              animations.map((name) => (
                <MenuItem key={name} value={name} sx={{ whiteSpace: "normal" }}>
                  {name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <List
          dense
          sx={{
            display: { xs: "none", md: "block" },
            maxHeight: 220,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            py: 0,
          }}
        >
          {animations.length > 0 ? (
            animations.map((name) => {
              const usedOn = animationTracks
                .flatMap((track, index) => (track.animation === name ? [index] : []))
                .map((index) => t("control.track_label", { index }))
                .join(", ");
              return (
              <ListItemButton
                key={name}
                selected={activeAnimation === name}
                onClick={() => onAnimationPlay(name)}
              >
                <ListItemText
                  primary={name}
                  secondary={usedOn || undefined}
                  slotProps={{
                    primary: {
                      variant: "body2",
                      sx: { whiteSpace: "normal", wordBreak: "break-word" },
                    },
                    secondary: {
                      variant: "caption",
                    },
                  }}
                />
              </ListItemButton>
              );
            })
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
          <Button
            fullWidth
            variant="contained"
            disabled={!hasModel}
            startIcon={paused ? <PlayArrowIcon aria-hidden /> : <PauseIcon aria-hidden />}
            onClick={onPauseToggle}
            sx={{ minHeight: 44 }}
          >
            {paused ? t("control.play") : t("control.pause")}
          </Button>
          <Button
            fullWidth
            disabled={!hasModel}
            startIcon={<RestartAltIcon aria-hidden />}
            onClick={onReset}
            sx={{ minHeight: 44 }}
          >
            {t("control.reset")}
          </Button>
        </Stack>
        <Box>
          <Typography variant="subtitle2" id="mode-label" sx={{ mb: 1 }}>
            {t("control.mode")}
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            disabled={!hasModel}
            value={mode}
            aria-labelledby="mode-label"
            onChange={(_, value: PlaybackMode | null) => {
              if (value) onModeChange(value);
            }}
          >
            <ToggleButton value="loop" sx={{ flex: 1 }}>
              {t("control.loop")}
            </ToggleButton>
            <ToggleButton value="once" sx={{ flex: 1 }}>
              {t("control.once")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box>
          <Typography variant="subtitle2" id="speed-label" sx={{ mb: 1 }}>
            {t("control.speed")}
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            disabled={!hasModel}
            value={String(speed)}
            aria-labelledby="speed-label"
            onChange={(_, value: string | null) => {
              if (value) onSpeedChange(Number(value));
            }}
          >
            {speedPreset.map((item) => (
              <ToggleButton key={item} value={String(item)} sx={{ flex: 1, px: 0.5 }}>
                {item}x
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">{t("control.appearance")}</Typography>
        <FormControl fullWidth size="small" disabled={!hasModel || skins.length === 0}>
          <InputLabel id="skin-label">{t("control.skin")}</InputLabel>
          <Select
            labelId="skin-label"
            label={t("control.skin")}
            value={skins.includes(selectedSkin) ? selectedSkin : ""}
            disabled={!hasModel || skins.length === 0}
            onChange={(e) => onSkinChange(e.target.value)}
          >
            {skins.length > 0 ? (
              skins.map((skinName) => (
                <MenuItem key={skinName} value={skinName}>
                  {skinName}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">{t("control.default_skin")}</MenuItem>
            )}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("control.alpha")}: {alpha.toFixed(2)}
          </Typography>
          <Slider
            aria-label={t("control.alpha")}
            min={0.2}
            max={1}
            step={0.05}
            value={alpha}
            disabled={!hasModel}
            onChange={(_, value) => onAlphaChange(value as number)}
            size="small"
          />
        </Box>
        <FormControlLabel
          disabled={!hasModel}
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

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          bgcolor: "transparent",
          backgroundImage: "none",
          boxShadow: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="animation-tracks-content"
          id="animation-tracks-header"
          sx={{
            px: 0,
            minHeight: 44,
            "& .MuiAccordionSummary-content": { my: 0.5 },
          }}
        >
          <Typography variant="subtitle2">{t("control.tracks")}</Typography>
        </AccordionSummary>
        <AccordionDetails id="animation-tracks-content" sx={{ px: 0, pt: 0 }}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("control.tracks_hint")}
            </Typography>
            {shownTracks.map((track, index) => {
              const isActive = hasModel && track.id === activeTrackId;
              const selectedAnimation = animations.includes(track.animation ?? "") ? (track.animation ?? "") : "";
              return (
                <Box
                  key={track.id}
                  sx={{
                    border: 1,
                    borderColor: isActive ? "primary.main" : "divider",
                    borderRadius: 1,
                    p: 1,
                  }}
                >
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                    <Button
                      size="small"
                      variant={isActive ? "contained" : "text"}
                      disabled={!hasModel}
                      aria-pressed={isActive}
                      onClick={() => onTrackSelect(track.id)}
                      sx={{ minHeight: 44, px: 1.25 }}
                    >
                      {t("control.track_label", { index })}
                    </Button>
                    <IconButton
                      aria-label={t("control.remove_track", { index })}
                      disabled={!hasModel || animationTracks.length < 2}
                      onClick={() => onRemoveTrack(track.id)}
                      sx={{ width: 44, height: 44 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <FormControl fullWidth size="small" disabled={!hasModel || animations.length === 0}>
                    <InputLabel id={`track-${track.id}-label`}>{t("control.select_animation")}</InputLabel>
                    <Select
                      labelId={`track-${track.id}-label`}
                      label={t("control.select_animation")}
                      value={selectedAnimation}
                      onChange={(event) => {
                        const name = event.target.value;
                        onTrackAnimation(track.id, name || null);
                      }}
                    >
                      <MenuItem value="">
                        <em>{t("control.track_empty")}</em>
                      </MenuItem>
                      {animations.map((name) => (
                        <MenuItem key={name} value={name} sx={{ whiteSpace: "normal" }}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {index > 0 ? (
                    <FormControlLabel
                      disabled={!hasModel}
                      sx={{ m: 0, mt: 0.5 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={track.mix === "add"}
                          onChange={(event) => onTrackMix(track.id, event.target.checked ? "add" : "replace")}
                          slotProps={{ input: { "aria-label": t("control.track_additive") } }}
                        />
                      }
                      label={t("control.track_additive")}
                    />
                  ) : null}
                </Box>
              );
            })}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon aria-hidden />}
              disabled={!canAddTrack}
              onClick={onAddTrack}
              sx={{ minHeight: 44 }}
            >
              {t("control.add_track")}
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
