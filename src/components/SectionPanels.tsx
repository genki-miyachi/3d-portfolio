import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sectionLookOffsets } from './CameraRig';
import terminalVert from '../shaders/terminal.vert?raw';
import terminalFrag from '../shaders/terminal.frag?raw';

// GridFloor と同じパラメータ（正方形セル）
const WALL_R = 120;
const BOTTOM = -40;
const TOP = 60;
const VERT_LINES = 60;
const GRID_ANGLE_STEP = (2 * Math.PI) / VERT_LINES;
const ARC_LENGTH = (2 * Math.PI * WALL_R) / VERT_LINES;
const HORIZ_RINGS = Math.round((TOP - BOTTOM) / ARC_LENGTH) + 1;
const RING_STEP = (TOP - BOTTOM) / (HORIZ_RINGS - 1);

const CELL_ARC = GRID_ANGLE_STEP;
const CELL_HEIGHT = RING_STEP;
const NUM_CELL_ROWS = 7;

// ─── Canvas テクスチャ生成 ───

const TEX_W = 256;
const LINE_H = 16;
const FONT = '12px "JetBrains Mono","Courier New",monospace';

function getLineColor(line: string): string {
  if (line.startsWith('>') || line.startsWith('$')) return '#ffffff';
  if (line.startsWith('✓') || line.startsWith('PASS')) return '#eeeedd';
  if (line.startsWith('●') || line.startsWith('▶')) return '#dddddd';
  if (line.startsWith('  +')) return '#ccffcc';
  if (line.startsWith('  -')) return '#777777';
  if (/^\s*\d+ │/.test(line)) return '#888888';
  if (line.startsWith('[')) return '#999999';
  return '#aaaaaa';
}

