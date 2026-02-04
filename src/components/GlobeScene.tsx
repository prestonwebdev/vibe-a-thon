import { Canvas } from '@react-three/fiber'
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
    >
      <ambientLight intensity={0.2} />
      <SiriusNavigator zoom={zoom} rotationX={rotationX} rotationY={rotationY} siriusPosition={siriusPosition} isPointingAtSirius={isPointingAtSirius} />
    </Canvas>
  )
}
