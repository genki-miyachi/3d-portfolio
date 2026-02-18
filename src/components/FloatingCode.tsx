import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const snippets = [
  '0x4F', 'null', '//', '{}', '=> {}', '0b1010',
  'void', '&&', '::',  '[ ]', '0xFF', '/**/',
  '!=', '>>>', 'async', '...',  '#!', '<=>', '||',
  'fn()', '$_', '%d', '<<', '>>=', '0o77',
];

interface Fragment {
  text: string;
  position: [number, number, number];
  speed: number;
  phase: number;
}

export default function FloatingCode() {
  const groupRef = useRef<THREE.Group>(null);

  const fragments: Fragment[] = useMemo(() => {
    const count = 30;
    const out: Fragment[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 18 + Math.random() * 30;
      out.push({
        text: snippets[i % snippets.length],
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.4 - 2,
          r * Math.cos(phi),
        ],
        speed: 0.08 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const frag = fragments[i];
      if (!frag) return;
      child.position.y =
        frag.position[1] + Math.sin(t * frag.speed + frag.phase) * 1.5;
    });
  });

  return (
    <group ref={groupRef}>
      {fragments.map((frag, i) => (
        <Text
          key={i}
          position={frag.position}
          fontSize={0.5 + Math.random() * 0.3}
          color="#00ff41" // --accent
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.08 + Math.random() * 0.07}
          depthOffset={-1}
        >
          {frag.text}
        </Text>
      ))}
    </group>
  );
}