function createTerminalTexture(lines: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = lines.length * LINE_H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = FONT;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = getLineColor(line);
    ctx.fillText(line, 4, i * LINE_H + 2);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── ターミナル内容（各32行） ───

const PATTERNS: string[][] = [
  // 0: Claude Code
  [
    '> fix the auth bug',
    '',
    '● Read src/auth/login.ts',
    '',
    'Found the issue. The token',
    'expiration check uses >',
    'instead of <.',
    '',
    '● Edit src/auth/login.ts',
    '  - if (token.exp > now)',
    '  + if (token.exp < now)',
    '',
    'Fixed! Comparison was',
    'inverted.',
    '',
    '> run tests',
    '',
    '● npm test',
    '',
    'PASS  auth.test.ts',
    '  ✓ validates tokens (2ms)',
    '  ✓ rejects expired (1ms)',
    '',
    'Tests: 2 passed, 2 total',
    '',
    '> add error handling',
    '',
    '● Read src/api/client.ts',
    '',
    "I'll wrap the fetch calls",
    'in try-catch blocks with',
    'proper error types.',
  ],
  // 1: コードエディタ
  [
    " 1 │ import { useState }",
    " 2 │   from 'react';",
    " 3 │ import * as THREE",
    " 4 │   from 'three';",
    ' 5 │',
    ' 6 │ interface Props {',
    ' 7 │   width: number;',
    ' 8 │   height: number;',
    ' 9 │   debug?: boolean;',
    '10 │ }',
    '11 │',
    '12 │ export default function',
    '13 │ Scene({ width }: Props) {',
    '14 │   const ref = useRef<',
    '15 │     THREE.Mesh>(null);',
    '16 │',
    '17 │   useFrame((_, dt) => {',
    '18 │     if (!ref.current)',
    '19 │       return;',
    '20 │     ref.current.rotation',
    '21 │       .y += dt * 0.5;',
    '22 │   });',
    '23 │',
    '24 │   return (',
    '25 │     <Canvas dpr={[1,2]}>',
    '26 │       <mesh ref={ref}>',
    '27 │         <boxGeometry />',
    '28 │         <meshStandard',
    '29 │           Material />',
    '30 │       </mesh>',
    '31 │     </Canvas>',
    '32 │   );',
  ],
  // 2: npm install
  [
    '$ npm install',
    '',
    'added 247 packages in 8s',
    '',
    '✓ three@0.170.0',
    '✓ @react-three/fiber@8.17',
    '✓ @react-three/drei@9.99',
    '✓ react@18.3.1',
    '✓ react-dom@18.3.1',
    '✓ astro@4.16.0',
    '✓ @astrojs/react@3.6.0',
    '✓ typescript@5.6.3',
    '✓ @types/three@0.170.0',
    '✓ @types/react@18.3.0',
    '',
    '14 packages need funding',
    '  run npm fund',
    '',
    'found 0 vulnerabilities',
    '',
    '$ npm run build',
    '',
    '> portfolio@1.0.0 build',
    '> astro build',
    '',
    '[vite] ✓ 142 modules',
    '[vite] built in 2.1s',
    '',
    '✓ /index.html (+18ms)',
    '✓ Build complete!',
    '',
    '$ _',
  ],
  // 3: git log
  [
    '$ git log --oneline',
    '',
    'a3f7b2c feat: cylinder grid',
    'e91d4f0 fix: cell alignment',
    'c28fa13 feat: terminal fx',
    '8b2e901 refactor: camera',
    '1f5c3da docs: update README',
    '6a4e7b9 feat: particles',
    'd82c1f0 fix: fog density',
    '3e9b5a2 chore: bump deps',
    'f47d8c3 feat: section cells',
    '0b6a2e1 feat: menu scroll',
    'b3c8f72 feat: hero typing',
    '9d1e4a6 fix: mobile layout',
    '2f7a0b8 feat: i18n support',
    '7c3d9e5 refactor: contexts',
    '4a8b1c3 feat: modal system',
    'e6f2d84 fix: scroll events',
    '1b9c5a7 chore: eslint cfg',
    '8d4f3e2 feat: glitch fx',
    'c7a1b96 docs: CLAUDE.md',
    '5e2d8f4 feat: grid floor',
    'a4c6e13 fix: camera lerp',
    'b8f1d27 init commit',
    '',
    '$ git status',
    'On branch main',
    'nothing to commit',
    'working tree clean',
    '',
    '$ _',
    '',
  ],
  // 4: ビルドログ
  [
    '$ npm run build',
    '',
    '[08:42:01] astro v4.16.0',
    '[08:42:01] output: static',
    '',
    'building client...',
    '[08:42:02] vite v5.4.0',
    '[08:42:02] ✓ 47 modules',
    '[08:42:03] css: 3.2 kB',
    '[08:42:03] js:  248 kB',
    '[08:42:03] built in 1.8s',
    '',
    'generating routes...',
    '[08:42:03] ▶ /index.html',
    '[08:42:04] ✓ done (+42ms)',
    '',
    'optimizing...',
    '[08:42:04] ✓ 12 images',
    '[08:42:04] ✓ 3 svgs',
    '[08:42:05] gzip: 89 kB',
    '',
    '[08:42:05] ✓ Complete!',
    '',
    'output: ./dist/',
    'total pages: 1',
    'bundle: 248 kB',
    '',
    '$ astro preview',
    '[08:42:10] v4.16.0',
    '[08:42:10] localhost:4321',
    '[08:42:10] ready in 180ms',
    '$ _',
  ],
];

const SCROLL_SPEEDS = [0.02, 0.005, 0.06, 0.015, 0.08];

// ─── セクションセル用定数 ───

const SECTION_NAMES = ['About', 'Skills', 'Experience', 'Contact'];
const CHAR_INTERVAL = 0.08; // seconds per character
const HOLD_DURATION = 0.3; // seconds after typing completes
const PROMPT_LINE = 30; // Canvas 2D の行位置（visible window の下部）

const SECTION_HISTORY = [
  '$ ssh genki@portfolio',
  'Connected to portfolio.',
  '',
  '$ ls sections/',
  'about/  skills/',
  'experience/  contact/',
  '',
  '$ cat system.log',
  '[OK] all services running',
];

function drawSectionPrompt(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  cursorOn: boolean,
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = FONT;
  ctx.textBaseline = 'top';

  // Faint history lines
  const historyStart = PROMPT_LINE - SECTION_HISTORY.length - 1;
  SECTION_HISTORY.forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = '#333333';
    ctx.fillText(line, 4, (historyStart + i) * LINE_H + 2);
  });

  // Prompt with cursor
  const cursor = cursorOn ? '_' : '';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`> ${text}${cursor}`, 4, PROMPT_LINE * LINE_H + 2);
}

// ─── 曲面パネル（UV 付き） ───

