import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'found' | 'done'>('loading')

  const messages = [
    'Scanning the night sky...',
    'Calculating stellar coordinates...',
    'Searching for Neverland...',
    'Following the second star...',
  ]

  const [messageIndex, setMessageIndex] = useState(0)

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setPhase('found')
          return 100
        }
        return prev + Math.random() * 4 + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Rotate messages
  useEffect(() => {
    if (phase === 'loading') {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % messages.length)
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [phase, messages.length])

  // Transition to main view after found
  useEffect(() => {
    if (phase === 'found') {
      const timer = setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, onComplete])

  if (phase === 'done') return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Simple starfield */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/50"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {phase === 'loading' && (
          <div className="space-y-8">
            {/* Radar animation */}
            <div className="relative mx-auto h-32 w-32">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-yellow-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border border-yellow-400/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>

            {/* Message */}
            <div className="space-y-4">
              <p className="font-serif text-xl text-white/70">
                {messages[messageIndex]}
              </p>

              {/* Progress bar */}
              <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-100"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <p className="text-sm text-white/30">
                {Math.min(Math.floor(progress), 100)}%
              </p>
            </div>
          </div>
        )}

        {phase === 'found' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Star burst */}
            <div className="relative mx-auto h-32 w-32">
              <motion.div
                className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/50 blur-xl"
                animate={{ scale: [1, 1.5, 1.2] }}
                transition={{ duration: 0.8 }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-yellow-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              />
            </div>

            <div>
              <h2 className="font-serif text-3xl text-yellow-400">
                Neverland Found!
              </h2>
              <p className="mt-2 text-white/50">
                Second star to the right...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
