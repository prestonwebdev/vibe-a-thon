import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SIRIUS } from '../data/sirius'

interface SiriusNavigatorProps {
  zoom: number
  rotationX: number
  rotationY: number
  siriusPosition?: { x: number; y: number; z: number }
  isPointingAtSirius?: boolean
}

export function SiriusNavigator({ zoom, rotationX, rotationY, siriusPosition, isPointingAtSirius = false }: SiriusNavigatorProps) {
  console.log('[SiriusNavigator] Rendering')
  const actualSiriusPosition = siriusPosition || { x: 8, y: 4, z: -6 }
  const groupRef = useRef<THREE.Group>(null)
  const starsRef = useRef<THREE.Points>(null)
  const siriusRef = useRef<THREE.Points>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Line>(null)

  // Create star geometries
  const { starsGeometry, siriusGeometry, trailGeometry } = useMemo(() => {
    // Background stars
    const starPositions: number[] = []
    const starColors: number[] = []
    const starSizes: number[] = []

    for (let i = 0; i < 800; i++) {
      const radius = 15 + Math.random() * 25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      starPositions.push(x, y, z)

      const brightness = 0.3 + Math.random() * 0.5
      const color = new THREE.Color().setHSL(0.6, 0.1, brightness)
      starColors.push(color.r, color.g, color.b)
      starSizes.push(1 + Math.random() * 3)
    }

    const starsGeo = new THREE.BufferGeometry()
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    starsGeo.setAttribute('customColor', new THREE.Float32BufferAttribute(starColors, 3))
    starsGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1))

    // Sirius point
    const siriusGeo = new THREE.BufferGeometry()
    siriusGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))

    // Trail geometry (will be updated)
    const trailGeo = new THREE.BufferGeometry()

    return { starsGeometry: starsGeo, siriusGeometry: siriusGeo, trailGeometry: trailGeo }
  }, [])

  // Update trail when position changes
  useEffect(() => {
    const points: number[] = []
    const steps = 50
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = t * Math.PI * 2
      const spiralRadius = (1 - t) * 2
      points.push(
        actualSiriusPosition.x * t + Math.cos(angle) * spiralRadius,
        actualSiriusPosition.y * t + Math.sin(angle) * spiralRadius,
        actualSiriusPosition.z * t
      )
    }
    trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  }, [actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z, trailGeometry])

  // Sirius shader
  const siriusMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(SIRIUS.color) },
        intensity: { value: 1.0 },
      },
      vertexShader: `
        uniform float time;
        uniform float intensity;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = sin(time * 3.0) * 0.2 + 1.0;
          float baseSize = 80.0 * intensity;
          gl_PointSize = baseSize * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float intensity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float core = 1.0 - smoothstep(0.0, 0.1, dist);
          float innerGlow = exp(-dist * 8.0) * intensity;
          float outerGlow = exp(-dist * 3.0) * 0.5 * intensity;
          float twinkleSpeed = 5.0 + (intensity - 1.0) * 10.0;
          float twinkle = sin(time * twinkleSpeed) * 0.1 + 0.9;
          float alpha = (core + innerGlow + outerGlow) * twinkle;
          vec3 highlightColor = mix(color, vec3(1.0, 0.85, 0.3), (intensity - 1.0) * 0.5);
          vec3 finalColor = highlightColor * (core + innerGlow * 0.8 + outerGlow * 0.5);
          finalColor = mix(finalColor, vec3(1.0), core * 0.7);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Background stars material
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        uniform float time;

        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time + position.x * 10.0) * 0.2 + 0.8;
          gl_PointSize = size * twinkle * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Trail material
  const trailMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.4,
    })
  }, [])

  const intensityRef = useRef(1.0)

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Update intensity
    const targetIntensity = isPointingAtSirius ? 2.5 : 1.0
    intensityRef.current += (targetIntensity - intensityRef.current) * 0.1
    siriusMaterial.uniforms.intensity.value = intensityRef.current
    siriusMaterial.uniforms.time.value = time
    starMaterial.uniforms.time.value = time

    if (groupRef.current) {
      groupRef.current.rotation.x += rotationX * 0.015
      groupRef.current.rotation.y += rotationY * 0.015
      groupRef.current.scale.lerp(new THREE.Vector3(zoom, zoom, zoom), 0.08)
    }

    if (glowRef.current) {
      const baseScale = isPointingAtSirius ? 2 : 1
      const scale = baseScale + Math.sin(time * 2) * 0.3 * baseScale
      glowRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Background stars */}
      <points ref={starsRef} geometry={starsGeometry} material={starMaterial} />

      {/* Trail to Sirius */}
      {/* @ts-expect-error - Three.js line element */}
      <line ref={trailRef} geometry={trailGeometry} material={trailMaterial} />

      {/* Sirius */}
      <points
        ref={siriusRef}
        geometry={siriusGeometry}
        material={siriusMaterial}
        position={[actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z]}
      />

      {/* Glow sphere */}
      <mesh ref={glowRef} position={[actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color={SIRIUS.color} transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      {/* Origin point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#4ADE80" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}
