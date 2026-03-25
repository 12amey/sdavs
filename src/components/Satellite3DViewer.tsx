import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface SatelliteImageProps {
  imageUrl?: string;
}

function RotatingSatelliteImage({ imageUrl }: SatelliteImageProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  const texture = imageUrl ? useTexture(imageUrl) : null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      {texture ? (
        <meshStandardMaterial map={texture} metalness={0.4} roughness={0.6} />
      ) : (
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.8}
          roughness={0.2}
          wireframe
          emissive="#3b82f6"
          emissiveIntensity={0.3}
        />
      )}
    </mesh>
  );
}

function OrbitRing({ radius, color }: { radius: number, color: string }) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
}

export default function Satellite3DViewer({ imageUrl }: SatelliteImageProps) {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#60a5fa" />
        <spotLight position={[0, 5, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#a78bfa" />

        <RotatingSatelliteImage imageUrl={imageUrl} />

        <OrbitRing radius={3} color="#10b981" />
        <OrbitRing radius={3.5} color="#f59e0b" />
        <OrbitRing radius={4} color="#8b5cf6" />

        <Sphere args={[0.1, 16, 16]} position={[3, 0, 0]}>
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
        </Sphere>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
