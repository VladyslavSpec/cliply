import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, MeshDistortMaterial, Float } from '@react-three/drei'
import { useRef, Suspense } from 'react'

function GlowOrb({ position, color, scale = 1, speed = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.x = clock.elapsedTime * 0.12 * speed
    ref.current.rotation.y = clock.elapsedTime * 0.18 * speed
  })
  return (
    <Float speed={speed * 1.5} floatIntensity={0.6} rotationIntensity={0.2}>
      <mesh ref={ref} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.18}
          distort={0.5}
          speed={2}
          roughness={0}
        />
      </mesh>
    </Float>
  )
}

function Ring({ position, color, rotation }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.elapsedTime * 0.08
    ref.current.rotation.x = rotation[0] + Math.sin(clock.elapsedTime * 0.3) * 0.1
  })
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[2.2, 0.015, 8, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.35}
      />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#07070E']} />
      <fog attach="fog" args={['#07070E', 12, 28]} />

      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 3]} color="#FF5757" intensity={4} distance={18} decay={2} />
      <pointLight position={[-6, -3, 2]} color="#7C3AED" intensity={3} distance={16} decay={2} />
      <pointLight position={[0, 8, -4]} color="#1DA1F2" intensity={2} distance={14} decay={2} />

      <Stars radius={90} depth={70} count={5000} factor={3} saturation={0} fade speed={0.4} />

      {/* Main glow orbs */}
      <GlowOrb position={[3.5, 0.5, -3]} color="#FF5757" scale={2.2} speed={0.7} />
      <GlowOrb position={[-4, 1, -5]} color="#7C3AED" scale={1.8} speed={0.5} />
      <GlowOrb position={[1, -2, -6]} color="#1DA1F2" scale={1.4} speed={0.9} />

      {/* Accent rings */}
      <Ring position={[3.5, 0.5, -3]} color="#FF5757" rotation={[0.5, 0, 0]} />
      <Ring position={[-4, 1, -5]} color="#7C3AED" rotation={[-0.3, 0.4, 0]} />
    </>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
