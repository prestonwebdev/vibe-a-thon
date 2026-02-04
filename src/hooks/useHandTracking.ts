import { useEffect, useRef, useState } from 'react'
import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export interface HandGesture {
  isPinching: boolean
  pinchDistance: number
  handX: number
  handY: number
}

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [gesture, setGesture] = useState<HandGesture>({
    isPinching: false,
    pinchDistance: 0,
    handX: 0,
    handY: 0,
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      },
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]

        // Get thumb tip (4) and index finger tip (8)
        const thumbTip = landmarks[4]
        const indexTip = landmarks[8]

        // Calculate distance between thumb and index finger
        const dx = thumbTip.x - indexTip.x
        const dy = thumbTip.y - indexTip.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Get center of hand for rotation
        const handX = landmarks[9].x // Middle of hand
        const handY = landmarks[9].y

        // Pinch threshold
        const isPinching = distance < 0.08

        setGesture({
          isPinching,
          pinchDistance: distance,
          handX,
          handY,
        })
      }
    })

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480,
    })

    camera.start().then(() => {
      setIsReady(true)
    })

    return () => {
      camera.stop()
    }
  }, [])

  return { videoRef, gesture, isReady }
}
