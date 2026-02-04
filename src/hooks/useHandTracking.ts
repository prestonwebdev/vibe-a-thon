import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export interface HandGesture {
  // Hand position (palm center)
  handX: number
  handY: number
  // Movement delta
  deltaX: number
  deltaY: number
  // Open palm detection
  isOpenPalm: boolean
  // Pinch for zooming
  isPinching: boolean
  // Two hand gestures
  isDoublePinch: boolean
  twoHandDistance: number
  twoHandDistanceDelta: number
  // Hand detected
  hasHand: boolean
}

export function useHandTracking(enabled: boolean = true) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevTwoHandDistanceRef = useRef<number>(0)
  const prevHandPosRef = useRef<{ x: number; y: number } | null>(null)
  const [gesture, setGesture] = useState<HandGesture>({
    handX: 0.5,
    handY: 0.5,
    deltaX: 0,
    deltaY: 0,
    isOpenPalm: false,
    isPinching: false,
    isDoublePinch: false,
    twoHandDistance: 0,
    twoHandDistanceDelta: 0,
    hasHand: false,
  })
  const [isReady, setIsReady] = useState(false)

  const processResults = useCallback((results: Results) => {
    const hands = results.multiHandLandmarks || []

    if (hands.length === 0) {
      prevHandPosRef.current = null
      setGesture({
        handX: 0.5,
        handY: 0.5,
        deltaX: 0,
        deltaY: 0,
        isOpenPalm: false,
        isPinching: false,
        isDoublePinch: false,
        twoHandDistance: 0,
        twoHandDistanceDelta: 0,
        hasHand: false,
      })
      prevTwoHandDistanceRef.current = 0
      return
    }

    // Check hand state
    const getHandData = (landmarks: typeof hands[0]) => {
      const thumbTip = landmarks[4]
      const indexTip = landmarks[8]
      const middleTip = landmarks[12]
      const ringTip = landmarks[16]
      const pinkyTip = landmarks[20]

      // Palm center (wrist to middle finger base)
      const palmX = landmarks[9].x
      const palmY = landmarks[9].y

      // Pinch detection
      const pinchDx = thumbTip.x - indexTip.x
      const pinchDy = thumbTip.y - indexTip.y
      const pinchDistance = Math.sqrt(pinchDx * pinchDx + pinchDy * pinchDy)
      const isPinching = pinchDistance < 0.06

      // Open palm detection - check if fingers are extended
      // Compare fingertips to their base knuckles
      const indexBase = landmarks[5]
      const middleBase = landmarks[9]
      const ringBase = landmarks[13]
      const pinkyBase = landmarks[17]

      // Fingers are extended if tips are further from wrist than bases
      const wrist = landmarks[0]
      const distToWrist = (p: { x: number; y: number }) =>
        Math.sqrt((p.x - wrist.x) ** 2 + (p.y - wrist.y) ** 2)

      const indexExtended = distToWrist(indexTip) > distToWrist(indexBase)
      const middleExtended = distToWrist(middleTip) > distToWrist(middleBase)
      const ringExtended = distToWrist(ringTip) > distToWrist(ringBase)
      const pinkyExtended = distToWrist(pinkyTip) > distToWrist(pinkyBase)

      // Open palm = most fingers extended and not pinching
      const fingersExtended = [indexExtended, middleExtended, ringExtended, pinkyExtended]
        .filter(Boolean).length
      const isOpenPalm = fingersExtended >= 3 && !isPinching

      return { palmX, palmY, isPinching, isOpenPalm, pinchDistance }
    }

    if (hands.length >= 2) {
      // Two hands - check for double pinch zoom
      const hand1 = getHandData(hands[0])
      const hand2 = getHandData(hands[1])

      const isDoublePinch = hand1.isPinching && hand2.isPinching

      // Get pinch points for distance calculation
      const pinch1X = (hands[0][4].x + hands[0][8].x) / 2
      const pinch1Y = (hands[0][4].y + hands[0][8].y) / 2
      const pinch2X = (hands[1][4].x + hands[1][8].x) / 2
      const pinch2Y = (hands[1][4].y + hands[1][8].y) / 2

      const dx = pinch1X - pinch2X
      const dy = pinch1Y - pinch2Y
      const twoHandDistance = Math.sqrt(dx * dx + dy * dy)

      const twoHandDistanceDelta = twoHandDistance - prevTwoHandDistanceRef.current
      prevTwoHandDistanceRef.current = twoHandDistance

      // Use first hand for palm tracking
      const handX = hand1.palmX
      const handY = hand1.palmY

      let deltaX = 0
      let deltaY = 0
      if (prevHandPosRef.current) {
        deltaX = handX - prevHandPosRef.current.x
        deltaY = handY - prevHandPosRef.current.y
      }
      prevHandPosRef.current = { x: handX, y: handY }

      setGesture({
        handX,
        handY,
        deltaX,
        deltaY,
        isOpenPalm: hand1.isOpenPalm || hand2.isOpenPalm,
        isPinching: hand1.isPinching || hand2.isPinching,
        isDoublePinch,
        twoHandDistance,
        twoHandDistanceDelta: isDoublePinch ? twoHandDistanceDelta : 0,
        hasHand: true,
      })
    } else {
      // Single hand
      const landmarks = hands[0]
      const handData = getHandData(landmarks)

      const handX = handData.palmX
      const handY = handData.palmY

      // Calculate movement delta when palm is open
      let deltaX = 0
      let deltaY = 0
      if (prevHandPosRef.current && handData.isOpenPalm) {
        deltaX = handX - prevHandPosRef.current.x
        deltaY = handY - prevHandPosRef.current.y
      }

      // Always track position when hand is visible
      prevHandPosRef.current = { x: handX, y: handY }
      prevTwoHandDistanceRef.current = 0

      setGesture({
        handX,
        handY,
        deltaX: handData.isOpenPalm ? deltaX : 0,
        deltaY: handData.isOpenPalm ? deltaY : 0,
        isOpenPalm: handData.isOpenPalm,
        isPinching: handData.isPinching,
        isDoublePinch: false,
        twoHandDistance: 0,
        twoHandDistanceDelta: 0,
        hasHand: true,
      })
    }
  }, [])

  useEffect(() => {
    // Skip initialization if hand tracking is disabled (e.g., on mobile)
    if (!enabled || !videoRef.current) return

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      },
    })

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    hands.onResults(processResults)

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
  }, [processResults, enabled])

  return { videoRef, gesture, isReady }
}
