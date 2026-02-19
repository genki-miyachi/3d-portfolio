import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import noiseGlsl from '../shaders/noise.glsl?raw';
import vertexShader from '../shaders/particles.vert?raw';
import fragmentShader from '../shaders/particles.frag?raw';

// --- 4D Regular Polytope samplers ---

type Vec4 = [number, number, number, number];

interface Polytope4D {
  vertices: Vec4[];
  edges: [number, number][];
}

// 4D頂点間の距離²で辺を検出
function findEdges(
  vertices: Vec4[],
  edgeLengthSq: number,
  tol: number,
): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      let dSq = 0;
      for (let k = 0; k < 4; k++) {
        const d = vertices[i][k] - vertices[j][k];
        dSq += d * d;
      }
      if (Math.abs(dSq - edgeLengthSq) < tol) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

// 4D多胞体の辺上にパーティクルをサンプリング（4D座標のまま返す）
function samplePolytope4D(
  count: number,
  size: number,
  polytope: Polytope4D,
): Float32Array {
  const out = new Float32Array(count * 4);
  const { vertices, edges } = polytope;
  const half = size / 2;

  // 頂点を [-half, half] に正規化
  let maxC = 0;
  for (const v of vertices) {
    for (let k = 0; k < 4; k++) maxC = Math.max(maxC, Math.abs(v[k]));
  }
  const s = half / (maxC || 1);

  for (let i = 0; i < count; i++) {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const t = Math.random();
    const a = vertices[edge[0]];
    const b = vertices[edge[1]];
    out[i * 4] = (a[0] + (b[0] - a[0]) * t) * s;
    out[i * 4 + 1] = (a[1] + (b[1] - a[1]) * t) * s;
    out[i * 4 + 2] = (a[2] + (b[2] - a[2]) * t) * s;
    out[i * 4 + 3] = (a[3] + (b[3] - a[3]) * t) * s;
  }
  return out;
}

// position attribute 用に 4D→3D 投影
function project4Dto3D(
  data4d: Float32Array,
  count: number,
  projDist: number,
): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const w = data4d[i * 4 + 3];
    const proj = projDist / (projDist - w);
    out[i * 3] = data4d[i * 4] * proj;
    out[i * 3 + 1] = data4d[i * 4 + 1] * proj;
    out[i * 3 + 2] = data4d[i * 4 + 2] * proj;
  }
  return out;
}

// 正五胞体 (5-cell): 5頂点, 10辺 — 4D正四面体
function make5Cell(): Polytope4D {
  const s5 = Math.sqrt(5);
  const vertices: Vec4[] = [
    [1, 1, 1, -1 / s5],
    [1, -1, -1, -1 / s5],
    [-1, 1, -1, -1 / s5],
    [-1, -1, 1, -1 / s5],
    [0, 0, 0, s5 - 1 / s5],
  ];
  // 全10ペアが辺 (完全グラフ K5), 辺長² = 8
  const edges = findEdges(vertices, 8, 0.01);
  return { vertices, edges };
}

// 正八胞体 (tesseract / 8-cell): 16頂点, 32辺 — 4D立方体
function makeTesseract(): Polytope4D {
  const vertices: Vec4[] = [];
  for (let i = 0; i < 16; i++) {
    vertices.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }
  // ハミング距離1のペア, 辺長² = 4
  const edges = findEdges(vertices, 4, 0.01);
  return { vertices, edges };
}

// 正十六胞体 (16-cell): 8頂点, 24辺 — 4D正八面体
function make16Cell(): Polytope4D {
  const vertices: Vec4[] = [];
  for (let axis = 0; axis < 4; axis++) {
    for (const sign of [-1, 1]) {
      const v: Vec4 = [0, 0, 0, 0];
      v[axis] = sign;
      vertices.push(v);
    }
  }
  // 対蹠点以外が辺, 辺長² = 2
  const edges = findEdges(vertices, 2, 0.01);
  return { vertices, edges };
}

