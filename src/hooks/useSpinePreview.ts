import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpineDebugRenderer } from "@esotericsoftware/spine-pixi-v8";
import { Container } from "pixi.js";
import { PixiApp } from "../core/PixiApp";
import { SceneController } from "../core/SceneController";
import { SpineManager } from "../spine/SpineManager";
import { AnimationController } from "../animation/AnimationController";
import { DragDropHandler } from "../utils/DragDropHandler";
import { PerformanceMonitor } from "../utils/PerformanceMonitor";
import { attachAtlasRenderPasses, buildAtlasAnalysis } from "../analysis/atlasAnalysis";
import { buildSpinePerformanceReport } from "../analysis/spinePerformanceReport";
import { summarizeBenchmark } from "../utils/benchmarkStats";
import type { PerformanceBaseline } from "../types/performanceBaseline";
import type { MessageKey } from "../i18n/messages";
import type { MessageVars } from "../i18n/types";
import type {
  BenchmarkUiState,
  PerformanceSnapshot,
  PlaybackMode,
  SpineModel,
} from "../types/spine";

const STORAGE_KEY = "spine-preview-state";

interface PersistedState {
  speed: number;
  mode: PlaybackMode;
  theme: "dark" | "light";
}

type NoticeLevel = "success" | "error" | "info";

export interface PreviewNotice {
  id: string;
  level: NoticeLevel;
  messageKey: MessageKey;
  vars?: MessageVars;
}

const rendererBackgroundByTheme = {
  dark: "#0d111a",
  light: "#f5f7fb",
} as const;

function getPersistedState(): PersistedState {
  const fallback: PersistedState = { speed: 1, mode: "loop", theme: "dark" };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return fallback;
  }
}

