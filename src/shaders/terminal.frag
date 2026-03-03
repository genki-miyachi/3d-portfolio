uniform float uTime;
uniform sampler2D uTexture;
uniform float uScrollSpeed;

varying vec2 vUv;
varying float vSeed;
varying float vOpacity;

void main() {
  vec2 uv = vUv;

  // === bezel (monitor frame) ===
  float bw = 0.07;
  float edgeX = smoothstep(0.0, bw, uv.x) * smoothstep(0.0, bw, 1.0 - uv.x);
  float edgeY = smoothstep(0.0, bw, uv.y) * smoothstep(0.0, bw, 1.0 - uv.y);
  float screenMask = edgeX * edgeY;

  vec3 bezelCol = vec3(0.02);
  float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float innerGlow = smoothstep(bw, bw - 0.015, edgeDist) * screenMask;
  bezelCol += vec3(0.0, 0.12, 0.03) * innerGlow;

  // === screen ===
  vec2 s = clamp((uv - bw) / (1.0 - 2.0 * bw), 0.0, 1.0);

  // CRT barrel distortion
  vec2 centered = s * 2.0 - 1.0;
  s = s + centered * dot(centered, centered) * 0.03;
  s = clamp(s, 0.0, 1.0);

  // texture sampling (12/32 lines visible, scrolling)
  float viewFrac = 0.375;
  vec2 texUv = vec2(
    s.x,
    fract(s.y * viewFrac + uTime * uScrollSpeed + vSeed * 0.7)
  );
  vec4 texSample = texture2D(uTexture, texUv);
  float textBright = max(texSample.r, max(texSample.g, texSample.b));

  // cursor blink
  float cursorBlink = step(0.5, fract(uTime * 1.5 + vSeed * 4.1));
  float cY = 1.0 - viewFrac * 0.08;
  float cX = mod(vSeed * 7.0, 0.3) + 0.02;
  float isCursor = step(abs(s.y - cY), 0.012) * step(abs(s.x - cX), 0.008);
  textBright = max(textBright, isCursor * cursorBlink * 0.9);

  // CRT scanlines
  float scanline = 0.85 + 0.15 * sin(s.y * 90.0 * 3.14159);

  // CRT vignette
  vec2 vig = s * (1.0 - s);
  float vignette = pow(vig.x * vig.y * 15.0, 0.25);

  // screen composite
  float screenBg = 0.006;
  float brightness = (screenBg + textBright * 0.7) * scanline * vignette;
  vec3 screenCol = vec3(brightness * 0.25, brightness * 2.5, brightness * 0.65);

  // === final composite ===
  vec3 finalCol = mix(bezelCol, screenCol, screenMask);
  float bezelAlpha = 0.9;
  float screenAlpha = 0.7 + textBright * 0.3;
  float alpha = mix(bezelAlpha, screenAlpha, screenMask) * vOpacity;

  gl_FragColor = vec4(finalCol, alpha);
}