// 正二十四胞体 (24-cell): 24頂点, 96辺
function make24Cell(): Polytope4D {
  const vertices: Vec4[] = [];
  // (±1, ±1, 0, 0) の全置換
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      for (const si of [-1, 1]) {
        for (const sj of [-1, 1]) {
          const v: Vec4 = [0, 0, 0, 0];
          v[i] = si;
          v[j] = sj;
          vertices.push(v);
        }
      }
    }
  }
  // 辺長² = 2
  const edges = findEdges(vertices, 2, 0.01);
  return { vertices, edges };
}

// 正六百胞体 (600-cell): 120頂点, 720辺
function make600Cell(): Polytope4D {
  const phi = (1 + Math.sqrt(5)) / 2;
  const iphi = phi - 1; // 1/φ = (√5-1)/2
  const vertices: Vec4[] = [];

  // Group 1: 8頂点 — (±2, 0, 0, 0) の置換
  for (let axis = 0; axis < 4; axis++) {
    for (const sign of [-1, 1]) {
      const v: Vec4 = [0, 0, 0, 0];
      v[axis] = 2 * sign;
      vertices.push(v);
    }
  }

  // Group 2: 16頂点 — (±1, ±1, ±1, ±1)
  for (let i = 0; i < 16; i++) {
    vertices.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }

  // Group 3: 96頂点 — (±φ, ±1, ±1/φ, 0) の偶置換
  const evenPerms = [
    [0, 1, 2, 3], [0, 2, 3, 1], [0, 3, 1, 2],
    [1, 0, 3, 2], [1, 2, 0, 3], [1, 3, 2, 0],
    [2, 0, 1, 3], [2, 1, 3, 0], [2, 3, 0, 1],
    [3, 0, 2, 1], [3, 1, 0, 2], [3, 2, 1, 0],
  ];
  const base = [phi, 1, iphi, 0];

  for (const perm of evenPerms) {
    const p = [base[perm[0]], base[perm[1]], base[perm[2]], base[perm[3]]];
    const nonZero: number[] = [];
    for (let k = 0; k < 4; k++) {
      if (p[k] !== 0) nonZero.push(k);
    }
    for (let bits = 0; bits < 8; bits++) {
      const v: Vec4 = [p[0], p[1], p[2], p[3]];
      for (let b = 0; b < 3; b++) {
        if (bits & (1 << b)) v[nonZero[b]] = -v[nonZero[b]];
      }
      vertices.push(v);
    }
  }

  // 辺長² = 6 - 2√5 ≈ 1.528
  const edgeLengthSq = 6 - 2 * Math.sqrt(5);
  const edges = findEdges(vertices, edgeLengthSq, 0.05);
  return { vertices, edges };
}

function getParticleCount(): number {
  if (typeof window === 'undefined') return 6000;
  return window.innerWidth < 768 ? 2000 : 6000;
}

interface ParticleFieldProps {
  activeSection: number;
}

