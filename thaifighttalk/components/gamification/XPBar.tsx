'use client'

import { motion } from 'framer-motion'
import { xpForNextLevel, xpProgress } from '@/lib/gamification'

type XPBarProps = {
  currentXP: number
  level: number
}

export function XPBar({ currentXP, level }: XPBarProps) {
  const progress = xpProgress(currentXP, level)
  const nextLevelXP = xpForNextLevel(level)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Level {level}</span>
        <span className="text-sm text-gray-600">{currentXP} / {nextLevelXP} XP</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-3 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #241663 0%, #FFD700 100%)'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
