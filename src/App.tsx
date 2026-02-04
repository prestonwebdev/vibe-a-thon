import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import PeterPanCompass from './components/PeterPanCompass'
import { LocatorView } from './components/LocatorView'

type Tab = 'compass' | 'locator'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('compass')

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Tab Navigation */}
      <nav className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
        <motion.div
          className="flex gap-2 rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TabButton
            active={activeTab === 'compass'}
            onClick={() => setActiveTab('compass')}
          >
            Compass
          </TabButton>
          <TabButton
            active={activeTab === 'locator'}
            onClick={() => setActiveTab('locator')}
          >
            Locator
          </TabButton>
        </motion.div>
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'compass' && (
          <motion.div
            key="compass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PeterPanCompass />
          </motion.div>
        )}
        {activeTab === 'locator' && (
          <motion.div
            key="locator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LocatorView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/80 to-blue-600/80"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export default App
