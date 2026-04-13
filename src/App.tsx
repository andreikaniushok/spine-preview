import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { useSpinePreview } from "./hooks/useSpinePreview";

function App() {
  const preview = useSpinePreview();
  const vm = preview.viewModel;
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const classes = useMemo(() => `app app-${vm.theme}`, [vm.theme]);

  useEffect(() => {
    if (!folderInputRef.current) {
      return;
    }
    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  return (
    <div className={classes}>
      <ControlPanel
        models={vm.models}
        activeModel={vm.activeModel}
        activeAnimation={vm.activeAnimation}
        speed={vm.speed}
        mode={vm.mode}
        paused={vm.paused}
        selectedSkin={vm.selectedSkin}
        alpha={vm.alpha}
        debugBones={vm.debugBones}
        theme={vm.theme}
        onModelSelect={preview.actions.selectModel}
        onModelRemove={preview.actions.removeModel}
        onAnimationPlay={preview.actions.playAnimation}
        onSpeedChange={preview.actions.changeSpeed}
        onModeChange={preview.actions.setPlaybackMode}
        onPauseToggle={preview.actions.togglePause}
        onReset={preview.actions.reset}
        onSkinChange={preview.actions.setSkin}
        onAlphaChange={preview.actions.setModelAlpha}
        onDebugToggle={preview.actions.toggleDebug}
        onThemeToggle={preview.actions.setTheme}
      />

      <main
        className={`scene-wrap ${isDraggingFiles ? "drag-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingFiles(true);
        }}
        onDragLeave={() => setIsDraggingFiles(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingFiles(false);
          if (event.dataTransfer.files.length > 0) {
            void preview.actions.loadFiles(event.dataTransfer.files);
          }
        }}
      >
        <div className="overlay scene-actions">
          <button type="button" onClick={() => filesInputRef.current?.click()}>
            Select files
          </button>
          <button type="button" onClick={() => folderInputRef.current?.click()}>
            Select folder
          </button>
          <input
            ref={filesInputRef}
            className="sr-only"
            type="file"
            aria-label="Select Spine files"
            multiple
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files && files.length > 0) {
                void preview.actions.loadFiles(files);
              }
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            className="sr-only"
            type="file"
            aria-label="Select Spine folder"
            multiple
            onChange={(event) => {
              const files = event.currentTarget.files;
              if (files && files.length > 0) {
                void preview.actions.loadFiles(files);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div ref={preview.hostRef} className="pixi-host" />
        <div className="overlay metrics">
          <span>FPS: {vm.metrics.fps.toFixed(0)}</span>
          <span>Frame: {vm.metrics.frameTimeMs.toFixed(2)} ms</span>
        </div>
        <div className="notices">
          {vm.notices.map((notice) => (
            <div key={notice.id} className={`notice notice-${notice.level}`}>
              <span>{notice.message}</span>
              <button type="button" onClick={() => preview.actions.dismissNotice(notice.id)}>
                x
              </button>
            </div>
          ))}
        </div>

        {!vm.activeModel && (
          <div className="overlay drop-hint">
            Drop Spine files here:
            <br />
            <code>.json/.skel + .atlas + textures</code>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
