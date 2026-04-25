# Spine Preview

Spine Preview is a React + TypeScript web app for loading, previewing, and testing Spine animations with PixiJS.

## Stack

- React + TypeScript + Vite
- PixiJS v8 renderer
- Spine runtime via `@esotericsoftware/spine-pixi-v8`

## Features

- Drag and drop Spine assets (`.json`/`.skel`, `.atlas`, textures)
- Load multiple animation packs and switch active model
- Animation controls: play, pause, reset, loop/once, speed presets
- Scene interactions: pan (drag) and zoom (mouse wheel)
- Optional skin switch and bone debug mode
- Alpha/transparency control
- Performance overlay: FPS, frame time
- Hotkeys:
  - `Space` - Play/Pause
  - `R` - Reset animation
  - `L` - Toggle Loop/Once
- Persisted settings in localStorage (theme, speed, mode)

## Architecture

Project structure follows modular OOP + SOLID style:

- `src/core`
  - `PixiApp` - Pixi app initialization/lifecycle
  - `SceneController` - viewport transform, zoom, pan, centering
- `src/spine`
  - `SpineManager` - loading and managing Spine models/resources
- `src/animation`
  - `AnimationController` - playback state and animation operations
- `src/utils`
  - `DragDropHandler` - DnD file grouping/parsing
  - `PerformanceMonitor` - frame metrics collection
- `src/components`
  - `ControlPanel` - UI controls
- `src/hooks`
  - `useSpinePreview` - composition/orchestration layer

## Run locally

```bash
yarn install
yarn dev
```

## Build

```bash
yarn build
```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
