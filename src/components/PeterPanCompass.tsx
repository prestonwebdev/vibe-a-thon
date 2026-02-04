import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState, useRef } from 'react'

interface PixieDustParticle {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

function PeterPanCompass() {
  const [particles, setParticles] = useState<PixieDustParticle[]>([])
  const [compassRotation, setCompassRotation] = useState(0)
  const particleIdRef = useRef(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 })

  // Track mouse and create pixie dust
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      // Calculate compass rotation based on mouse position relative to center
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      setCompassRotation(angle + 90)

      // Create pixie dust particles
      const colors = ['#FFD700', '#FFFACD', '#98FB98', '#87CEEB', '#FFB6C1', '#E6E6FA']
      const newParticles: PixieDustParticle[] = []

      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: i * 0.05,
        })
      }

      setParticles(prev => [...prev.slice(-50), ...newParticles])
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Clean up old particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.slice(-30))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#1a2744] to-[#0d1f3c] text-white">
      {/* Neverland stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              backgroundColor: i % 5 === 0 ? '#FFD700' : '#ffffff',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, i % 5 === 0 ? 1.8 : 1.3, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Second star to the right - brighter star */}
      <motion.div
        className="absolute right-32 top-24"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <div className="h-6 w-6 rounded-full bg-yellow-200 blur-sm" />
          <div className="absolute inset-0 h-6 w-6 rounded-full bg-yellow-100" />
          <motion.div
            className="absolute -inset-4 rounded-full bg-yellow-300/30 blur-xl"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Magical aurora effect */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <motion.div
          className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl"
          animate={{ x: [0, 200, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 top-0 h-full w-1/2 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent blur-3xl"
          animate={{ x: [0, -200, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Pixie dust particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="pointer-events-none fixed z-50 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            y: -30 + Math.random() * 60,
            x: (Math.random() - 0.5) * 40,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Tinkerbell cursor glow */}
      <motion.div
        className="pointer-events-none fixed z-40"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="h-4 w-4 rounded-full bg-yellow-200/80" />
          <div className="absolute inset-0 h-4 w-4 rounded-full bg-yellow-100 blur-sm" />
          <div className="absolute -inset-2 rounded-full bg-yellow-300/40 blur-md" />
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <motion.h2
            className="mb-2 text-lg tracking-[0.3em] text-amber-200/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SECOND STAR TO THE RIGHT
          </motion.h2>
          <motion.h1
            className="mb-8 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-6xl font-bold text-transparent"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Neverland Compass
          </motion.h1>
        </motion.div>

        {/* Peter Pan Compass */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Compass outer ring glow */}
          <motion.div
            className="absolute -inset-8 rounded-full bg-amber-500/20 blur-2xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Compass body */}
          <div className="relative h-72 w-72 rounded-full border-4 border-amber-600/50 bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/50 p-2 shadow-2xl backdrop-blur-sm">
            {/* Inner decorative ring */}
            <div className="absolute inset-4 rounded-full border-2 border-amber-500/30" />
            <div className="absolute inset-8 rounded-full border border-amber-400/20" />

            {/* Compass directions */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="absolute top-6 text-xl font-bold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>N</span>
              <span className="absolute bottom-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>S</span>
              <span className="absolute left-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>W</span>
              <span className="absolute right-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>E</span>
            </div>

            {/* Small direction markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-full w-0.5"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                }}
              >
                <div
                  className={`mx-auto ${i % 3 === 0 ? 'h-4 w-1 bg-amber-400/60' : 'h-2 w-0.5 bg-amber-500/40'}`}
                  style={{ marginTop: '12px' }}
                />
              </div>
            ))}

            {/* Compass needle container */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: compassRotation }}
              transition={{ type: "spring", stiffness: 50, damping: 10 }}
            >
              {/* North needle (gold/fairy dust) */}
              <svg
                className="absolute"
                width="40"
                height="120"
                viewBox="0 0 40 120"
                style={{ transform: 'translateY(-30px)' }}
              >
                <defs>
                  <linearGradient id="northGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <polygon
                  points="20,0 30,60 20,50 10,60"
                  fill="url(#northGradient)"
                  filter="url(#glow)"
                />
              </svg>

              {/* South needle (green/Peter Pan) */}
              <svg
                className="absolute"
                width="40"
                height="120"
                viewBox="0 0 40 120"
                style={{ transform: 'translateY(30px) rotate(180deg)' }}
              >
                <defs>
                  <linearGradient id="southGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#228B22" />
                    <stop offset="50%" stopColor="#32CD32" />
                    <stop offset="100%" stopColor="#006400" />
                  </linearGradient>
                </defs>
                <polygon
                  points="20,0 30,60 20,50 10,60"
                  fill="url(#southGradient)"
                />
              </svg>

              {/* Center jewel */}
              <motion.div
                className="absolute h-8 w-8 rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400"
                animate={{
                  boxShadow: [
                    '0 0 10px #FFD700, 0 0 20px #FFD700',
                    '0 0 20px #FFD700, 0 0 40px #FFD700',
                    '0 0 10px #FFD700, 0 0 20px #FFD700',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Decorative fairy wings pattern */}
            <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 288 288">
              <path
                d="M144 80 Q180 100 180 144 Q180 188 144 208 Q108 188 108 144 Q108 100 144 80"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
              />
              <path
                d="M80 144 Q100 108 144 108 Q188 108 208 144 Q188 180 144 180 Q100 180 80 144"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
              />
            </svg>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.p
          className="mt-12 max-w-md text-center text-lg italic text-amber-200/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          "All you need is faith, trust, and a little bit of pixie dust."
        </motion.p>

        {/* Instructions */}
        <motion.p
          className="mt-6 text-sm text-amber-300/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Move your cursor to guide the compass & leave a trail of pixie dust
        </motion.p>
      </div>
    </div>
  )
}

export default PeterPanCompass
