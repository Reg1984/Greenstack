"use client"

import { useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uIntensity;
  uniform vec3 uColor;

  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0) * uIntensity;
    gl_FragColor = vec4(uColor, intensity * 0.6);
  }
`

export function AtmosphereGlow({ radius, color = "#00ff87" }: { radius: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.ShaderMaterial
      mat.uniforms.uIntensity.value = 1.8 + Math.sin(clock.getElapsedTime() * 0.5) * 0.3
    }
  })

  return (
    <mesh ref={ref} scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uIntensity: { value: 1.8 },
          uColor: { value: new THREE.Color(color) },
        }}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
