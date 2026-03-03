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

### Single Page, Menu-Driven 3D Camera

サイト全体が1つの R3F Canvas。右側の無限スクロールメニュー（MenuScroller）でセクションを選択すると、カメラが3D空間内を移動し、到着後にモーダルが出現する体験。

```
index.astro
  └─ Scene.tsx (client:only="react")
       ├─ Canvas (fullscreen fixed)
       │   ├─ CameraRig          ← activeSection で lerp 遷移 + マウスパララックス
       │   ├─ ParticleField       ← 4D正多胞体カスタムシェーダーパーティクル
       │   ├─ GridFloor           ← 無限グリッド (カメラ追従スナップ)
       │   ├─ SectionPanels      ← セクション光セル + 装飾セル (グリッチ演出)
       │   └─ EffectComposer + Bloom
       └─ HTML Overlay (Canvas 外, fixed)
            ├─ HeroSection        ← 左側タイピングアニメーション
            ├─ MenuScroller       ← 右側無限スクロールホイール
            ├─ LangToggle         ← 言語切り替え
            └─ Modal              ← About / Skills / Experience / Contact (にゅんアニメーション)
```

### Key Design Decisions

- **自前カメラ制御**: drei の ScrollControls ではなく、キーフレーム配列 + lerp + easeInOutQuad でカメラパスを実現
- **モーダルライフサイクル**: セクション選択 → カメラ移動 → グリッド消灯 → にゅんアニメーションでモーダル出現
- **3Dオブジェクトと HTML の分離**: 3D要素は Canvas 内、セクションコンテンツは DOM モーダルとして Canvas 外に表示
- **MenuScroller は Canvas 外**: R3F context に依存しない固定UI

### File Structure

```
src/
  components/
    Scene.tsx              # R3F Canvas ルート + モーダルオーバーレイ
    CameraRig.tsx          # メニュー連動カメラ制御 (lerp + パララックス)
    ParticleField.tsx      # 4D正多胞体パーティクルシステム (カスタムシェーダー)
    GridFloor.tsx          # 無限グリッド (カメラ追従スナップ)
    SectionPanels.tsx      # セクション光セル + 装飾セル (グリッチ演出)
    sections/              # About, Skills, Experience, Contact
      skills/              # SkillsGlitchBars, SkillsTerminal
    ui/                    # MenuScroller, SectionTitle, LangToggle
  contexts/                # LocaleContext (i18n)
  shaders/                 # GLSL シェーダーファイル (.vert, .frag, .glsl)
  styles/
    global.css             # CSS Custom Properties, reset, typography
  data/
    portfolio.ts           # 型定義 + usePortfolio hook
    portfolio-ja.json      # 日本語コンテンツ
    portfolio-en.json      # 英語コンテンツ
  layouts/
    Layout.astro           # HTML shell + SEO meta
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
| `--accent-rgb` | `0, 255, 65` | アクセント RGB (rgba合成用) |
| `--bg-rgb` | `10, 10, 10` | 背景 RGB (rgba合成用) |

### Section Layout (Menu-Driven)

メニュー選択でカメラが3D空間の4方向へ移動し、対応するグリッドセルに到着後モーダルを表示。

| Section | Index | カメラ方向 | グリッドセル位置 |
|---------|-------|-----------|----------------|
| Hero | 0 | 正面 (初期位置) | — |
| About | 1 | 前方 (+Z) | (0, -12, 70) |
| Skills | 2 | 右 (+X) | (70, -12, 0) |
| Experience | 3 | 後方 (-Z) | (0, -12, -70) |
| Contact | 4 | 左 (-X) | (-70, -12, 0) |
