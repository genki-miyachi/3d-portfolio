# Astro + React 統合ルール

## Client Directives

- R3F を含む React コンポーネントは **必ず `client:only="react"`** を使う
  - `client:load` は SSR 時に `window`/`document` が存在せずクラッシュする
  - R3F の Canvas は DOM API に依存するため SSR 不可
- 3D に関係しない軽量 React コンポーネントは `client:load` または `client:visible` でもOK

```astro
<!-- Good: R3F コンポーネント -->
<Scene client:only="react" />

<!-- Bad: SSR でクラッシュする -->
<Scene client:load />
```

## Astro / React の役割分担

| 担当 | Astro | React |
|------|-------|-------|
| ページルーティング | `src/pages/` | - |
| HTML shell / meta | `Layout.astro` | - |
| 3D シーン全体 | - | `Scene.tsx` 以下 |
| インタラクティブUI | - | Navigation, セクション |
| 静的コンテンツ | 可 | 可（Scroll html 内） |

## Vite 設定

`astro.config.mjs` で以下を設定:

```js
vite: {
  ssr: {
    noExternal: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  },
}
```

R3F 関連パッケージが SSR バンドルで解決できるようにする。
`client:only` を使っている場合は不要だが、安全のため設定しておく。

## ファイル配置

- `.astro` ファイル: `src/pages/`, `src/layouts/` のみ
- `.tsx` ファイル: `src/components/` 以下
- 共有データ/型: `src/data/`
- Astro コンポーネントから React コンポーネントを import する場合、default export を使う

## 型定義

`src/env.d.ts` に以下を追加（Vite の raw import 用）:

```typescript
declare module '*.vert?raw' {
  const value: string;
  export default value;
}
declare module '*.frag?raw' {
  const value: string;
  export default value;
}
declare module '*.glsl?raw' {
  const value: string;
  export default value;
}
```

## ビルド時の注意

- `npm run build` で static site として出力（SSR adapter 不要）
- R3F コンポーネントは `client:only` なのでビルド時にサーバーで実行されない
- 環境変数が必要な場合は `PUBLIC_` プレフィックスで Astro の規約に従う
