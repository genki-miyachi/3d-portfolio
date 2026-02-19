# 3D Portfolio

Astro + React Three Fiber で構築したインタラクティブ 3D ポートフォリオサイト。

**Live**: [miyachi-genki.com](https://miyachi-genki.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) (Static Site Generation) |
| UI | React 19 |
| 3D | React Three Fiber + Three.js |
| Post-processing | @react-three/postprocessing (Bloom) |
| Shader | Custom GLSL (Simplex noise + 4D polytope projection) |
| Styling | CSS Modules + CSS Custom Properties |
| Font | JetBrains Mono |
| Deploy | Cloudflare Pages |
| CI | GitHub Actions (type check + build) |

## Architecture

```
index.astro
  └─ Scene.tsx (client:only="react")
       ├─ Canvas (fullscreen fixed)
       │   ├─ CameraRig          ← activeSection で lerp 遷移 + マウスパララックス
       │   ├─ ParticleField       ← 4D正多胞体 → GPU回転 → 3D投影 (custom shader)
       │   ├─ GridFloor           ← 無限グリッド (カメラ追従スナップ)
       │   └─ EffectComposer      ← Bloom
       └─ HTML Overlay (fixed)
            ├─ HeroSection        ← タイピングアニメーション
            ├─ MenuScroller       ← 無限スクロールホイール (物理演算 + スナップ)
            └─ Modal sections     ← About / Skills / Experience / Contact
```

### Key Design Decisions

> 詳細は [docs/adr/](docs/adr/) を参照

- **自前カメラ制御** ([ADR-001](docs/adr/001-custom-camera-control.md)):
  drei の `ScrollControls` ではなく、キーフレーム配列 + lerp + パララックスで自由なカメラパスを実現
- **CSS Modules** ([ADR-002](docs/adr/002-css-modules-over-alternatives.md)):
  ゼロランタイム・スコープ安全なスタイリング。CSS Custom Properties でテーマトークンを一元管理

## 4D Polytope Particle System

パーティクルシステムの中核は**4次元正多胞体**（regular 4-polytope）。各セクションに異なる多胞体を割り当て、セクション切り替え時にモーフィングする。

| Section | Polytope | Vertices | Edges |
|---------|----------|----------|-------|
| Hero | 正五胞体 (5-cell) | 5 | 10 |
| About | 正八胞体 (Tesseract) | 16 | 32 |
| Skills | 正十六胞体 (16-cell) | 8 | 24 |
| Experience | 正二十四胞体 (24-cell) | 24 | 96 |
| Contact | 正六百胞体 (600-cell) | 120 | 720 |

### Pipeline

```
CPU (ParticleField.tsx)              GPU (particles.vert)
─────────────────────────            ────────────────────────
1. 多胞体の頂点座標を生成           4. 隣接2形状を smoothstep モーフ
2. 辺を検出 (距離²ベース)           5. XW/YZ/ZW 平面で4D回転
3. 辺上にパーティクルをサンプリング   6. 4D→3D 透視投影 (w軸距離)
   → attribute として送信            7. Simplex noise + 浮遊 + リップル
```

### 4D Rotation

4次元空間には6つの基本回転平面がある（3次元の3軸回転に対応）。
本実装では XW・YZ・ZW の3平面でそれぞれ異なる角速度の回転を適用し、
非周期的で複雑な4D運動を生成している。

```glsl
// XW平面回転 — 3次元では観測できない「超回転」
p = vec4(cos(θ) * p.x - sin(θ) * p.w, p.y, p.z, sin(θ) * p.x + cos(θ) * p.w);
```

### Click Ripple

クリック地点から放射状にパーティクルが拡散→指数減衰で復帰。最大8個の同時リップルを加算合成。

## Performance Strategy

- **Adaptive particle count**: デスクトップ 6,000 / モバイル 2,000
- **DPR auto-scaling**: `PerformanceMonitor` で 1〜2 の範囲で動的調整
- **GPU-side computation**: 4D回転・投影・ノイズはすべてシェーダー内で処理
- **Object pooling**: `useRef` キャッシュで `useFrame` 内のアロケーションゼロ
- **Geometry/Material lifecycle**: `useEffect` cleanup で明示的に `dispose()`

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `j` / `↓` / `→` | 次のメニューアイテム |
| `k` / `↑` / `←` | 前のメニューアイテム |
| `l` / `Enter` | セクションを開く |
| `h` / `Escape` | セクションを閉じる |

## Development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # Static build → dist/
npm run preview    # Preview build output
```

## Project Structure

```
src/
  components/
    Scene.tsx              # R3F Canvas root + modal overlay
    CameraRig.tsx          # Scroll-linked camera with parallax
    ParticleField.tsx      # 4D polytope particle system
    GridFloor.tsx          # Infinite grid floor
    sections/              # About, Skills, Experience, Contact
    ui/                    # MenuScroller, SectionTitle
  shaders/
    noise.glsl             # Simplex 3D noise (Stefan Gustavson)
    particles.vert         # 4D rotation + projection + ripple
    particles.frag         # Point sprite with soft glow
  data/
    portfolio.json         # Content data
    portfolio.ts           # Type definitions + exports
  styles/
    global.css             # CSS Custom Properties + reset
  layouts/
    Layout.astro           # HTML shell + SEO meta
  pages/
    index.astro            # Entry point
docs/
  adr/                     # Architecture Decision Records
```
