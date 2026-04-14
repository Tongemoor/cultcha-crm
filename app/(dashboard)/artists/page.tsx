import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Music, Plus, Search } from 'lucide-react'
import { formatDate, statusColour } from '@/lib/utils'

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; genre?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('artists')
    .select('id, name, genre, location, fee_level, status, source, member_count, last_contacted, next_followup, created_at')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,genre.ilike.%${params.q}%,location.ilike.%${params.q}%`)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.genre) {
    query = query.ilike('genre', `%${params.genre}%`)
  }

  const { data: artists } = await query.limit(100)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-xl">
            <Music className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Artists</h1>
            <p className="text-sm text-gray-500">{artists?.length || 0} records</p>
          </div>
        </div>
        <Link
          href="/artists/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add artist
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search artists..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            name="status"
            defaultValue={params.status}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="identified">Identified</option>
            <option value="contacted">Contacted</option>
            <option value="active">Active</option>
            <option value="booked">Booked</option>
            <option value="inactive">Inactive</option>
            <option value="lost">Lost</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!artists || artists.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No artists yet</p>
            <p className="text-sm mt-1">Add your first artist to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Artist</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Genre</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Location</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Fee level</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Members</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden xl:table-cell">Next follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {artists.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/artists/${a.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-pink-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                          {a.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-sm text-gray-500">{a.genre || '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500">{a.location || '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500">{a.fee_level || '—'}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">
                      {a.member_count || '—'}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColour(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-sm text-gray-500">
                      {formatDate(a.next_followup)}
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
