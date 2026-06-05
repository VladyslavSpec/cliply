import { useFrame, useThree } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

const WAYPOINTS = [
  { pos: [0,    0,    7],   look: [0, 0, 0]    },
  { pos: [0.6, -0.3, -10],  look: [0, 0, -15]  },
  { pos: [-0.4, 0.2, -22],  look: [0, 0, -30]  },
  { pos: [0.2, -0.1, -34],  look: [0, 0, -44]  },
  { pos: [0,    0,   -43],  look: [0, 0, -54]  },
]

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
function lerp(a, b, t) { return a + (b - a) * t }

function CameraRig({ progress, appMode }) {
  const { camera } = useThree()
  const s = useRef(0)
  useFrame(() => {
    if (appMode?.current) {
      camera.position.x += (0   - camera.position.x) * 0.055
      camera.position.y += (0.3 - camera.position.y) * 0.055
      camera.position.z += (-44 - camera.position.z) * 0.055
      camera.lookAt(0, 0, -58)
      return
    }
    s.current += (progress.current - s.current) * 0.055
    const t = Math.max(0, Math.min(1, s.current))
    const total = WAYPOINTS.length - 1
    const raw = t * total
    const idx = Math.min(Math.floor(raw), total - 1)
    const f = easeInOut(raw - idx)
    const a = WAYPOINTS[idx], b = WAYPOINTS[idx + 1]
    camera.position.set(lerp(a.pos[0],b.pos[0],f), lerp(a.pos[1],b.pos[1],f), lerp(a.pos[2],b.pos[2],f))
    camera.lookAt(lerp(a.look[0],b.look[0],f), lerp(a.look[1],b.look[1],f), lerp(a.look[2],b.look[2],f))
  })
  return null
}

// Pixel planet beacon: low-poly faceted sphere + wireframe + inner voxel stars
function Beacon({ position, color, scale = 1, speed = 0.6 }) {
  const groupRef = useRef()

  const innerStars = useMemo(() => {
    const count = 70
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 0.08 + Math.random() * 0.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i*3+2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.09 * speed
      groupRef.current.rotation.x = clock.elapsedTime * 0.04 * speed
    }
  })

  return (
    <Float speed={speed * 1.2} floatIntensity={0.45} rotationIntensity={0.05}>
      <group ref={groupRef} position={position} scale={scale}>
        {/* Low-poly faceted body — pixel planet */}
        <mesh>
          <sphereGeometry args={[1, 7, 5]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={0.45}
            transparent opacity={0.60}
            flatShading roughness={0.15} metalness={0.7}
          />
        </mesh>
        {/* Glowing wireframe overlay */}
        <mesh>
          <sphereGeometry args={[1.04, 7, 5]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={3.5}
            transparent opacity={0.4} wireframe
          />
        </mesh>
        {/* Pixel star cluster inside */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[innerStars, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.055} color={color} transparent opacity={0.9} sizeAttenuation />
        </points>
        {/* Voxel core — box instead of sphere */}
        <mesh scale={0.09} rotation={[0.4, 0.4, 0.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={10} />
        </mesh>
        {/* Low-poly equatorial ring */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.9, 0.012, 4, 22]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.55} />
        </mesh>
        {/* Tilted ring */}
        <mesh rotation={[Math.PI/3.5, 0.4, 0]}>
          <torusGeometry args={[1.1, 0.008, 4, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.22} />
        </mesh>
        <pointLight color={color} intensity={2} distance={7} decay={2} />
      </group>
    </Float>
  )
}

// Low-poly pixel step node
function StepNode({ position, color, index }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.7 + index) * 0.18
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.4, 5, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5}
          roughness={0} flatShading transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.44, 5, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4}
          transparent opacity={0.35} wireframe />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.7, 0.015, 4, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.55} />
      </mesh>
      <pointLight color={color} intensity={2.5} distance={5} decay={2} />
    </group>
  )
}

// Pixel orbit ring — square cross-section torus
function OrbitRing({ radius, color, tilt, speed = 0.04, opacity = 0.18 }) {
  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = clock.elapsedTime * speed })
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.015, 4, 36]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={opacity} />
    </mesh>
  )
}

// Particles flowing toward camera, accelerate on scroll
function FlowingParticles({ progress }) {
  const pointsRef = useRef()
  const lastP = useRef(0)

  const positions = useMemo(() => {
    const count = 5000
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 28
      arr[i*3+1] = (Math.random() - 0.5) * 20
      arr[i*3+2] = Math.random() * -65
    }
    return arr
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position
    const p = progress?.current ?? 0
    const dp = Math.abs(p - lastP.current)
    lastP.current = p
    const speed = 0.014 + dp * 20
    for (let i = 0; i < pos.count; i++) {
      pos.array[i*3+2] += speed
      if (pos.array[i*3+2] > 8) pos.array[i*3+2] = -65 + Math.random() * 4
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#6B82CC" transparent opacity={0.32} sizeAttenuation />
    </points>
  )
}

function GlowLine({ start, end, color }) {
  const geo = useMemo(() => {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5)
    const len = s.distanceTo(e)
    const dir = new THREE.Vector3().subVectors(e, s).normalize()
    return { mid, len, angle: Math.atan2(dir.y, dir.x) }
  }, [start, end])
  return (
    <mesh position={geo.mid.toArray()} rotation={[0, 0, geo.angle]}>
      <boxGeometry args={[geo.len, 0.012, 0.012]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.4} />
    </mesh>
  )
}

