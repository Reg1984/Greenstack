"use client"

import { useRef, useState } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { latLngToSphere, fmt, SECTOR_COLORS } from "@/lib/data"

interface TenderPinProps {
  lat: number
  lng: number
  title: string
  value: number
  match: number
  sector: string
  status: string
  selected: boolean
  onClick: () => void
}

function statusColor(status: string) {
  switch (status) {
    case "bidding": return "#00ff87"
    case "submitted": return "#c084fc"
    case "sourcing": return "#60efff"
    case "reviewing": return "#ffd166"
    case "found": return "#818cf8"
    default: return "#00ff87"
  }
}

export function TenderPin({ lat, lng, title, value, match, sector, status, selected, onClick }: TenderPinProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const position = latLngToSphere(lat, lng, 2.02)
  const normal = new THREE.Vector3(...position).normalize()
  const color = statusColor(status)
  const sectorColor = SECTOR_COLORS[sector]?.core || "#00ff87"

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2 + lat) * 0.08
      groupRef.current.scale.setScalar(hovered || selected ? 1.3 : s)
    }
  })

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)

  return (
    <group
      ref={groupRef}
      position={position}
      quaternion={quaternion}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer" }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto" }}
    >
      {/* Pin stem */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Pin head */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || selected ? 2 : 0.8}
        />
      </mesh>

      {/* Glow ring when selected */}
      {(selected || hovered) && (
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.08, 32]} />
          <meshBasicMaterial color={sectorColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Tooltip on hover */}
      {hovered && !selected && (
        <Html position={[0, 0.25, 0]} center style={{ pointerEvents: "none" }}>
          <div
            className="px-3 py-2 rounded-xl text-xs whitespace-nowrap"
            style={{
              background: "rgba(2,10,20,0.95)",
              border: `1px solid ${sectorColor}40`,
              backdropFilter: "blur(12px)",
              color: "#f8fafc",
            }}
          >
            <p className="font-semibold text-xs" style={{ color: sectorColor }}>{title}</p>
            <p className="text-slate-400 mt-0.5">{fmt(value)} | {match}% match</p>
          </div>
        </Html>
      )}
    </group>
  )
}
