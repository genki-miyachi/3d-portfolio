#ifdef USE_INSTANCING
  attribute float aSeed;
  attribute float aOpacity;
#else
  uniform float uSeed;
  uniform float uOpacity;
#endif

varying vec2 vUv;
varying float vSeed;
varying float vOpacity;

void main() {
  vUv = uv;

  #ifdef USE_INSTANCING
    vSeed = aSeed;
    vOpacity = aOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  #else
    vSeed = uSeed;
    vOpacity = uOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #endif
}
