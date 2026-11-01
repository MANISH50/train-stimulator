# ADR 0001 — Three.js + TypeScript (browser first)

**Status:** accepted (2026-11-01, chosen by project owner)

**Context:** Options were Godot 4, Three.js/Babylon.js, Unity/Unreal. Godot is not installed on the dev laptop; Node 24 is. The game must run at 60 FPS on integrated GPUs and be testable by automated agents.

**Decision:** Vite + TypeScript + Three.js, WebGL2, scene-graph (not ECS) for Phase 1. Desktop builds later via Tauri (smaller than Electron; WebView2 on Windows is Chromium-based — see docs/research/04-prior-art-licensing.md §6).

**Consequences:**
- No install for players; every change can be checked in a browser and with Playwright.
- Top-end visuals are harder than in Godot/Unity; we rely on a strict frame budget (instancing, few draw calls, one shadow map).
- Keep the renderer behind `GameRenderer` so a WebGPU path can be added later.
