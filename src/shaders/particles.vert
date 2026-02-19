// ============================================================================
// 4D Regular Polytope Particle Shader — Vertex
//
// 4次元正多胞体（5-cell, tesseract, 16-cell, 24-cell, 600-cell）の辺上に
// サンプリングされたパーティクルを、GPU側で4D回転 → 3D透視投影する。
// セクション切り替え時は隣接する2つの多胞体間で smoothstep モーフィング。
// ============================================================================

uniform float uTime;
uniform float uMorphIndex;
uniform float uProjectDist;

#define MAX_RIPPLES 8
uniform vec3 uRippleOrigins[MAX_RIPPLES];
uniform float uRippleTimes[MAX_RIPPLES];
uniform int uRippleCount;

// 各セクションに対応する4D多胞体の頂点座標 (xyzw)
// CPU側で辺上にランダムサンプリング済み
attribute vec4 aTarget0; // 正五胞体   (5-cell):   5頂点, 10辺
attribute vec4 aTarget1; // 正八胞体   (tesseract): 16頂点, 32辺
attribute vec4 aTarget2; // 正十六胞体 (16-cell):   8頂点, 24辺
attribute vec4 aTarget3; // 正二十四胞体 (24-cell): 24頂点, 96辺
attribute vec4 aTarget4; // 正六百胞体 (600-cell): 120頂点, 720辺
attribute vec4 aTarget5; // ループ用 (= aTarget0)
attribute float aRandom;

varying float vAlpha;
varying float vRandom;

// noise.glsl (Simplex 3D noise) が先頭に結合される

// セクションインデックスから対応する4D座標を取得
// GLSL ES ではattribute の動的インデックスが使えないため分岐で対処
vec4 getTarget(int idx) {
  if (idx <= 0) return aTarget0;
  if (idx == 1) return aTarget1;
  if (idx == 2) return aTarget2;
  if (idx == 3) return aTarget3;
  if (idx == 4) return aTarget4;
  return aTarget5;
}

// ============================================================================
// 4D回転
//
// 4次元空間には6つの基本回転平面がある (XY, XZ, XW, YZ, YW, ZW)。
// 3次元の回転が2D平面内の回転であるのと同様に、4次元の回転は2つの軸を
// 含む平面内で行われる。ここでは3つの平面で独立に回転を適用する:
//
//   XW平面: 3次元では観測できない「超回転」。テッセラクトが裏返るように見える。
//   YZ平面: 通常の3次元回転（前後・上下の回転に相当）。
//   ZW平面: もう一つの超回転。XW と組み合わせて複雑な4D運動を生成。
//
// 各回転は2x2回転行列 R(θ) = [[cos θ, -sin θ], [sin θ, cos θ]] を
// 対応する2軸に適用する形で実装。速度を変えて非周期的な動きを作る。
// ============================================================================
vec4 rotate4D(vec4 p, float time) {
  float c, s;

  // XW平面回転: x' = x cos θ - w sin θ, w' = x sin θ + w cos θ
  float a1 = time * 0.15;
  c = cos(a1); s = sin(a1);
  p = vec4(c * p.x - s * p.w, p.y, p.z, s * p.x + c * p.w);

  // YZ平面回転: y' = y cos θ - z sin θ, z' = y sin θ + z cos θ
  float a2 = time * 0.12;
  c = cos(a2); s = sin(a2);
  p = vec4(p.x, c * p.y - s * p.z, s * p.y + c * p.z, p.w);

  // ZW平面回転: z' = z cos θ - w sin θ, w' = z sin θ + w cos θ
  float a3 = time * 0.09;
  c = cos(a3); s = sin(a3);
  p = vec4(p.x, p.y, c * p.z - s * p.w, s * p.z + c * p.w);

  return p;
}

