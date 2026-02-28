import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sectionLookOffsets } from './CameraRig';

const GRID_STEP = 5;
const FLOOR_Y = -12;

const cells = sectionLookOffsets.slice(1).map(([x, , z]) => ({
  x: Math.floor(x / GRID_STEP) * GRID_STEP + GRID_STEP / 2,
  z: Math.floor(z / GRID_STEP) * GRID_STEP + GRID_STEP / 2,
}));

const CELL_COLOR = new THREE.Color(0, 2, 0.5);

// カメラ方向に応じた水平スリットの潰し軸
const slitAxis: ('x' | 'y')[] = ['y', 'x', 'y', 'x'];

interface SectionPanelsProps {
  activeSection: number | null;
  cameraReady: boolean;
}

export default function SectionPanels({
  activeSection,
  cameraReady,
}: SectionPanelsProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const sectionIndex = i + 1;
      const isActive = activeSection === sectionIndex;
      const isClosing = isActive && cameraReady;

      const axis = slitAxis[i];
      if (isClosing) {
        // 高速で潰す + 完全消灯
        const closeFactor = 1 - Math.exp(-12 * delta);
        mesh.scale[axis] = THREE.MathUtils.lerp(mesh.scale[axis], 0, closeFactor);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 1 - Math.exp(-10 * delta));
      } else {
        // 復帰
        const restoreFactor = 1 - Math.exp(-5 * delta);
        mesh.scale.x = THREE.MathUtils.lerp(mesh.scale.x, 1, restoreFactor);
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 1, restoreFactor);
        const baseOpacity = isActive ? 0.6 : 0.35;
        const pulseAmp = isActive ? 0.2 : 0.15;
        mat.opacity = baseOpacity + pulseAmp * Math.sin(t * 1.8 + i * 1.2);
      }
    });
  });

  return (
    <group>
      {cells.map((cell, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[cell.x, FLOOR_Y, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[GRID_STEP, GRID_STEP]} />
          <meshBasicMaterial
            color={CELL_COLOR}
            transparent
            opacity={0.4}
            toneMapped={false}
            fog={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
