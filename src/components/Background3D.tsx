import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function StarField() {
  const ref = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(5000 * 3);

    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;

      positions.set([x, y, z], i * 3);
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.075;
    }
  });

  return (
    <Points ref={ref} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

function FloatingOrb({ position, color, scale }: { position: [number, number, number], color: string, scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 2;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        wireframe
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function EarthOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#4299e1"
        transparent
        opacity={0.3}
        wireframe
        emissive="#4299e1"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4299e1" />

        <StarField />
        <EarthOrb />
        <FloatingOrb position={[-8, 2, -8]} color="#10b981" scale={1.5} />
        <FloatingOrb position={[8, -2, -6]} color="#f59e0b" scale={1.2} />
        <FloatingOrb position={[0, 5, -10]} color="#8b5cf6" scale={1} />
        <FloatingOrb position={[-5, -3, -7]} color="#ec4899" scale={0.8} />
      </Canvas>
    </div>
  );
}
