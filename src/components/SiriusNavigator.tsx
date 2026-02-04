import { useRef, useMemo } from 'react'
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
  // Use real position if provided, otherwise use default position
  const actualSiriusPosition = siriusPosition || { x: 8, y: 4, z: -6 }
  const groupRef = useRef<THREE.Group>(null)
  const siriusRef = useRef<THREE.Points>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Line>(null!)

  // Create star field (static, doesn't depend on Sirius position)
  const { starPositions, starColors, starSizes } = useMemo(() => {
    const starPositions: number[] = []
    const starColors: number[] = []
    const starSizes: number[] = []

    // Background stars
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

    return { starPositions, starColors, starSizes }
  }, [])

  // Create trail points from origin to Sirius (updates with position)
  const trailPoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const steps = 50
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // Spiral path to Sirius
      const angle = t * Math.PI * 2
      const spiralRadius = (1 - t) * 2
      points.push(new THREE.Vector3(
        actualSiriusPosition.x * t + Math.cos(angle) * spiralRadius,
        actualSiriusPosition.y * t + Math.sin(angle) * spiralRadius,
        actualSiriusPosition.z * t
      ))
    }
    return points
  }, [actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z])

  // Sirius shader with intense glow
  const siriusMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(SIRIUS.color) },
        intensity: { value: 1.0 }, // For pointing highlight
      },
      vertexShader: `
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Pulsing size - bigger when pointing at it
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
        varying vec2 vUv;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));

          // Multi-layered glow - more intense when pointing
          float core = 1.0 - smoothstep(0.0, 0.1, dist);
          float innerGlow = exp(-dist * 8.0) * intensity;
          float outerGlow = exp(-dist * 3.0) * 0.5 * intensity;
          float rays = exp(-dist * 2.0) * 0.3 * intensity;

          // Twinkle - faster when pointing
          float twinkleSpeed = 5.0 + (intensity - 1.0) * 10.0;
          float twinkle = sin(time * twinkleSpeed) * 0.1 + 0.9;

          float alpha = (core + innerGlow + outerGlow + rays) * twinkle;

          // Color shifts to golden when pointing
          vec3 highlightColor = mix(color, vec3(1.0, 0.85, 0.3), (intensity - 1.0) * 0.5);
          vec3 finalColor = highlightColor * (core + innerGlow * 0.8 + outerGlow * 0.5);

          // Add white core
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
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#FFD700') }, // Golden pixie dust
      },
      vertexShader: `
        uniform float time;
        varying float vProgress;

        void main() {
          // Calculate progress along the line (0 to 1)
          vProgress = position.x / 10.0; // Approximate

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying float vProgress;

        void main() {
          // Animated dash pattern
          float dash = sin((vProgress * 20.0) - time * 3.0) * 0.5 + 0.5;
          float alpha = dash * 0.6;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Track intensity for smooth transitions
  const intensityRef = useRef(1.0)

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Smoothly transition intensity when pointing state changes
    const targetIntensity = isPointingAtSirius ? 2.5 : 1.0
    intensityRef.current += (targetIntensity - intensityRef.current) * 0.1
    siriusMaterial.uniforms.intensity.value = intensityRef.current

    if (groupRef.current) {
      // Update shaders
      siriusMaterial.uniforms.time.value = time
      starMaterial.uniforms.time.value = time
      trailMaterial.uniforms.time.value = time

      // Apply rotation from hand tracking
      groupRef.current.rotation.x += rotationX * 0.015
      groupRef.current.rotation.y += rotationY * 0.015

      // Smooth zoom
      groupRef.current.scale.lerp(
        new THREE.Vector3(zoom, zoom, zoom),
        0.08
      )
    }

    // Make Sirius glow pulse - bigger when pointing
    if (glowRef.current) {
      const baseScale = isPointingAtSirius ? 2 : 1
      const scale = baseScale + Math.sin(time * 2) * 0.3 * baseScale
      glowRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Background stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={new Float32Array(starPositions)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-customColor"
            count={starColors.length / 3}
            array={new Float32Array(starColors)}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={starSizes.length}
            array={new Float32Array(starSizes)}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      {/* Trail to Sirius (pixie dust path) */}
      {/* @ts-expect-error - Three.js line element */}
      <line ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={trailPoints.length}
            array={new Float32Array(trailPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <primitive object={trailMaterial} attach="material" />
      </line>

      {/* Sirius - The destination */}
      <points ref={siriusRef} position={[actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={1}
            array={new Float32Array([0, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <primitive object={siriusMaterial} attach="material" />
      </points>

      {/* Outer glow sphere for Sirius */}
      <mesh ref={glowRef} position={[actualSiriusPosition.x, actualSiriusPosition.y, actualSiriusPosition.z]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={SIRIUS.color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Origin point (Earth/Starting point) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#4ADE80" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}
