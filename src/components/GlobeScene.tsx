import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { SiriusNavigator } from './SiriusNavigator'

interface GlobeSceneProps {
  zoom: number
  rotationX: number
  rotationY: number
  siriusPosition?: { x: number; y: number; z: number }
  isPointingAtSirius?: boolean
}

export function GlobeScene({ zoom, rotationX, rotationY, siriusPosition, isPointingAtSirius }: GlobeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />

      {/* Fallback stars from drei in case custom ones fail */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <SiriusNavigator zoom={zoom} rotationX={rotationX} rotationY={rotationY} siriusPosition={siriusPosition} isPointingAtSirius={isPointingAtSirius} />
    </Canvas>
  )
}
