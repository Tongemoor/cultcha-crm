import { createClient } from '@/lib/supabase/server'
import { Settings, User, Shield, Database } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, created_at')
    .eq('id', user?.id || '')
    .single()

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at')

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-xl">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Your profile</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full name</label>
            <p className="text-sm text-gray-900">{profile?.full_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <p className="text-sm text-gray-900">{profile?.email || user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
            <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full capitalize">
              {profile?.role?.replace('_', ' ') || 'staff'}
            </span>
          </div>
        </div>
      </div>

      {/* Team members — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Team members & access</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {allProfiles?.map((p) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.full_name || p.email}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.is_active ? 'active' : 'inactive'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full capitalize font-medium">
                    {p.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-400">
              To invite new team members, go to your Supabase dashboard → Authentication → Users → Invite user.
            </p>
          </div>
        </div>
      )}

      {/* System info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">System</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">
            Cultcha Vultcha CRM — custom business operations platform.
            Built on Next.js and Supabase.
          </p>
          <p className="text-xs text-gray-400 mt-2">Version 1.0 — Phase 1</p>
        </div>
      </div>
    </div>
  )
}
