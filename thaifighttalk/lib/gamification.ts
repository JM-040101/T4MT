/**
 * Gamification Helper Functions
 * XP, levels, streaks, and progression calculations
 */

/**
 * Calculate user level from total XP
 * Formula: level = floor(sqrt(xp / 100)) + 1
 *
 * @example
 * calculateLevel(0) => 1
 * calculateLevel(100) => 2
 * calculateLevel(500) => 3
 * calculateLevel(1000) => 4
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP required for the next level
 * Formula: xp = (level)^2 * 100
 *
 * @example
 * xpForNextLevel(1) => 100
 * xpForNextLevel(2) => 400
 * xpForNextLevel(5) => 2500
 */
export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return (nextLevel - 1) ** 2 * 100
}

/**
 * Calculate XP needed for a specific level
 *
 * @example
 * xpForLevel(1) => 0
 * xpForLevel(2) => 100
 * xpForLevel(3) => 400
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return (level - 1) ** 2 * 100
}

/**
 * Calculate progress percentage towards next level
 * Returns a value between 0 and 100
 *
 * @example
 * xpProgress(50, 1) => 50
 * xpProgress(150, 2) => 16.67
 */
export function xpProgress(currentXP: number, currentLevel: number): number {
  const currentLevelXP = xpForLevel(currentLevel)
  const nextLevelXP = xpForLevel(currentLevel + 1)
  const xpInCurrentLevel = currentXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP

  if (xpNeededForLevel === 0) return 100

  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100
  return Math.max(0, Math.min(progress, 100))
}

/**
 * Calculate XP remaining until next level
 */
export function xpToNextLevel(currentXP: number, currentLevel: number): number {
  const nextLevelXP = xpForLevel(currentLevel + 1)
  return Math.max(0, nextLevelXP - currentXP)
}

/**
 * Calculate streak status based on last activity
 * Returns current streak count and whether it was broken
 *
 * Streak rules:
 * - Same day (< 24 hours): maintain current streak
 * - Next day (24-48 hours): increment streak
 * - Missed day (> 48 hours): reset to 1, mark as broken
 */
export function calculateStreak(
  lastActivity: Date | string,
  currentStreak: number = 0
): { streak: number; broken: boolean } {
  const now = new Date()
  const lastDate = typeof lastActivity === 'string' ? new Date(lastActivity) : lastActivity
  const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)

  // Same day - maintain streak
  if (hoursSince < 24) {
    return { streak: currentStreak, broken: false }
  }

  // Next day - increment streak
  if (hoursSince < 48) {
    return { streak: currentStreak + 1, broken: false }
  }

  // Missed a day - reset streak
  return { streak: 1, broken: true }
}

/**
 * Check if user should earn a badge based on criteria
 */
export function checkBadgeCriteria(
  criteriaType: string,
  criteriaValue: number,
  userValue: number
): boolean {
  switch (criteriaType) {
    case 'xp_threshold':
    case 'level_threshold':
    case 'lessons_completed':
    case 'perfect_scores':
    case 'camps_completed':
    case 'sparring_sessions':
      return userValue >= criteriaValue

    case 'streak_days':
      return userValue >= criteriaValue

    default:
      return false
  }
}

/**
 * Calculate rank suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export function getRankSuffix(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) {
    return `${rank}th`
  }

  switch (rank % 10) {
    case 1:
      return `${rank}st`
    case 2:
      return `${rank}nd`
    case 3:
      return `${rank}rd`
    default:
      return `${rank}th`
  }
}

/**
 * Format XP number with commas
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString()
}
