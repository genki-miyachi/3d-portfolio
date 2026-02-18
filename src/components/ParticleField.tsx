import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import noiseGlsl from '../shaders/noise.glsl?raw';
import vertexShader from '../shaders/particles.vert?raw';
import fragmentShader from '../shaders/particles.frag?raw';

function sampleIcosahedronSurface(count: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(10, 3);
  const posAttr = geo.getAttribute('position');
  const indexAttr = geo.getIndex();
  const positions = new Float32Array(count * 3);

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  const triangleCount = indexAttr
    ? indexAttr.count / 3
    : posAttr.count / 3;

  for (let i = 0; i < count; i++) {
    const triIndex = Math.floor(Math.random() * triangleCount);

    if (indexAttr) {
      const iA = indexAttr.getX(triIndex * 3);
      const iB = indexAttr.getX(triIndex * 3 + 1);
      const iC = indexAttr.getX(triIndex * 3 + 2);
      vA.fromBufferAttribute(posAttr, iA);
      vB.fromBufferAttribute(posAttr, iB);
      vC.fromBufferAttribute(posAttr, iC);
    } else {
      vA.fromBufferAttribute(posAttr, triIndex * 3);
      vB.fromBufferAttribute(posAttr, triIndex * 3 + 1);
      vC.fromBufferAttribute(posAttr, triIndex * 3 + 2);
    }

    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;

    positions[i * 3] = vA.x * u + vB.x * v + vC.x * w;
    positions[i * 3 + 1] = vA.y * u + vB.y * v + vC.y * w;
    positions[i * 3 + 2] = vA.z * u + vB.z * v + vC.z * w;
  }

  geo.dispose();
  return positions;
}

function getParticleCount(): number {
  if (typeof window === 'undefined') return 2000;
  return window.innerWidth < 768 ? 600 : 2000;
}

export default function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const count = useMemo(getParticleCount, []);

  const { positions, targetPositions, randoms, normals } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const norm = new Float32Array(count * 3);
    const rand = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // normalized direction from center for noise displacement
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      norm[i * 3] = x / len;
      norm[i * 3 + 1] = y / len;
      norm[i * 3 + 2] = z / len;

      rand[i] = Math.random();
    }

    const target = sampleIcosahedronSurface(count);

    return { positions: pos, targetPositions: target, randoms: rand, normals: norm };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorphProgress: { value: 1.0 },
    }),
    [],
  );

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  const fullVertexShader = noiseGlsl + '\n' + vertexShader;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute
          attach="attributes-aTargetPosition"
          args={[targetPositions, 3]}
        />
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
