import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Globe } from './Globe'

interface GlobeSceneProps {
  zoom: number
  rotationX: number
  rotationY: number
}

export function GlobeScene({ zoom, rotationX, rotationY }: GlobeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#818cf8" />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <Globe zoom={zoom} rotationX={rotationX} rotationY={rotationY} />

      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