function createCurvedPanel(
  radius: number,
  arcAngle: number,
  height: number,
  widthSegs: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= 1; iy++) {
    const y = (iy - 0.5) * height;
    for (let ix = 0; ix <= widthSegs; ix++) {
      const u = ix / widthSegs;
      const a = (u - 0.5) * arcAngle;
      positions.push(
        radius * Math.sin(a),
        y,
        radius * Math.cos(a) - radius,
      );
      uvs.push(1 - u, iy);
    }
  }

  const stride = widthSegs + 1;
  for (let ix = 0; ix < widthSegs; ix++) {
    const a = ix;
    const b = a + 1;
    const c = a + stride;
    const d = c + 1;
    indices.push(a, b, d, a, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// ─── セル配置ロジック ───

function cellHash(vi: number, ri: number): number {
  return (((vi * 73 + ri * 179) * 2654435761) >>> 0) / 4294967296;
}

function getPatternIndex(seed: number): number {
  return Math.floor(seed * 100) % PATTERNS.length;
}

const SECTION_RING_IDX = Math.round(-BOTTOM / RING_STEP);
const SECTION_Y = BOTTOM + SECTION_RING_IDX * RING_STEP;
const SECTION_RI = SECTION_RING_IDX - 1;

const sectionCells = sectionLookOffsets.slice(1).map(([x, , z]) => {
  const angle = Math.atan2(x, z);
  return {
    position: [
      WALL_R * Math.sin(angle),
      SECTION_Y,
      WALL_R * Math.cos(angle),
    ] as [number, number, number],
    rotation: [0, angle, 0] as [number, number, number],
  };
});

const SECTION_VIS = [0, 15, 30, 45];
const FILL_RATE = 0.18;
const DECO_EXTEND = 10; // 上下に10行ずつ延長

const decoGridData: { vi: number; ri: number }[] = [];
for (let vi = 0; vi < VERT_LINES; vi++) {
  const nearSection = SECTION_VIS.some((sv) => {
    const d = Math.abs(vi - sv);
    return d <= 1 || d >= VERT_LINES - 1;
  });
  for (let ri = -DECO_EXTEND; ri < NUM_CELL_ROWS + DECO_EXTEND; ri++) {
    if (nearSection && Math.abs(ri - SECTION_RI) <= 1) continue;
    if (cellHash(vi, ri) < FILL_RATE) {
      decoGridData.push({ vi, ri });
    }
  }
}

const decoCells = decoGridData.map(({ vi, ri }) => {
  const angle = vi * GRID_ANGLE_STEP;
  const y = BOTTOM + (ri + 1) * RING_STEP;
  return {
    vi,
    ri,
    position: [
      WALL_R * Math.sin(angle),
      y,
      WALL_R * Math.cos(angle),
    ] as [number, number, number],
    rotation: [0, angle, 0] as [number, number, number],
  };
});

// ─── デコセルのパターン別グループ化 ───

const decoGroupEntries: [number, typeof decoCells][] = (() => {
  const map = new Map<number, typeof decoCells>();
  decoCells.forEach((cell) => {
    const seed = cellHash(cell.vi, cell.ri);
    const pi = getPatternIndex(seed);
    if (!map.has(pi)) map.set(pi, []);
    map.get(pi)!.push(cell);
  });
  return Array.from(map.entries());
})();

// ─── useFrame 用テンポラリオブジェクト ───

const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();

// ─── コンポーネント ───

interface SectionPanelsProps {
  activeSection: number | null;
  cameraReady: boolean;
  onTypingComplete?: () => void;
}

export default function SectionPanels({
  activeSection,
  cameraReady,
  onTypingComplete,
}: SectionPanelsProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const typingStartTime = useRef(0);
  const typingFired = useRef(false);
  const prevCameraReady = useRef(false);
  const lastBlinkState = useRef([false, false, false, false]);
  const wasTypingRef = useRef([false, false, false, false]);

  const cellGeo = useMemo(
    () => createCurvedPanel(WALL_R, CELL_ARC, CELL_HEIGHT, 8),
    [],
  );

  const textures = useMemo(
    () => PATTERNS.map((lines) => createTerminalTexture(lines)),
    [],
  );

  // セクションセル用 Canvas テクスチャ（動的書き換え）
  const sectionCanvases = useMemo(() => {
    return SECTION_NAMES.map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_W;
      canvas.height = 32 * LINE_H;
      const ctx = canvas.getContext('2d')!;
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      drawSectionPrompt(ctx, canvas, '', true);
      tex.needsUpdate = true;
      return { canvas, ctx, tex };
    });
  }, []);

  // セクションセル用マテリアル（個別 uniform, スクロール無効）
  const sectionMats = useMemo(
    () =>
      sectionCells.map((_, i) => {
        return new THREE.ShaderMaterial({
          vertexShader: terminalVert,
          fragmentShader: terminalFrag,
          uniforms: {
            uTime: { value: 0 },
            uSeed: { value: 0 },
            uOpacity: { value: 0.4 },
            uTexture: { value: sectionCanvases[i].tex },
            uScrollSpeed: { value: 0 },
          },
          transparent: true,
          toneMapped: false,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
      }),
    [sectionCanvases],
  );

  // デコセル: パターン別 InstancedMesh
  const decoData = useMemo(() => {
    return decoGroupEntries.map(([pi, cells]) => {
      const count = cells.length;

      // per-instance attributes
      const seeds = new Float32Array(count);
      const opacities = new Float32Array(count);
      cells.forEach((cell, i) => {
        seeds[i] = cellHash(cell.vi, cell.ri);
        opacities[i] = 0.1;
      });
      const seedAttr = new THREE.InstancedBufferAttribute(seeds, 1);
      const opacityAttr = new THREE.InstancedBufferAttribute(opacities, 1);
      opacityAttr.setUsage(THREE.DynamicDrawUsage);

      // geometry clone + instanced attrs
      const geo = cellGeo.clone();
      geo.setAttribute('aSeed', seedAttr);
      geo.setAttribute('aOpacity', opacityAttr);

      // shared material per pattern
      const mat = new THREE.ShaderMaterial({
        vertexShader: terminalVert,
        fragmentShader: terminalFrag,
        uniforms: {
          uTime: { value: 0 },
          uTexture: { value: textures[pi] },
          uScrollSpeed: { value: SCROLL_SPEEDS[pi] },
        },
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      // create InstancedMesh
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // set initial instance transforms
      cells.forEach((cell, i) => {
        _pos.set(...cell.position);
        _quat.setFromEuler(_euler.set(...cell.rotation));
        _scale.set(1, 1, 1);
        _mat4.compose(_pos, _quat, _scale);
        mesh.setMatrixAt(i, _mat4);
      });
      mesh.instanceMatrix.needsUpdate = true;

      const wasGlitching = new Uint8Array(count);
      return { mesh, mat, opacityAttr, cells, wasGlitching };
    });
  }, [cellGeo, textures]);

  useEffect(() => {
    return () => {
      cellGeo.dispose();
      textures.forEach((t) => t.dispose());
      sectionCanvases.forEach((s) => s.tex.dispose());
      sectionMats.forEach((m) => m.dispose());
      decoData.forEach((d) => {
        d.mesh.geometry.dispose();
        d.mat.dispose();
        d.mesh.dispose();
      });
    };
  }, [cellGeo, textures, sectionCanvases, sectionMats, decoData]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // ── cameraReady 立ち上がりエッジ検出 ──
    if (cameraReady && !prevCameraReady.current) {
      typingStartTime.current = t;
      typingFired.current = false;
    }
    prevCameraReady.current = cameraReady;

    // ── セクションセル（個別 Mesh） ──
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = sectionMats[i];
      mat.uniforms.uTime.value = t;

      const sectionIndex = i + 1;
      const isActive = activeSection === sectionIndex;
      const name = SECTION_NAMES[i];
      const typingDuration = name.length * CHAR_INTERVAL;
      const elapsed = t - typingStartTime.current;

      const isTypingPhase =
        isActive && cameraReady && elapsed < typingDuration + HOLD_DURATION;
      const isSlitClosing =
        isActive &&
        cameraReady &&
        elapsed >= typingDuration + HOLD_DURATION;

      if (isSlitClosing) {
        // スリット閉じ
        mesh.scale.y = THREE.MathUtils.lerp(
          mesh.scale.y,
          0,
          1 - Math.exp(-12 * delta),
        );
        mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
          mat.uniforms.uOpacity.value,
          0,
          1 - Math.exp(-10 * delta),
        );
        if (!typingFired.current) {
          typingFired.current = true;
          onTypingComplete?.();
        }
        wasTypingRef.current[i] = true;
      } else if (isTypingPhase) {
        // タイピングアニメーション
        const charCount = Math.min(
          Math.floor(elapsed / CHAR_INTERVAL),
          name.length,
        );
        const cursorOn = Math.floor(t * 4) % 2 === 0;
        const { ctx, canvas, tex } = sectionCanvases[i];
        drawSectionPrompt(ctx, canvas, name.substring(0, charCount), cursorOn);
        tex.needsUpdate = true;
        mat.uniforms.uOpacity.value = 0.6;
        mesh.scale.y = THREE.MathUtils.lerp(
          mesh.scale.y,
          1,
          1 - Math.exp(-5 * delta),
        );
        wasTypingRef.current[i] = true;
      } else {
        // idle — スケール復帰 + カーソル点滅
        mesh.scale.x = THREE.MathUtils.lerp(
          mesh.scale.x,
          1,
          1 - Math.exp(-5 * delta),
        );
        mesh.scale.y = THREE.MathUtils.lerp(
          mesh.scale.y,
          1,
          1 - Math.exp(-5 * delta),
        );
        const cursorOn = Math.floor(t * 2) % 2 === 0;
        if (
          wasTypingRef.current[i] ||
          cursorOn !== lastBlinkState.current[i]
        ) {
          wasTypingRef.current[i] = false;
          lastBlinkState.current[i] = cursorOn;
          const { ctx, canvas, tex } = sectionCanvases[i];
          drawSectionPrompt(ctx, canvas, '', cursorOn);
          tex.needsUpdate = true;
        }
        const baseOpacity = isActive ? 0.6 : 0.35;
        const pulseAmp = isActive ? 0.2 : 0.15;
        mat.uniforms.uOpacity.value =
          baseOpacity + pulseAmp * Math.sin(t * 1.8 + i * 1.2);
      }
    });

    // ── デコセル（InstancedMesh バッチ） ──
    decoData.forEach(({ mesh, mat, opacityAttr, cells, wasGlitching }) => {
      mat.uniforms.uTime.value = t;
      let matrixDirty = false;

      cells.forEach((cell, i) => {
        const base = 0.1 + 0.06 * Math.sin(t * 1.0 + i * 2.3);
        const cycle = (t * 0.7 + i * 5.3) % (4.5 + (i % 3) * 1.5);
        const isGlitching = cycle < 0.25;

        let opacity: number;

        if (isGlitching) {
          const step = Math.floor(t * 8);
          const hash = ((step * 13 + i * 7) * 2654435761) >>> 0;
          const h0 = (hash & 0xff) / 255;
          const h1 = ((hash >> 8) & 0xff) / 255;
          const subFrame = (t * 8) % 1;

          let sx: number;
          let sy: number;
          if (subFrame < 0.15) {
            sy = 0.001;
            sx = 1;
            opacity = 0;
          } else {
            sx = h0 < 0.33 ? 0.4 : h0 < 0.66 ? 0.7 : 1.0;
            sy = 0.02;
            opacity = h1 < 0.3 ? 0 : 0.8;
          }

          _pos.set(...cell.position);
          _quat.setFromEuler(_euler.set(...cell.rotation));
          _scale.set(sx, sy, 1);
          _mat4.compose(_pos, _quat, _scale);
          mesh.setMatrixAt(i, _mat4);
          wasGlitching[i] = 1;
          matrixDirty = true;
        } else {
          // グリッチ終了時にスケールを復元
          if (wasGlitching[i]) {
            _pos.set(...cell.position);
            _quat.setFromEuler(_euler.set(...cell.rotation));
            _scale.set(1, 1, 1);
            _mat4.compose(_pos, _quat, _scale);
            mesh.setMatrixAt(i, _mat4);
            wasGlitching[i] = 0;
            matrixDirty = true;
          }

          const curr = opacityAttr.getX(i);
          opacity =
            i % 2 === 1
              ? THREE.MathUtils.lerp(curr, base, 1 - Math.exp(-6 * delta))
              : base;
        }

        opacityAttr.setX(i, opacity);
      });

      opacityAttr.needsUpdate = true;
      if (matrixDirty) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  return (
    <group>
      {sectionCells.map((cell, i) => (
        <mesh
          key={`s${i}`}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          geometry={cellGeo}
          material={sectionMats[i]}
          position={cell.position}
          rotation={cell.rotation}
        />
      ))}
      {decoData.map((d, i) => (
        <primitive key={`dg${i}`} object={d.mesh} />
      ))}
    </group>
  );
}
