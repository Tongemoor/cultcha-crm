'use client'

import { Menu, Search, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  onMenuClick: () => void
  userEmail?: string
  userName?: string
}

export function TopBar({ onMenuClick, userEmail, userName }: TopBarProps) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || '?'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts, venues, artists..."
              className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-72 transition-colors"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            {userName || userEmail}
          </span>
        </div>
      </div>
    </header>
  )
}
