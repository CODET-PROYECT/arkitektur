import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import type { EdgesRef } from '@react-three/drei/core/Edges'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function HousePart({ position, scale, progress }: { position: [number, number, number]; scale: [number, number, number]; progress: MutableRefObject<number> }) {
  const solid = useRef<THREE.MeshStandardMaterial>(null)
  const frame = useRef<EdgesRef>(null)
  useFrame(() => {
    const amount = THREE.MathUtils.smoothstep(progress.current, 0.04, 0.92)
    if (solid.current) solid.current.opacity = amount
    if (frame.current && !Array.isArray(frame.current.material)) frame.current.material.opacity = 1 - amount
  })
  return <mesh position={position} scale={scale} castShadow receiveShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial ref={solid} color={token('--surface')} roughness={0.72} metalness={0.02} transparent opacity={0} depthWrite />
    <Edges ref={frame} threshold={12} scale={1.001} lineWidth={1} color={token('--dark-acc')} transparent opacity={1} />
  </mesh>
}

function HouseScene({ progress, pointer }: { progress: MutableRefObject<number>; pointer: MutableRefObject<{ x: number; y: number }> }) {
  const house = useRef<THREE.Group>(null)
  const glass = useRef<THREE.MeshStandardMaterial>(null)
  useFrame((state) => {
    if (!house.current) return
    const pointerX = pointer.current.x * 0.035
    const pointerY = pointer.current.y * 0.018
    house.current.rotation.y += (pointerX + Math.sin(state.clock.elapsedTime * 0.12) * 0.022 - house.current.rotation.y) * 0.025
    house.current.rotation.x += (pointerY - house.current.rotation.x) * 0.025
    const fill = THREE.MathUtils.smoothstep(progress.current, 0.04, 0.92)
    if (glass.current) glass.current.opacity = fill * 0.7
  })
  return <group ref={house} position={[0, -0.1, 0]}>
    <HousePart progress={progress} position={[0, -0.02, 0]} scale={[3.2, 0.14, 2.2]} />
    <HousePart progress={progress} position={[-0.72, 0.66, -0.35]} scale={[1.65, 1.22, 1.5]} />
    <HousePart progress={progress} position={[0.83, 0.48, 0.38]} scale={[1.18, 0.86, 1.4]} />
    <HousePart progress={progress} position={[-0.05, 1.34, -0.34]} scale={[2.85, 0.14, 1.94]} />
    <HousePart progress={progress} position={[0.82, 0.99, 0.72]} scale={[1.8, 0.12, 1.04]} />
    <mesh position={[0.04, 0.49, 0.395]} scale={[0.55, 0.67, 0.018]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial ref={glass} color={token('--line')} roughness={0.2} metalness={0.1} transparent opacity={0} />
    </mesh>
    <mesh position={[-0.8, 0.5, 0.43]} scale={[0.018, 0.8, 0.02]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={token('--dark')} roughness={0.8} /></mesh>
  </group>
}

export default function HeroScene({ progress }: { progress: MutableRefObject<number> }) {
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2
      pointer.current.y = (0.5 - event.clientY / Math.max(window.innerHeight, 1)) * 2
    }
    const reset = () => { pointer.current.x = 0; pointer.current.y = 0 }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', reset)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('blur', reset) }
  }, [])
  return <Canvas className="hero-canvas" dpr={[1, 1.5]} frameloop="always" camera={{ position: [4.3, 2.7, 6.8], fov: 37 }} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }} fallback={null}>
    <ambientLight intensity={1.25} />
    <directionalLight position={[-3, 4, 5]} intensity={2.3} />
    <HouseScene progress={progress} pointer={pointer} />
  </Canvas>
}
