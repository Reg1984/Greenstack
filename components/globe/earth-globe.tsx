"use client"

import { useRef, Suspense } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE from "three"
import { TextureLoader } from "three"
import { AtmosphereGlow } from "./atmosphere-shader"
import { TenderPin } from "./tender-pin"
import { HeatmapLayer } from "./heatmap-layer"
import { TENDERS } from "@/lib/data"

interface GlobeSceneProps {
  selectedId: number | null
  onSelectTender: (id: number | null) => void
  showHeatmap: boolean
  showTenders: boolean
}

function Earth() {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, "/assets/3d/texture_earth.jpg")
  texture.colorSpace = THREE.SRGBColorSpace

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.03
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  )
}

function GlobeContent({ selectedId, onSelectTender, showHeatmap, showTenders }: GlobeSceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03
    }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#60efff" />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Earth */}
      <Earth />

      {/* Atmosphere glow */}
      <AtmosphereGlow radius={2} color="#00ff87" />

      {/* Pins and heatmap rotate with the earth */}
      <group ref={groupRef}>
        {/* Tender pins */}
        {showTenders && TENDERS.map((t) => (
          <TenderPin
            key={t.id}
            lat={t.lat}
            lng={t.lng}
            title={t.title}
            value={t.value}
            match={t.match}
            sector={t.sector}
            status={t.status}
            selected={selectedId === t.id}
            onClick={() => onSelectTender(selectedId === t.id ? null : t.id)}
          />
        ))}

        {/* Heatmap overlay */}
        <HeatmapLayer visible={showHeatmap} />
      </group>

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

function GlobeLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto mb-4"
        />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Loading Globe</p>
      </div>
    </div>
  )
}

export function EarthGlobe({ selectedId, onSelectTender, showHeatmap, showTenders }: GlobeSceneProps) {
  return (
    <div className="absolute inset-0">
      <Suspense fallback={<GlobeLoader />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <GlobeContent
            selectedId={selectedId}
            onSelectTender={onSelectTender}
            showHeatmap={showHeatmap}
            showTenders={showTenders}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
