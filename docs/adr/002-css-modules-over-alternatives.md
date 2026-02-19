# ADR-002: CSS Modules を採用し Tailwind / CSS-in-JS を使わない

## Status

Accepted

## Context

スタイリング手法として以下の候補があった:

| 手法 | 利点 | 懸念 |
|------|------|------|
| **Tailwind CSS** | 高速プロトタイピング、一貫性 | クラス名の可読性低下、3D サイトでは utility class の恩恵が薄い |
| **CSS-in-JS** (styled-components, Emotion) | JS と密結合、動的スタイル | ランタイムコスト、R3F コンポーネントとの相性 |
| **CSS Modules** | ゼロランタイム、スコープ安全、標準的 | 動的スタイルは inline style 併用が必要 |

### このプロジェクトの特性

- コンポーネント数が少ない（10 未満）
- スタイルの大部分は静的（3D 表現は Three.js 側で処理）
- ダークテーマのカラートークンを CSS Custom Properties で一元管理したい
- Astro のビルドパイプラインとの親和性

## Decision

**CSS Modules** + **CSS Custom Properties** を採用する。

- グローバルトークン: `src/styles/global.css` の `:root` で定義
- コンポーネントスタイル: `ComponentName.module.css` でスコープ化
- 動的スタイル（opacity, transform 等）: JSX の `style` prop で最小限に
- Three.js マテリアル: CSS 変数が使えないため、トークン値のリテラル + コメントで対応

## Consequences

### Positive

- バンドルサイズへの影響ゼロ（ビルド時に通常の CSS に変換）
- CSS Custom Properties によるテーマ一元管理が自然にできる
- Vite / Astro のビルドパイプラインでネイティブサポート
- 追加依存なし

### Negative

- 動的スタイルは inline style との併用が必要（モーダルの opacity 切り替え等）
- Three.js マテリアルの色指定は CSS トークンと二重管理になる
