'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/types'

type BadgeDisplayProps = {
  badge: Badge & { earned: boolean; earned_at?: string | null }
  size?: 'sm' | 'md' | 'lg'
}

export function BadgeDisplay({ badge, size = 'md' }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  return (
    <motion.div
      className={`flex flex-col items-center p-4 rounded-lg transition-all ${
        badge.earned ? 'bg-yellow-50' : 'bg-gray-50'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`${sizeClasses[size]} relative mb-2`}>
        <div
          className={`w-full h-full flex items-center justify-center text-4xl ${
            !badge.earned ? 'grayscale opacity-40' : ''
          }`}
        >
          🏆
        </div>
      </div>
      <h3 className={`text-sm font-bold text-center ${
        badge.earned ? 'text-gray-900' : 'text-gray-400'
      }`}>
        {badge.name}
      </h3>
      <p className="text-xs text-gray-600 text-center mt-1">
        {badge.description}
      </p>
      {badge.earned && badge.earned_at && (
        <p className="text-xs text-primary-blue mt-2">
          Earned {new Date(badge.earned_at).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  )
}
