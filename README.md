# Spine Preview

Web preview for [Spine](http://esotericsoftware.com/) animations (React + PixiJS + Spine 4.2).

**Try it:** [spine-preview-nine.vercel.app](https://spine-preview-nine.vercel.app/)

## Features

- Drag & drop `.json` / `.skel` + `.atlas` + textures
- Multiple models, skins, play / pause / loop / speed
- Pan & zoom, bone debug, theme & locale (EN / PL / RU)
- FPS metrics, performance analysis, short benchmarks

## Run locally

```bash
npm install
npm run dev
```

Needs Spine **4.2** exports. Build with `npm run build`.

Структура по слоям (`app` / `ui` / `hooks` / `pixi` / `spine` / `import` / `metrics` / `analytics` / `types`): [О_ПРОЕКТЕ.md](О_ПРОЕКТЕ.md).

## License

[MIT](LICENSE)
