import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const cameraPositions: [number, number, number][] = [
  [0, 4, 30], // Hero: 正面、引き気味で全体俯瞰
  [18, -3, 22], // About: 大きく右、少し下
  [-12, 8, 14], // Skills: 左上から接近
  [20, 6, 10], // Experience: 右上、かなり近い
  [0, -2, 12], // Contact: 正面、最も近い
];

const Y_AXIS = new THREE.Vector3(0, 1, 0);

interface CameraRigProps {
  activeSection: number;
}

export default function CameraRig({ activeSection }: CameraRigProps) {
  const { camera, size } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());
  const orbitAngle = useRef(0);
  const smoothPointer = useRef(new THREE.Vector2());

  useFrame((_state, delta) => {
    // マウスパララックス（pointer を滑らかに追従）
    const pointer = _state.pointer;
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-4 * delta));

    // ゆっくり回転し続ける
    orbitAngle.current += delta * 0.06;

    const pos = cameraPositions[activeSection] ?? cameraPositions[0];
    // モバイルではカメラを引いて全体が見えるようにする
    const scale = THREE.MathUtils.lerp(
      1.8,
      1,
      THREE.MathUtils.clamp(size.width / 768, 0, 1),
    );
    targetPos.current.set(...pos).multiplyScalar(scale);

    // Y軸周りにオービット回転を適用
    targetPos.current.applyAxisAngle(Y_AXIS, orbitAngle.current);

    const lerpFactor = 1 - Math.exp(-3 * delta);

    // パララックスオフセットを target に加算
    targetPos.current.x += smoothPointer.current.x * 2;
    targetPos.current.y += smoothPointer.current.y * 1.5;

    camera.position.lerp(targetPos.current, lerpFactor);
    lookAtTarget.current.lerp(new THREE.Vector3(0, 0, 0), lerpFactor);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
