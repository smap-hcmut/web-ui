# SMAP — Social Media Analysis Platform

Desktop app: Electron + Next.js 15 + React 19 + TypeScript + Tailwind CSS 3.

## Quick Start

```bash
# Install dependencies
npm install

# Dev mode (browser only)
npm run dev
# -> http://localhost:3000 (LAN accessible)

# Dev mode (Electron window + DevTools)
npm run electron:dev
```

## Build Electron App

### Windows (.exe installer)
```bash
npm run electron:build:win
```

### macOS (.dmg)
```bash
npm run electron:build:mac
```

### Linux (.AppImage)
```bash
npm run electron:build:linux
```

Output goes to `release/` folder.

## What the build does

`electron:build:win` runs 3 steps in sequence:

1. **`next build`** — compiles Next.js app to `.next/`
2. **`tsc -p electron/tsconfig.json`** — compiles `electron/main.ts`, `preload.ts`, and `server.ts` to `dist-electron/`
3. **`electron-builder --win`** — packages everything into NSIS installer

## Build output layout

```
dist-electron/
  electron/
    main.js             # Electron main process entry
    preload.js          # Context bridge
  server.js             # Next.js custom server (forked by main.js in production)
```

## Project Structure

```
src/                    # Next.js app (pages, components, lib)
electron/
  main.ts               # Electron main process (window, tray, server spawn)
  preload.ts            # Context bridge
  tsconfig.json         # Compiles electron/ + server.ts -> dist-electron/
server.ts               # Custom Next.js server (0.0.0.0, LAN accessible)
release/                # Build output (git-ignored)
dist-electron/          # Compiled electron files (git-ignored)
```

## Notes

- Menu bar is hidden — app shows as a clean frameless-style window
- Production build forks `server.js` as child process inside Electron
- Dev mode uses `concurrently` to run server + Electron separately
- Server binds `0.0.0.0` so other devices on LAN can access via IP
- Default port: `3000` (configurable via `PORT` env var)

## Troubleshooting

**`electron-builder` fails to download Electron binary:**
VPN may be needed if `github.com` is blocked. Or set `ELECTRON_BUILDER_OFFLINE=true` to use local cache.

**`Internal Server Error` after install:**
Clear `dist-electron/` and rebuild: `rm -rf dist-electron && npm run electron:build:win`
