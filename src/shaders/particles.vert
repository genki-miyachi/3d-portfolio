uniform float uTime;
uniform float uMorphProgress;

attribute vec3 aTargetPosition;
attribute float aRandom;

varying float vAlpha;
varying float vRandom;

// noise.glsl will be prepended

void main() {
  float morphWave = sin(uTime * 0.2) * 0.5 + 0.5;
  float morph = uMorphProgress * morphWave;

  vec3 pos = mix(position, aTargetPosition, morph);

  // Subtle noise displacement
  float noiseVal = snoise(pos * 0.2 + uTime * 0.05);
  pos += normal * noiseVal * 0.3 * (1.0 - morph);

  // Gentle floating motion
  pos.x += sin(uTime * 0.3 + aRandom * 6.28) * 0.15;
  pos.y += cos(uTime * 0.25 + aRandom * 6.28) * 0.15;
  pos.z += sin(uTime * 0.2 + aRandom * 3.14) * 0.1;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  // Smaller particles
  float size = 1.0 + aRandom * 1.5;
  gl_PointSize = size * (200.0 / -mvPos.z);

  // Lower alpha overall
  vAlpha = smoothstep(60.0, 10.0, -mvPos.z) * (0.15 + aRandom * 0.35);
  vRandom = aRandom;
}
