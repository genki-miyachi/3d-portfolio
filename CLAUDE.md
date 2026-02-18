# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro + React Three Fiber で構築するエンジニア向け3Dポートフォリオサイト。
ダークグレー×グリーン（ターミナル美学）のカオス＋幾何学デザイン。

## Tech Stack

- **Framework**: Astro (minimal template)
- **UI**: React (Astro integration via `@astrojs/react`)
- **3D**: React Three Fiber + @react-three/drei + @react-three/postprocessing + three.js
- **Font**: JetBrains Mono (Google Fonts)
- **Styling**: CSS Custom Properties (global tokens) + CSS Modules (React components)

## Commands

```bash
npm run dev        # 開発サーバー起動 (localhost:4321)
npm run build      # プロダクションビルド
npm run preview    # ビルド結果のプレビュー
```

## Architecture

### Single Page, 3D Camera Scroll

サイト全体が1つの R3F Canvas。スクロールでカメラが3D空間内を移動し、各セクションに到達する体験。

```
index.astro
  └─ Scene.tsx (client:only="react")
       ├─ Canvas (fullscreen fixed)
       │   ├─ ScrollControls (pages=8)
       │   │   ├─ CameraRig          ← useScroll で offset 読み取り、カメラを lerp
       │   │   ├─ ParticleField       ← カスタムシェーダーによるパーティクルシステム
       │   │   ├─ GeometricShapes     ← ワイヤーフレーム幾何学体
       │   │   └─ <Scroll html>       ← HTML セクション (同期スクロール)
       │   │        ├─ HeroSection
       │   │        ├─ AboutSection
       │   │        ├─ SkillsSection
       │   │        ├─ ExperienceSection
       │   │        ├─ WorksSection
       │   │        └─ ContactSection
       │   └─ EffectComposer + Bloom
       └─ Navigation (Canvas 外, fixed)
```

### Key Design Decisions

- **3Dオブジェクトは `<Scroll>` の外に配置**: ScrollControls の自動Y移動とカメラ移動の二重移動を防ぐ
- **HTML は `<Scroll html>` 内**: スクロール位置と自動同期
- **Navigation は Canvas 外**: R3F の scroll context に依存しない固定UI

### File Structure

```
src/
  components/
    Scene.tsx              # R3F Canvas ルート
    CameraRig.tsx          # スクロール連動カメラ制御
    ParticleField.tsx      # パーティクルシステム (カスタムシェーダー)
    GeometricShapes.tsx    # 浮遊ワイヤーフレーム幾何学体
    sections/              # HTML overlay セクション
    ui/                    # Navigation, SectionTitle 等
  shaders/                 # GLSL シェーダーファイル (.vert, .frag, .glsl)
  styles/
    global.css             # CSS Custom Properties, reset, typography
  data/
    portfolio.ts           # スキル・職歴・制作物データ
  layouts/
    Layout.astro           # HTML shell
  pages/
    index.astro            # エントリーポイント
```

### Color Tokens

全て `src/styles/global.css` の CSS Custom Properties で定義。直接カラーコードを書かず、必ずトークンを使う。

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0a0a` | 背景 |
| `--surface` | `#1a1a1a` | カード等の表面 |
| `--border` | `#2a2a2a` | ボーダー |
| `--text-primary` | `#e0e0e0` | メインテキスト |
| `--text-secondary` | `#888888` | サブテキスト |
| `--accent` | `#00ff41` | アクセント (ターミナルグリーン) |
| `--accent-dim` | `#00cc33` | アクセント暗め |

### Section Layout (ScrollControls pages=8)

| Section | scroll offset | top (CSS) |
|---------|--------------|-----------|
| Hero | 0.00 | 0vh |
| About | 0.15 | 120vh |
| Skills | 0.30 | 240vh |
| Experience | 0.50 | 400vh |
| Works | 0.70 | 560vh |
| Contact | 0.90 | 720vh |
