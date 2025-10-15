'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-primary-red hover:text-red-700 transition-colors">
                  ThaiFightTalk
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-blue transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/camps"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Training Camps
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Leaderboard
                </Link>
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