// ============================================================================
// 4D → 3D 透視投影
//
// 3Dの透視投影が z 軸方向の距離でスケーリングするのと同様に、
// 4D→3D 投影では w 軸方向の距離でスケーリングする。
//
//   scale = d / (d - w)
//   (x', y', z') = (x, y, z) * scale
//
// d (uProjectDist) は投影面までの距離。w が d に近づくと scale → ∞ で
// 手前に飛び出し、w が負方向に離れると scale → 0 で縮小する。
// ============================================================================
vec3 projectTo3D(vec4 p) {
  float s = uProjectDist / (uProjectDist - p.w);
  return p.xyz * s;
}

void main() {
  // --- モーフィング ---
  // uMorphIndex (0.0〜5.0) の整数部で2つの隣接形状を選び、
  // 小数部を smoothstep で補間して滑らかに変形する
  int lower = int(floor(uMorphIndex));
  int upper = min(lower + 1, 5);
  float t = fract(uMorphIndex);
  t = t * t * (3.0 - 2.0 * t); // Hermite smoothstep

  vec4 pos4d = mix(getTarget(lower), getTarget(upper), t);

  // --- 4D回転 → 3D投影 ---
  pos4d = rotate4D(pos4d, uTime);
  vec3 pos = projectTo3D(pos4d);

  // --- ノイズによる微小変位 ---
  // Simplex noise で有機的な揺らぎを加える
  float noiseVal = snoise(pos * 0.15 + uTime * 0.04);
  pos += normal * noiseVal * 0.2;

  // --- 浮遊モーション ---
  // パーティクルごとに位相をずらした sin/cos で微小な浮遊運動
  pos.x += sin(uTime * 0.3 + aRandom * 6.28) * 0.12;
  pos.y += cos(uTime * 0.25 + aRandom * 6.28) * 0.12;
  pos.z += sin(uTime * 0.2 + aRandom * 3.14) * 0.08;

  // --- クリックリップル ---
  // 最大8個のリップルを加算合成。各リップルは:
  //   1. クリック地点からの距離で影響度 (smoothstep) を決定
  //   2. 放射方向 + ランダム散乱方向をブレンドして拡散方向を決定
  //   3. 時間エンベロープ: smoothstep で急速に拡散 → exp 減衰で緩やかに復帰
  for (int i = 0; i < MAX_RIPPLES; i++) {
    if (i >= uRippleCount) break;
    float rippleTime = uRippleTimes[i];
    if (rippleTime < 0.0) continue;

    vec3 origin = uRippleOrigins[i];
    float dist = distance(pos, origin);
    float influence = smoothstep(10.0, 0.0, dist);

    // 放射方向 + 疑似乱数による散乱方向のブレンド
    vec3 radial = normalize(pos - origin + 0.001);
    float seed = aRandom + float(i) * 0.37;
    vec3 scatter;
    scatter.x = sin(seed * 123.45 + 0.7);
    scatter.y = cos(seed * 67.89 + 1.3);
    scatter.z = sin(seed * 45.67 + 2.1);
    vec3 dir = normalize(mix(radial, scatter, 0.6));

    float magnitude = influence * (4.0 + aRandom * 8.0);

    // 時間エンベロープ: attack (smoothstep) → decay (exponential)
    float peakTime = 0.35 + aRandom * 0.15;
    float envelope;
    if (rippleTime < peakTime) {
      float rt = rippleTime / peakTime;
      envelope = rt * rt * (3.0 - 2.0 * rt); // smoothstep attack
    } else {
      float returnRate = 0.15 + aRandom * 0.25;
      envelope = exp(-(rippleTime - peakTime) * returnRate); // exp decay
    }

    pos += dir * magnitude * envelope;
  }

  // --- 最終出力 ---
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  // パーティクルサイズ: 距離に反比例 (透視投影の模倣)
  float size = 0.6 + aRandom * 0.8;
  gl_PointSize = size * (200.0 / -mvPos.z);

  // 遠方で徐々にフェードアウト
  vAlpha = smoothstep(60.0, 10.0, -mvPos.z) * (0.15 + aRandom * 0.35);
  vRandom = aRandom;
}
