# Three.js / React Three Fiber ルール

## R3F コンポーネント規約

- R3F コンポーネントは `<Canvas>` 内でのみ使用可能。Canvas 外で `useThree`, `useFrame` 等を呼ぶとクラッシュする
- renderless コンポーネント（CameraRig 等）は `return null` で明示
- `useFrame` 内では毎フレーム実行されるため、オブジェクト生成を避ける。`useRef` でキャッシュすること

## パフォーマンス

- パーティクル数: デスクトップ 5000、モバイル 1500
- `PerformanceMonitor` で DPR を動的調整 (1〜2)
- `<Canvas dpr={[1, 2]}>` で DPR レンジを制限
- `useFrame((state, delta) => ...)` の `delta` を使ってフレームレート非依存にする
- dispose が必要なリソース（Geometry, Material, Texture）は `useEffect` の cleanup で解放

## Bloom / ポストプロセッシング

- Bloom 対象にしたいオブジェクトは:
  1. `toneMapped={false}` をマテリアルに設定
  2. 色を `[0,1]` 以上に持ち上げる（例: `color * 1.5`）
  3. `emissive` + `emissiveIntensity` を設定
- `EffectComposer` は `ScrollControls` の外に配置

## シェーダー

- GLSL ファイルは `src/shaders/` に配置
- Vite の `?raw` import で読み込み: `import vert from './shader.vert?raw'`
- noise 等の共有関数は独立 `.glsl` ファイルにして、文字列結合で注入
- uniform 命名: `u` プレフィックス（例: `uTime`, `uMouse`）
- attribute 命名: `a` プレフィックス（例: `aRandom`, `aTargetPosition`）
- varying 命名: `v` プレフィックス（例: `vAlpha`）

## ScrollControls 統合

- 3Dオブジェクト（ParticleField, GeometricShapes, CameraRig）は `<Scroll>` の**外**に配置
- `useScroll().offset` (0-1) でスクロール進捗を取得し、自前でカメラ・オブジェクト制御
- HTML セクションのみ `<Scroll html>` 内に配置
- カメラパスはキーフレーム配列で定義し、smoothstep 補間で lerp

## マテリアル

- ワイヤーフレーム表示: `wireframe` prop を使用
- パーティクル: `<shaderMaterial>` + `AdditiveBlending` + `depthWrite={false}`
- アクセントカラーオブジェクト: `emissive="#00ff41"` で統一
