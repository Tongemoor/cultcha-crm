'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MapPin,
  Music,
  CheckSquare,
  TrendingUp,
  Calendar,
  Inbox,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  X,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Venues', href: '/venues', icon: MapPin },
  { label: 'Artists', href: '/artists', icon: Music },
  { label: 'Bookings', href: '/bookings', icon: BookOpen },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Pipelines', href: '/pipelines', icon: TrendingUp },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Files', href: '/files', icon: FileText },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">CV</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Cultcha Vultcha</p>
            <p className="text-gray-400 text-xs mt-0.5">CRM Platform</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