export default function ParticleField({ activeSection }: ParticleFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const morphTarget = useRef(0);
  const count = useMemo(getParticleCount, []);

  const { targets, position3d, randoms, normals } = useMemo(() => {
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();

    const cell5 = make5Cell();
    const cell8 = makeTesseract();
    const cell16 = make16Cell();
    const cell24 = make24Cell();
    const cell600 = make600Cell();

    const PROJ_DIST = 12; // 3 * half (size=8, half=4)

    const t0 = samplePolytope4D(count, 8, cell5); // Hero: 正五胞体
    const t1 = samplePolytope4D(count, 8, cell8); // About: 正八胞体
    const t2 = samplePolytope4D(count, 8, cell16); // Skills: 正十六胞体
    const t3 = samplePolytope4D(count, 8, cell24); // Experience: 正二十四胞体
    const t4 = samplePolytope4D(count, 8, cell600); // Contact: 正六百胞体
    const t5 = samplePolytope4D(count, 8, cell5); // ループ用

    // position attribute 用の3D投影 (バウンディングボックス計算用)
    const pos3d = project4Dto3D(t0, count, PROJ_DIST);

    // Normals: use t0 の3D投影方向 for noise displacement
    const norm = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = pos3d[i * 3];
      const y = pos3d[i * 3 + 1];
      const z = pos3d[i * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      norm[i * 3] = x / len;
      norm[i * 3 + 1] = y / len;
      norm[i * 3 + 2] = z / len;
    }

    return {
      targets: [t0, t1, t2, t3, t4, t5],
      position3d: pos3d,
      randoms: rand,
      normals: norm,
    };
  }, [count]);

  const MAX_RIPPLES = 8;

  const rippleOrigins = useMemo(
    () => Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector3()),
    [],
  );
  const rippleTimes = useMemo(
    () => new Float32Array(MAX_RIPPLES).fill(-1),
    [],
  );
  const rippleCount = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphIndex: { value: 0 },
      uProjectDist: { value: 12 },
      uRippleOrigins: { value: rippleOrigins },
      uRippleTimes: { value: rippleTimes },
      uRippleCount: { value: 0 },
    }),
    [rippleOrigins, rippleTimes],
  );

  const { camera, gl } = useThree();
  const closestPoint = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(new THREE.Vector2(nx, ny), camera);
      raycaster.current.ray.closestPointToPoint(
        new THREE.Vector3(0, 0, 0),
        closestPoint.current,
      );
      // 空きスロットを探す、なければ最古を上書き
      let slot = -1;
      let oldestTime = -1;
      let oldestSlot = 0;
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (rippleTimes[i] < 0) {
          slot = i;
          break;
        }
        if (rippleTimes[i] > oldestTime) {
          oldestTime = rippleTimes[i];
          oldestSlot = i;
        }
      }
      if (slot === -1) slot = oldestSlot;

      rippleOrigins[slot].copy(closestPoint.current);
      rippleTimes[slot] = 0;
      rippleCount.current = Math.min(rippleCount.current + 1, MAX_RIPPLES);
    },
    [camera, gl, rippleOrigins, rippleTimes],
  );

  useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [gl, handleClick]);

  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    // activeSection に向かって滑らかに lerp
    const lerpFactor = 1 - Math.exp(-3 * delta);
    morphTarget.current += (activeSection - morphTarget.current) * lerpFactor;
    materialRef.current.uniforms.uMorphIndex.value = morphTarget.current;

    // 全リップルの時間を進める、十分収束したら無効化
    let activeCount = 0;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (rippleTimes[i] >= 0) {
        rippleTimes[i] += delta;
        if (rippleTimes[i] > 15) {
          rippleTimes[i] = -1;
        } else {
          activeCount = Math.max(activeCount, i + 1);
        }
      }
    }
    materialRef.current.uniforms.uRippleCount.value = activeCount;
  });

  const fullVertexShader = useMemo(
    () => noiseGlsl + '\n' + vertexShader,
    [],
  );

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        {/* position = 3D投影 (バウンディングボックス用) */}
        <bufferAttribute attach="attributes-position" args={[position3d, 3]} />
        {/* 4D座標をシェーダーに渡し、GPU側で回転＋投影 */}
        <bufferAttribute attach="attributes-aTarget0" args={[targets[0], 4]} />
        <bufferAttribute attach="attributes-aTarget1" args={[targets[1], 4]} />
        <bufferAttribute attach="attributes-aTarget2" args={[targets[2], 4]} />
        <bufferAttribute attach="attributes-aTarget3" args={[targets[3], 4]} />
        <bufferAttribute attach="attributes-aTarget4" args={[targets[4], 4]} />
        <bufferAttribute attach="attributes-aTarget5" args={[targets[5], 4]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
        <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={fullVertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