export default function ImmersiveScene({ progress, appMode }) {
  return (
    <>
      <color attach="background" args={['#03030C']} />
      <fog attach="fog" args={['#03030C', 5, 42]} />
      <ambientLight intensity={0.04} />
      <Stars radius={120} depth={90} count={8000} factor={3.5} saturation={0} fade speed={0.4} />
      <FlowingParticles progress={progress} />
      <CameraRig progress={progress} appMode={appMode} />

      {/* ═══ HERO ══════════════════════════════════════════════════ */}
      <group>
        <Beacon position={[4.2,  0.4,  -4]}  color="#4338CA" scale={2.8} speed={0.5} />
        <Beacon position={[-4.8, -0.6, -6]}  color="#6D28D9" scale={2.1} speed={0.4} />
        <Beacon position={[0.8,  2.4,  -8]}  color="#0891B2" scale={1.1} speed={0.8} />
        <OrbitRing radius={3.6} color="#4338CA" tilt={[0.4, 0, 0]}            speed={0.030} opacity={0.15} />
        <OrbitRing radius={5.5} color="#6D28D9" tilt={[-0.3, 0.5, Math.PI/6]} speed={0.019} opacity={0.10} />
        <OrbitRing radius={7.2} color="#0EA5E9" tilt={[0.6, -0.2, Math.PI/4]} speed={0.013} opacity={0.07} />
        <pointLight position={[4,  1, -2]}  color="#4338CA" intensity={2}   distance={12} decay={2} />
        <pointLight position={[-4,-1, -3]}  color="#7C3AED" intensity={1.8} distance={10} decay={2} />
      </group>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════ */}
      <group position={[0, 0, -15]}>
        <StepNode position={[-3.8, 0,    0]}    color="#06B6D4" index={0} />
        <StepNode position={[0,    0.5, -0.5]}  color="#818CF8" index={1} />
        <StepNode position={[3.8,  0,    0]}    color="#06B6D4" index={2} />
        <GlowLine start={[-3.3, 0, 0]}     end={[-0.5, 0.4, -0.4]} color="#06B6D4" />
        <GlowLine start={[0.5, 0.4, -0.4]} end={[3.3,  0,    0]}   color="#06B6D4" />
        <pointLight position={[0, 1, 0]} color="#818CF8" intensity={1.2} distance={8} decay={2} />
      </group>

      {/* ═══ PLATFORMS ══════════════════════════════════════════════ */}
      <group position={[0, 0, -30]}>
        <pointLight color="#F43F5E" intensity={0.7} distance={7} decay={2} position={[-3,  1.5, 0]} />
        <pointLight color="#3B82F6" intensity={0.7} distance={7} decay={2} position={[ 3,  1.5, 0]} />
        <pointLight color="#06B6D4" intensity={0.7} distance={7} decay={2} position={[-3, -1.5, 0]} />
        <pointLight color="#8B5CF6" intensity={0.7} distance={7} decay={2} position={[ 3, -1.5, 0]} />
      </group>

      {/* ═══ CTA ════════════════════════════════════════════════════ */}
      <group position={[0, 0, -45]}>
        <Beacon position={[0,    0,   0]}  color="#4338CA" scale={4.5} speed={0.28} />
        <Beacon position={[3.2,  2,   2]}  color="#7C3AED" scale={1.7} speed={0.55} />
        <Beacon position={[-3.8,-1.2, 1]}  color="#0891B2" scale={1.3} speed={0.45} />
        <OrbitRing radius={5.0} color="#4338CA" tilt={[0, 0, 0]}               speed={0.036} opacity={0.38} />
        <OrbitRing radius={6.8} color="#6D28D9" tilt={[Math.PI/3, 0, Math.PI/5]} speed={0.021} opacity={0.24} />
        <OrbitRing radius={8.5} color="#0EA5E9" tilt={[-Math.PI/4, 0.3, 0]}    speed={0.015} opacity={0.16} />
        <pointLight color="#4338CA" intensity={12} distance={22} decay={2} />
        <pointLight color="#7C3AED" intensity={7}  distance={16} decay={2} position={[4, 3, 3]} />
        <pointLight color="#06B6D4" intensity={4}  distance={13} decay={2} position={[-3, -2, -3]} />
      </group>
    </>
  )
}
