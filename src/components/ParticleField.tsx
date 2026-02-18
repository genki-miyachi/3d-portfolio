import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

import noiseGlsl from '../shaders/noise.glsl?raw';
import vertexShader from '../shaders/particles.vert?raw';
import fragmentShader from '../shaders/particles.frag?raw';

// Section peak offsets — must match Scene.tsx sectionRanges[i][1]
const sectionPeaks = [0, 0.18, 0.38, 0.58, 0.78, 0.95];

function offsetToMorphIndex(offset: number): number {
  for (let i = 0; i < sectionPeaks.length - 1; i++) {
    if (offset <= sectionPeaks[i + 1]) {
      const t =
        (offset - sectionPeaks[i]) / (sectionPeaks[i + 1] - sectionPeaks[i]);
      return i + Math.max(0, Math.min(1, t));
    }
  }
  return sectionPeaks.length - 1;
}

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

function sampleBox(count: number, size: number): Float32Array {
  const out = new Float32Array(count * 3);
  const half = size / 2;
  for (let i = 0; i < count; i++) {
    // Random point on box surface
    const face = Math.floor(Math.random() * 6);
    const u = Math.random() * size - half;
    const v = Math.random() * size - half;
    switch (face) {
      case 0: out[i*3]=half;  out[i*3+1]=u; out[i*3+2]=v; break;
      case 1: out[i*3]=-half; out[i*3+1]=u; out[i*3+2]=v; break;
      case 2: out[i*3]=u; out[i*3+1]=half;  out[i*3+2]=v; break;
      case 3: out[i*3]=u; out[i*3+1]=-half; out[i*3+2]=v; break;
      case 4: out[i*3]=u; out[i*3+1]=v; out[i*3+2]=half;  break;
      case 5: out[i*3]=u; out[i*3+1]=v; out[i*3+2]=-half; break;
    }
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

export default function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();
  const count = useMemo(getParticleCount, []);

  const { targets, randoms, normals } = useMemo(() => {
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();

    const t0 = sampleSphere(count, 8);
    const t1 = sampleBox(count, 14);
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

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphIndex: { value: 0 },
    }),
    [],
  );

  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uMorphIndex.value = offsetToMorphIndex(
      scroll.offset,
    );
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
