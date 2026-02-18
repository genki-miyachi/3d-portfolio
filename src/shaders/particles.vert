uniform float uTime;
uniform float uMorphIndex;

#define MAX_RIPPLES 8
uniform vec3 uRippleOrigins[MAX_RIPPLES];
uniform float uRippleTimes[MAX_RIPPLES];
uniform int uRippleCount;

attribute vec3 aTarget0;
attribute vec3 aTarget1;
attribute vec3 aTarget2;
attribute vec3 aTarget3;
attribute vec3 aTarget4;
attribute vec3 aTarget5;
attribute float aRandom;

varying float vAlpha;
varying float vRandom;

// noise.glsl will be prepended

vec3 getTarget(int idx) {
  if (idx <= 0) return aTarget0;
  if (idx == 1) return aTarget1;
  if (idx == 2) return aTarget2;
  if (idx == 3) return aTarget3;
  if (idx == 4) return aTarget4;
  return aTarget5;
}

void main() {
  // Morph between two adjacent shapes
  int lower = int(floor(uMorphIndex));
  int upper = min(lower + 1, 5);
  float t = fract(uMorphIndex);
  // Smoothstep for nicer transition
  t = t * t * (3.0 - 2.0 * t);

  vec3 pos = mix(getTarget(lower), getTarget(upper), t);

  // Subtle noise displacement
  float noiseVal = snoise(pos * 0.15 + uTime * 0.04);
  pos += normal * noiseVal * 0.2;

  // Gentle floating motion
  pos.x += sin(uTime * 0.3 + aRandom * 6.28) * 0.12;
  pos.y += cos(uTime * 0.25 + aRandom * 6.28) * 0.12;
  pos.z += sin(uTime * 0.2 + aRandom * 3.14) * 0.08;

  // 複数リップルを加算合成
  for (int i = 0; i < MAX_RIPPLES; i++) {
    if (i >= uRippleCount) break;
    float rippleTime = uRippleTimes[i];
    if (rippleTime < 0.0) continue;

    vec3 origin = uRippleOrigins[i];
    float dist = distance(pos, origin);
    float influence = smoothstep(10.0, 0.0, dist);

    // パーティクルごと × リップルごとにランダムな散乱方向
    vec3 radial = normalize(pos - origin + 0.001);
    float seed = aRandom + float(i) * 0.37;
    vec3 scatter;
    scatter.x = sin(seed * 123.45 + 0.7);
    scatter.y = cos(seed * 67.89 + 1.3);
    scatter.z = sin(seed * 45.67 + 2.1);
    vec3 dir = normalize(mix(radial, scatter, 0.6));

    float magnitude = influence * (4.0 + aRandom * 8.0);

    // 時間エンベロープ: ふわっと爆散 → ゆっくり復帰
    float peakTime = 0.35 + aRandom * 0.15;
    float envelope;
    if (rippleTime < peakTime) {
      float rt = rippleTime / peakTime;
      envelope = rt * rt * (3.0 - 2.0 * rt);
    } else {
      float returnRate = 0.15 + aRandom * 0.25;
      envelope = exp(-(rippleTime - peakTime) * returnRate);
    }

    pos += dir * magnitude * envelope;
  }

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float size = 1.0 + aRandom * 1.5;
  gl_PointSize = size * (200.0 / -mvPos.z);

  vAlpha = smoothstep(60.0, 10.0, -mvPos.z) * (0.15 + aRandom * 0.35);
  vRandom = aRandom;
}
