// ============================================================================
// 4D Regular Polytope Particle Shader — Fragment
//
// 各パーティクルを円形のソフトグロウとして描画。
// gl_PointCoord (0,0)-(1,1) の中心からの距離でアルファを減衰させ、
// ポストプロセスの Bloom と組み合わせて発光感を出す。
// ============================================================================

varying float vAlpha;
varying float vRandom;

void main() {
  // ポイントスプライトの中心からの距離を計算
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard; // 円形にクリッピング

  // 二乗減衰でエッジを柔らかく
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0);

  // アクセントグリーン (--accent: #00ff41 の暗め)
  // Bloom のしきい値 (luminanceThreshold: 0.2) を大半のパーティクルが
  // 下回るよう意図的に暗くし、集合体としての輝きを表現
  vec3 color = vec3(0.0, 0.7, 0.18);
  color *= 0.6 + vRandom * 0.4; // パーティクルごとに明度をばらつかせる

  gl_FragColor = vec4(color, glow * vAlpha);
}
