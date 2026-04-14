import { createClient } from '@/lib/supabase/server'
import { FileText, Upload } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function FilesPage() {
  const supabase = await createClient()

  const { data: files } = await supabase
    .from('files')
    .select('id, name, file_type, category, linked_record_name, linked_record_type, is_sensitive, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Files & Documents</h1>
            <p className="text-sm text-gray-500">{files?.length || 0} files</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload file
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!files || files.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No files yet</p>
            <p className="text-sm mt-1">Upload files via individual records or use the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {files.map((file) => (
              <div key={file.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {file.linked_record_name && (
                        <span className="text-xs text-gray-400 truncate">{file.linked_record_name}</span>
                      )}
                      {file.is_sensitive && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">Confidential</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {file.category && (
                    <span className="text-xs text-gray-400 capitalize hidden sm:block">{file.category}</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(file.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
