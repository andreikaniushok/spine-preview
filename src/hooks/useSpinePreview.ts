import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpineDebugRenderer } from "@esotericsoftware/spine-pixi-v8";
import { Container } from "pixi.js";
import { PixiApp } from "../core/PixiApp";
import { SceneController } from "../core/SceneController";
import { SpineManager } from "../spine/SpineManager";
import { AnimationController } from "../animation/AnimationController";
import { DragDropHandler } from "../utils/DragDropHandler";
import { PerformanceMonitor } from "../utils/PerformanceMonitor";
import type { PerformanceSnapshot, PlaybackMode, SpineModel } from "../types/spine";

const STORAGE_KEY = "spine-preview-state";

interface PersistedState {
  speed: number;
  mode: PlaybackMode;
  theme: "dark" | "light";
}

type NoticeLevel = "success" | "error" | "info";

interface Notice {
  id: string;
  level: NoticeLevel;
  message: string;
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
  const [notices, setNotices] = useState<Notice[]>([]);
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

  const pushNotice = useCallback((level: NoticeLevel, message: string) => {
    const id = crypto.randomUUID();
    setNotices((old) => [...old, { id, level, message }]);
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

      pixi.app.ticker.add(() => {
        const current = metricsRef.current?.getSnapshot();
        if (current) {
          setMetrics(current);
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
      pushNotice("error", "Renderer is not ready yet. Try again in a second.");
      return;
    }

    if (files.length === 0) {
      pushNotice("info", "No files selected.");
      return;
    }

    if (bundles.length === 0) {
      pushNotice(
        "error",
        "No valid Spine bundle found. Need .json/.skel + .atlas + textures.",
      );
      return;
    }

    pushNotice("info", `Found ${bundles.length} bundle(s). Loading...`);

    for (const bundle of bundles) {
      try {
        const model = await manager.loadBundle(bundle);
        setModels(manager.models);
        pushNotice("success", `Loaded "${model.name}" successfully.`);
        if (!manager.getActiveModel() || !activeModel) {
          setActiveModel(model);
          animation.bind(model);
          centerModelInCanvas(model);
          setSelectedSkin(model.skins[0] ?? "");
        }
      } catch (error) {
        const details =
          error instanceof Error ? error.message : "Unknown error during bundle parsing.";
        pushNotice("error", `Failed to load "${bundle.name}": ${details}`);
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
      pushNotice("info", `Removed model. Active: "${nextModel.name}".`);
    } else {
      animation.bind(null);
      setSelectedSkin("");
      pushNotice("info", "Removed model. No models left.");
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
      dismissNotice,
    ],
  );

  return controls;
}
