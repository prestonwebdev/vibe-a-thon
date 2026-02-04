import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'searching' | 'found' | 'transition'>('searching')
  const [progress, setProgress] = useState(0)

  // Simulate searching progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setPhase('found')
          return 100
        }
        // Randomize progress speed for organic feel
        return prev + Math.random() * 3 + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Trigger transition after "found" phase
  useEffect(() => {
    if (phase === 'found') {
      const timer = setTimeout(() => {
        setPhase('transition')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Complete after transition
  useEffect(() => {
    if (phase === 'transition') {
      const timer = setTimeout(() => {
        onComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, onComplete])

  const searchMessages = [
    'Scanning the night sky...',
    'Calculating stellar coordinates...',
    'Searching for Neverland...',
    'Following the second star...',
    'Tracing pixie dust trails...',
  ]

  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (phase === 'searching') {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % searchMessages.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [phase])

  return (
    <AnimatePresence>
      {phase !== 'transition' ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Starfield background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Central content */}
          <div className="relative z-10 text-center">
            {phase === 'searching' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Compass/radar animation */}
                <div className="relative mx-auto h-32 w-32">
                  {/* Outer ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Middle ring */}
                  <motion.div
                    className="absolute inset-4 rounded-full border border-yellow-400/20"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Inner pulse */}
                  <motion.div
                    className="absolute inset-8 rounded-full bg-yellow-400/10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Center star */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {/* Scanning line */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-16 w-0.5 origin-bottom -translate-x-1/2 bg-gradient-to-t from-yellow-400/50 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={messageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="font-serif text-xl text-white/70"
                    >
                      {searchMessages[messageIndex]}
                    </motion.p>
                  </AnimatePresence>

                  {/* Progress bar */}
                  <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <p className="text-sm text-white/30">
                    {Math.min(Math.floor(progress), 100)}%
                  </p>
                </div>
              </motion.div>
            )}

            {phase === 'found' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Success star burst */}
                <div className="relative mx-auto h-40 w-40">
                  {/* Radiating lines */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2 h-20 w-0.5 origin-bottom -translate-x-1/2 bg-gradient-to-t from-yellow-400 to-transparent"
                      style={{ rotate: `${i * 30}deg` }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: [0, 1, 0.5] }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  ))}
                  {/* Central glow */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/50 blur-xl"
                    animate={{ scale: [1, 2, 1.5], opacity: [0.5, 1, 0.7] }}
                    transition={{ duration: 1 }}
                  />
                  {/* Center star */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-yellow-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="font-serif text-3xl text-yellow-400">
                    Neverland Found!
                  </h2>
                  <p className="mt-2 text-white/50">
                    Second star to the right...
                  </p>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        // Pixie dust transition
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        >
          {/* Pixie dust particles */}
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-yellow-400"
              style={{
                left: '50%',
                top: '50%',
                boxShadow: '0 0 10px 2px rgba(250, 204, 21, 0.5)',
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * window.innerWidth * 1.5,
                y: (Math.random() - 0.5) * window.innerHeight * 1.5,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Golden flash */}
          <motion.div
            className="absolute inset-0 bg-yellow-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
