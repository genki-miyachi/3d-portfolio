import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import noiseGlsl from '../shaders/noise.glsl?raw';
import vertexShader from '../shaders/particles.vert?raw';
import fragmentShader from '../shaders/particles.frag?raw';

// --- Shape samplers ---

function sampleSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    out[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = radius * Math.cos(phi);
  }
  return out;
}

// テッセラクト（4D超立方体）の辺を3D投影してサンプリング
function sampleTesseract(count: number, size: number): Float32Array {
  const out = new Float32Array(count * 3);
  const half = size / 2;

  // 4D頂点: {-1,+1}^4 = 16頂点
  const verts4d: [number, number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    verts4d.push([
      (i & 1 ? 1 : -1) * half,
      (i & 2 ? 1 : -1) * half,
      (i & 4 ? 1 : -1) * half,
      (i & 8 ? 1 : -1) * half,
    ]);
  }

  // 辺: ハミング距離1のペア = 32本
  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      if ((((i ^ j) & ((i ^ j) - 1)) === 0)) {
        edges.push([i, j]);
      }
    }
  }

  // 4D→3D 透視投影 (w軸から見る)
  const project = (v: [number, number, number, number]): [number, number, number] => {
    const d = 3 * half; // 視点距離
    const s = d / (d - v[3]);
    return [v[0] * s, v[1] * s, v[2] * s];
  };

  for (let i = 0; i < count; i++) {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const t = Math.random();
    const a = verts4d[edge[0]];
    const b = verts4d[edge[1]];
    // 4D辺上を補間してから投影
    const p4: [number, number, number, number] = [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ];
    const p3 = project(p4);
    out[i * 3] = p3[0];
    out[i * 3 + 1] = p3[1];
    out[i * 3 + 2] = p3[2];
  }
  return out;
}

function sampleTorus(
  count: number,
  R: number,
  r: number,
): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    out[i * 3] = (R + r * Math.cos(phi)) * Math.cos(theta);
    out[i * 3 + 1] = r * Math.sin(phi);
    out[i * 3 + 2] = (R + r * Math.cos(phi)) * Math.sin(theta);
  }
  return out;
}

function sampleHelix(
  count: number,
  radius: number,
  height: number,
  turns: number,
): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const angle = t * Math.PI * 2 * turns;
    // Double helix: two strands
    const strand = Math.random() > 0.5 ? 0 : Math.PI;
    out[i * 3] = radius * Math.cos(angle + strand);
    out[i * 3 + 1] = height * (t - 0.5);
    out[i * 3 + 2] = radius * Math.sin(angle + strand);
  }
  return out;
}

function sampleGeoSurface(
  count: number,
  geo: THREE.BufferGeometry,
): Float32Array {
  const posAttr = geo.getAttribute('position');
  const indexAttr = geo.getIndex();
  const out = new Float32Array(count * 3);
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

  for (let i = 0; i < count; i++) {
    const tri = Math.floor(Math.random() * triCount);
    if (indexAttr) {
      vA.fromBufferAttribute(posAttr, indexAttr.getX(tri * 3));
      vB.fromBufferAttribute(posAttr, indexAttr.getX(tri * 3 + 1));
      vC.fromBufferAttribute(posAttr, indexAttr.getX(tri * 3 + 2));
    } else {
      vA.fromBufferAttribute(posAttr, tri * 3);
      vB.fromBufferAttribute(posAttr, tri * 3 + 1);
      vC.fromBufferAttribute(posAttr, tri * 3 + 2);
    }
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    out[i * 3] = vA.x * u + vB.x * v + vC.x * w;
    out[i * 3 + 1] = vA.y * u + vB.y * v + vC.y * w;
    out[i * 3 + 2] = vA.z * u + vB.z * v + vC.z * w;
  }
  geo.dispose();
  return out;
}

function getParticleCount(): number {
  if (typeof window === 'undefined') return 2000;
  return window.innerWidth < 768 ? 600 : 2000;
}

interface ParticleFieldProps {
  activeSection: number;
}

export default function ParticleField({ activeSection }: ParticleFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const morphTarget = useRef(0);
  const count = useMemo(getParticleCount, []);

  const { targets, randoms, normals } = useMemo(() => {
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();

    const t0 = sampleSphere(count, 8);
    const t1 = sampleTesseract(count, 7);
    const t2 = sampleTorus(count, 7, 2.5);
    const t3 = sampleHelix(count, 5, 16, 3);
    const t4 = sampleGeoSurface(count, new THREE.OctahedronGeometry(9, 0));
    const t5 = sampleSphere(count, 8); // back to sphere

    // Normals: use t0 (sphere) direction for noise displacement
    const norm = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = t0[i * 3];
      const y = t0[i * 3 + 1];
      const z = t0[i * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      norm[i * 3] = x / len;
      norm[i * 3 + 1] = y / len;
      norm[i * 3 + 2] = z / len;
    }

    return {
      targets: [t0, t1, t2, t3, t4, t5],
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

  const fullVertexShader = noiseGlsl + '\n' + vertexShader;

  return (
    <points>
      <bufferGeometry>
        {/* position = initial shape (sphere), used as fallback */}
        <bufferAttribute attach="attributes-position" args={[targets[0], 3]} />
        <bufferAttribute attach="attributes-aTarget0" args={[targets[0], 3]} />
        <bufferAttribute attach="attributes-aTarget1" args={[targets[1], 3]} />
        <bufferAttribute attach="attributes-aTarget2" args={[targets[2], 3]} />
        <bufferAttribute attach="attributes-aTarget3" args={[targets[3], 3]} />
        <bufferAttribute attach="attributes-aTarget4" args={[targets[4], 3]} />
        <bufferAttribute attach="attributes-aTarget5" args={[targets[5], 3]} />
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
