import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { GlobeScene } from './components/GlobeScene'
import { useHandTracking } from './hooks/useHandTracking'

function App() {
  const { videoRef, gesture, isReady } = useHandTracking()
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Map pinch distance to zoom (open hand = zoomed out, pinched = zoomed in)
    const targetZoom = gesture.isPinching ? 1.5 : 0.8
    setZoom(targetZoom)

    // Map hand position to rotation
    // Convert from 0-1 range to rotation speed
    const rotX = (gesture.handY - 0.5) * 2 // -1 to 1
    const rotY = (gesture.handX - 0.5) * 2 // -1 to 1
    setRotation({ x: rotX, y: rotY })
  }, [gesture])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Hidden video element for hand tracking */}
      <video
        ref={videoRef}
        className="absolute left-0 top-0 h-1 w-1 opacity-0"
        playsInline
      />

      {/* Gradient orbs background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Title */}
      <div className="absolute left-0 right-0 top-8 z-10 text-center">
        <motion.h1
          className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
          animate={{
            backgroundPosition: ['0%', '100%', '0%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: '200% auto',
          }}
        >
          VIBE-A-THON
        </motion.h1>
      </div>

      {/* Globe Scene */}
      <div className="absolute inset-0">
        <GlobeScene zoom={zoom} rotationX={rotation.x} rotationY={rotation.y} />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mx-auto max-w-md space-y-4 px-4"
        >
          {!isReady ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="h-3 w-3 rounded-full bg-purple-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm uppercase tracking-wider text-gray-400">
                Initializing Camera
              </span>
              <motion.div
                className="h-3 w-3 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                ✋ Open hand to zoom out
              </p>
              <p className="text-sm text-gray-400">
                🤏 Pinch fingers to zoom in
              </p>
              <p className="text-sm text-gray-400">
                👋 Move hand to rotate globe
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    gesture.isPinching ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {gesture.isPinching ? 'Pinching' : 'Open'}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default App
