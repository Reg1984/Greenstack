"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { latLngToSphere, REGION_CARBON } from "@/lib/data"

function intensityToColor(intensity: number): THREE.Color {
  // Green (high savings) to Red (low savings)
  const r = 1 - intensity
  const g = intensity
  return new THREE.Color(r * 0.8, g * 0.9, 0.1)
}

export function HeatmapLayer({ visible, radius = 2.04 }: { visible: boolean; radius?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial
          const base = REGION_CARBON[i]?.intensity || 0.5
          mat.opacity = visible ? (base * 0.3 + Math.sin(clock.getElapsedTime() * 0.8 + i) * 0.05) : 0
        }
      })
    }
  })

  const spots = useMemo(() => {
    return REGION_CARBON.map((region) => {
      const pos = latLngToSphere(region.lat, region.lng, radius)
      const color = intensityToColor(region.intensity)
      const size = 0.2 + region.intensity * 0.35
      return { pos, color, size, intensity: region.intensity }
    })
  }, [radius])

  return (
    <group ref={groupRef}>
      {spots.map((spot, i) => (
        <mesh key={i} position={spot.pos}>
          <sphereGeometry args={[spot.size, 16, 16]} />
          <meshBasicMaterial
            color={spot.color}
            transparent
            opacity={visible ? spot.intensity * 0.3 : 0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
