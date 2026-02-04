import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

interface GlobeProps {
  zoom: number
  rotationX: number
  rotationY: number
}

export function Globe({ zoom, rotationX, rotationY }: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create a wireframe sphere with glowing effect
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x6366f1) }, // Indigo
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fresnel effect for glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

          // Pulsing effect
          float pulse = sin(time * 2.0) * 0.2 + 0.8;

          // Grid lines
          float grid = abs(sin(vPosition.x * 10.0)) * abs(sin(vPosition.y * 10.0)) * abs(sin(vPosition.z * 10.0));
          grid = smoothstep(0.0, 0.1, grid);

          vec3 finalColor = color * (fresnel + 0.3) * pulse;
          float alpha = (fresnel * 0.8 + 0.2) * (1.0 - grid * 0.5);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      // Update shader time
      material.uniforms.time.value = state.clock.elapsedTime

      // Apply rotation based on hand position
      meshRef.current.rotation.x += rotationX * 0.01
      meshRef.current.rotation.y += rotationY * 0.01

      // Smooth zoom
      const targetScale = zoom
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
    }
  })

  return (
    <group>
      {/* Main globe */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <primitive object={material} attach="material" />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial
          color="#6366f1"
          wireframe
          transparent
          opacity={0.2}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere args={[2.2, 32, 32]}>
        <meshBasicMaterial
          color="#818cf8"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}
