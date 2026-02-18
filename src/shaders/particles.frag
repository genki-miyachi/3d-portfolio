varying float vAlpha;
varying float vRandom;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  // Soft glow falloff
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0);

  // Dimmer accent green — keep below bloom threshold mostly
  vec3 color = vec3(0.0, 0.7, 0.18); /* --accent dimmed */
  color *= 0.6 + vRandom * 0.4;

  gl_FragColor = vec4(color, glow * vAlpha);
}
