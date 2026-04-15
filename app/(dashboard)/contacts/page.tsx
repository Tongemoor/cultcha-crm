import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Search } from 'lucide-react'
import { formatDate, statusColour, getInitials } from '@/lib/utils'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contacts')
    .select('id, type, first_name, last_name, email, phone, status, source, organisation_id, last_contacted, next_followup, created_at')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,email.ilike.%${params.q}%`)
  }
  if (params.type) {
    query = query.eq('type', params.type)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: contacts } = await query.limit(100)

  const types = ['contact', 'audience', 'tester', 'waiting_list', 'investor', 'advisor', 'supplier', 'team_member', 'press', 'partner']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500">{contacts?.length || 0} records</p>
          </div>
        </div>
        <Link
          href="/contacts/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add contact
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search contacts..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            name="type"
            defaultValue={params.type}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All types</option>
            {types.map(t => (
              <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!contacts || contacts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contacts yet</p>
            <p className="text-sm mt-1">Add your first contact to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Next follow-up</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden xl:table-cell">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-700 text-xs font-semibold">
                            {getInitials(`${c.first_name} ${c.last_name || ''}`)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                          {c.first_name} {c.last_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                        {c.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500">
                      {c.email || '—'}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColour(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">
                      {formatDate(c.next_followup)}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-sm text-gray-500 capitalize">
                      {c.source || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
