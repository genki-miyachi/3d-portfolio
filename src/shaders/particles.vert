uniform float uTime;
uniform float uMorphIndex;

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

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float size = 1.0 + aRandom * 1.5;
  gl_PointSize = size * (200.0 / -mvPos.z);

  vAlpha = smoothstep(60.0, 10.0, -mvPos.z) * (0.15 + aRandom * 0.35);
  vRandom = aRandom;
}
