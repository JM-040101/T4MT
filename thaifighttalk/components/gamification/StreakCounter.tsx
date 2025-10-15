'use client'

import { Flame } from 'lucide-react'
import { motion } from 'framer-motion'

type StreakCounterProps = {
  streak: number
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-lg">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Flame className="w-8 h-8 text-orange-500" fill="currentColor" />
      </motion.div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{streak}</div>
        <div className="text-sm text-gray-600">day streak</div>
      </div>
    </div>
  )
}