export function useSpinePreview() {
  const [persisted] = useState<PersistedState>(() => getPersistedState());
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pixiRef = useRef<PixiApp | null>(null);
  const sceneRef = useRef<SceneController | null>(null);
  const spineManagerRef = useRef<SpineManager | null>(null);
  const animationRef = useRef<AnimationController | null>(null);
  const metricsRef = useRef<PerformanceMonitor | null>(null);
  const benchmarkRef = useRef({
    active: false,
    durationMs: 10_000,
    samples: [] as number[],
    startAt: 0,
    stopRequested: false,
  });
  const benchmarkProgressEmitRef = useRef(0);

  const [models, setModels] = useState<SpineModel[]>([]);
  const [activeModel, setActiveModel] = useState<SpineModel | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const [speed, setSpeed] = useState(persisted.speed);
  const [mode, setModeState] = useState<PlaybackMode>(persisted.mode);
  const [paused, setPaused] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<string>("");
  const [alpha, setAlpha] = useState(1);
  const [debugBones, setDebugBones] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(persisted.theme);
  const [metrics, setMetrics] = useState<PerformanceSnapshot>({
    fps: 0,
    frameTimeMs: 0,
  });
  const [notices, setNotices] = useState<PreviewNotice[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkUiState>({ status: "idle" });
  const [performanceBaseline, setPerformanceBaseline] = useState<PerformanceBaseline | null>(null);
  const [atlasLiveTick, setAtlasLiveTick] = useState(0);
  const themeRef = useRef<"dark" | "light">(persisted.theme);

  const centerModelInCanvas = useCallback((model: SpineModel | null) => {
    if (!model) {
      return;
    }
    const scene = sceneRef.current;
    const pixi = pixiRef.current;
    if (!scene || !pixi) {
      return;
    }
    scene.center(model.spine);
    scene.centerInView(pixi.app.renderer.width, pixi.app.renderer.height);
  }, []);

  const pushNotice = useCallback((level: NoticeLevel, messageKey: MessageKey, vars?: MessageVars) => {
    const id = crypto.randomUUID();
    setNotices((old) => [...old, { id, level, messageKey, vars }]);
    window.setTimeout(() => {
      setNotices((old) => old.filter((item) => item.id !== id));
    }, 5500);
  }, []);

  const dismissNotice = useCallback((id: string) => {
    setNotices((old) => old.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ speed, mode, theme }));
  }, [speed, mode, theme]);

  const activeSkinName = activeModel?.spine.skeleton.skin?.name ?? "";

  const performanceReport = useMemo(() => {
    if (!activeModel) {
      return null;
    }
    return buildSpinePerformanceReport(activeModel.spine.skeleton);
  }, [activeModel, selectedSkin, activeSkinName]);

  const atlasCore = useMemo(() => {
    if (!activeModel?.atlasText) {
      return null;
    }
    return buildAtlasAnalysis(
      activeModel.atlasText,
      activeModel.atlasFileName,
      activeModel.spine.skeleton,
    );
  }, [activeModel?.id, activeModel?.atlasText, activeModel?.atlasFileName, selectedSkin, activeSkinName]);

  const atlasReport = useMemo(() => {
    if (!atlasCore || !activeModel) {
      return atlasCore;
    }
    void atlasLiveTick;
    return attachAtlasRenderPasses(atlasCore, activeModel.spine.skeleton);
  }, [atlasCore, activeModel, atlasLiveTick]);

  useEffect(() => {
    animationRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    animationRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    themeRef.current = theme;
    pixiRef.current?.setBackground(rendererBackgroundByTheme[theme]);
  }, [theme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const pixi = new PixiApp();
    const scene = new SceneController();
    const animationController = new AnimationController();
    void pixi.initialize(host).then(() => {
      pixi.stageRoot.addChild(scene.viewport);
      scene.attach(host);

      const spineLayer = new Container();
      scene.viewport.addChild(spineLayer);

      pixiRef.current = pixi;
      pixi.setBackground(rendererBackgroundByTheme[themeRef.current]);
      sceneRef.current = scene;
      spineManagerRef.current = new SpineManager(spineLayer);
      animationRef.current = animationController;
      metricsRef.current = new PerformanceMonitor(pixi.app);

      let atlasTicker = 0;
      pixi.app.ticker.add(() => {
        const current = metricsRef.current?.getSnapshot();
        if (current) {
          setMetrics(current);
        }

        atlasTicker++;
        if (atlasTicker % 18 === 0) {
          setAtlasLiveTick((n) => n + 1);
        }

        const bench = benchmarkRef.current;
        if (bench.active && current) {
          bench.samples.push(current.frameTimeMs);
          const elapsed = performance.now() - bench.startAt;
          const progress = Math.min(1, elapsed / bench.durationMs);
          const now = performance.now();
          if (now - benchmarkProgressEmitRef.current > 120) {
            benchmarkProgressEmitRef.current = now;
            setBenchmark({ status: "running", progress });
          }

          if (elapsed >= bench.durationMs || bench.stopRequested) {
            bench.active = false;
            bench.stopRequested = false;
            const result = summarizeBenchmark(bench.samples, elapsed);
            bench.samples = [];
            benchmarkProgressEmitRef.current = 0;
            setBenchmark({ status: "done", result });
          }
        }
      });
    });

    return () => {
      metricsRef.current?.stop();
      pixiRef.current?.destroy();
    };
  }, []);

  const loadFiles = useCallback(async (files: FileList) => {
    const bundles = DragDropHandler.parseBundles(files);
    const manager = spineManagerRef.current;
    const animation = animationRef.current;
    const scene = sceneRef.current;
    if (!manager || !animation || !scene) {
      pushNotice("error", "notice.renderer_not_ready");
      return;
    }

    if (files.length === 0) {
      pushNotice("info", "notice.no_files");
      return;
    }

    if (bundles.length === 0) {
      pushNotice("error", "notice.no_valid_bundle");
      return;
    }

    pushNotice("info", "notice.bundles_loading", { count: bundles.length });

    for (const bundle of bundles) {
      try {
        const model = await manager.loadBundle(bundle);
        setModels(manager.models);
        pushNotice("success", "notice.loaded_ok", { name: model.name });
        if (!manager.getActiveModel() || !activeModel) {
          setActiveModel(model);
          animation.bind(model);
          centerModelInCanvas(model);
          setSelectedSkin(model.skins[0] ?? "");
        }
      } catch (error) {
        const details =
          error instanceof Error ? error.message : "Unknown error during bundle parsing.";
        pushNotice("error", "notice.load_failed", { name: bundle.name, details });
      }
    }
  }, [activeModel, pushNotice, centerModelInCanvas]);

  const selectModel = useCallback((id: string) => {
    const manager = spineManagerRef.current;
    const animation = animationRef.current;
    const scene = sceneRef.current;
    if (!manager || !animation || !scene) {
      return;
    }
    const model = manager.setActiveModel(id);
    setActiveModel(model);
    animation.bind(model);
    setActiveAnimation(null);
    setPaused(false);
    if (model) {
      centerModelInCanvas(model);
      setSelectedSkin(model.skins[0] ?? "");
    }
  }, [centerModelInCanvas]);

  const removeModel = useCallback((id: string) => {
    const manager = spineManagerRef.current;
    const animation = animationRef.current;
    const scene = sceneRef.current;
    if (!manager || !animation || !scene) {
      return;
    }

    const nextModel = manager.removeModel(id);
    setModels(manager.models);
    setActiveModel(nextModel);
    setActiveAnimation(null);
    setPaused(false);
    setDebugBones(false);

    if (nextModel) {
      animation.bind(nextModel);
      centerModelInCanvas(nextModel);
      setSelectedSkin(nextModel.skins[0] ?? "");
      pushNotice("info", "notice.removed_active", { name: nextModel.name });
    } else {
      animation.bind(null);
      setSelectedSkin("");
      pushNotice("info", "notice.removed_none");
    }
  }, [pushNotice, centerModelInCanvas]);

  const playAnimation = useCallback((name: string) => {
    animationRef.current?.play(name);
    setActiveAnimation(name);
    setPaused(false);
  }, []);

  const setPlaybackMode = useCallback((nextMode: PlaybackMode) => {
    animationRef.current?.setMode(nextMode);
    setModeState(nextMode);
  }, []);

  const changeSpeed = useCallback((nextSpeed: number) => {
    animationRef.current?.setSpeed(nextSpeed);
    setSpeed(nextSpeed);
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (!activeModel) {
      return;
    }
    animationRef.current?.togglePause();
    setPaused((old) => !old);
  }, [activeModel]);

  const reset = useCallback(() => {
    animationRef.current?.reset();
    setPaused(false);
  }, []);

  const setSkin = useCallback((skinName: string) => {
    animationRef.current?.setSkin(skinName);
    setSelectedSkin(skinName);
  }, []);

  const setModelAlpha = useCallback((nextAlpha: number) => {
    animationRef.current?.setAlpha(nextAlpha);
    setAlpha(nextAlpha);
  }, []);

  const toggleDebug = useCallback((enabled: boolean) => {
    const model = spineManagerRef.current?.getActiveModel();
    if (!model) return;
    model.spine.debug = enabled ? new SpineDebugRenderer() : undefined;
    setDebugBones(enabled);
  }, []);

  const startBenchmark = useCallback(
    (durationSec: number) => {
      if (!pixiRef.current || !metricsRef.current) {
        pushNotice("error", "notice.renderer_not_ready");
        return;
      }
      if (benchmarkRef.current.active) {
        return;
      }
      const bench = benchmarkRef.current;
      bench.active = true;
      bench.durationMs = Math.max(1, durationSec) * 1000;
      bench.samples = [];
      bench.startAt = performance.now();
      bench.stopRequested = false;
      benchmarkProgressEmitRef.current = 0;
      setBenchmark({ status: "running", progress: 0 });
      pushNotice("info", "notice.benchmark_started", { seconds: durationSec });
    },
    [pushNotice],
  );

  const stopBenchmark = useCallback(() => {
    if (!benchmarkRef.current.active) {
      return;
    }
    benchmarkRef.current.stopRequested = true;
  }, []);

  const clearBenchmark = useCallback(() => {
    setBenchmark({ status: "idle" });
  }, []);

  const capturePerformanceBaseline = useCallback(() => {
    if (!activeModel || !performanceReport) {
      pushNotice("error", "notice.no_baseline_skeleton");
      return;
    }
    setPerformanceBaseline({
      label: "A",
      modelName: activeModel.name,
      report: performanceReport,
    });
    pushNotice("info", "notice.baseline_captured", { name: activeModel.name });
  }, [activeModel, performanceReport, pushNotice]);

  const clearPerformanceBaseline = useCallback(() => {
    setPerformanceBaseline(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        togglePause();
      } else if (event.key.toLowerCase() === "r") {
        reset();
      } else if (event.key.toLowerCase() === "l") {
        setPlaybackMode(mode === "loop" ? "once" : "loop");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, reset, setPlaybackMode, togglePause]);

  const controls = useMemo(
    () => ({
      hostRef,
      viewModel: {
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
        metrics,
        notices,
        benchmark,
        performanceReport,
        performanceBaseline,
        atlasReport,
      },
      actions: {
        loadFiles,
        selectModel,
        removeModel,
        playAnimation,
        setPlaybackMode,
        changeSpeed,
        togglePause,
        reset,
        setSkin,
        setModelAlpha,
        toggleDebug,
        setTheme,
        dismissNotice,
        startBenchmark,
        stopBenchmark,
        clearBenchmark,
        capturePerformanceBaseline,
        clearPerformanceBaseline,
      },
    }),
    [
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
      metrics,
      notices,
      benchmark,
      performanceReport,
      performanceBaseline,
      atlasReport,
      loadFiles,
      selectModel,
      removeModel,
      playAnimation,
      setPlaybackMode,
      changeSpeed,
      togglePause,
      reset,
      setSkin,
      setModelAlpha,
      toggleDebug,
      setTheme,
      dismissNotice,
      startBenchmark,
      stopBenchmark,
      clearBenchmark,
      capturePerformanceBaseline,
      clearPerformanceBaseline,
    ],
  );

  return controls;
}
