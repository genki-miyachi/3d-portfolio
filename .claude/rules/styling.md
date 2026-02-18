# スタイリングルール

## 基本方針

- **CSS Custom Properties** (`--token-name`) を `src/styles/global.css` で定義
- **CSS Modules** (`.module.css`) を React コンポーネントで使用
- Astro コンポーネントは `<style>` スコープドスタイルを使用
- Tailwind は使わない

## カラー

直接カラーコードをコンポーネントに書かない。必ず CSS Custom Properties を参照する。

```css
/* Good */
color: var(--accent);
background: var(--bg);

/* Bad */
color: #00ff41;
background: #0a0a0a;
```

R3F 内の Three.js マテリアルは CSS Custom Properties が使えないので、
`src/styles/global.css` のトークン値と一致するリテラル値を使う。コメントでトークン名を記載。

```tsx
// Good
<meshStandardMaterial color="#00ff41" /> {/* --accent */}

// Bad (マジックナンバー)
<meshStandardMaterial color="#1abc9c" />
```

## タイポグラフィ

- フォント: JetBrains Mono のみ（`var(--font-mono)`）
- `font-size` は `clamp()` でレスポンシブに
- 見出し: `font-weight: 700`、本文: `font-weight: 400`
- アクセントテキスト: `color: var(--accent)` + `text-shadow: var(--accent-glow)`

## レスポンシブ

- ブレークポイント: `768px` (モバイル/デスクトップの境界)
- padding: デスクトップ `0 10vw`、モバイル `0 1.5rem`
- CSS Modules 内で `@media (max-width: 768px)` を使用

## CSS Modules 命名

- ファイル名: `ComponentName.module.css`
- クラス名: camelCase（例: `.sectionTitle`, `.accentText`）
- コンポーネントのルート要素: `.root` または `.section`

## アニメーション

- CSS アニメーションは控えめに。メインのアニメーションは Three.js / R3F 側で処理
- テキストのフェードイン等の軽いアニメーションのみ CSS で実装
- `prefers-reduced-motion` を考慮する
