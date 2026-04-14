import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default async function PipelinesPage() {
  const supabase = await createClient()

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select(`
      id, name, type, description, is_active,
      pipeline_stages (id, name, stage_order, colour)
    `)
    .eq('is_active', true)
    .order('name')

  const pipelineItemCounts: Record<string, Record<string, number>> = {}
  if (pipelines) {
    for (const pipeline of pipelines) {
      const { data: items } = await supabase
        .from('pipeline_items')
        .select('stage_id')
        .eq('pipeline_id', pipeline.id)

      pipelineItemCounts[pipeline.id] = {}
      if (items) {
        for (const item of items) {
          pipelineItemCounts[pipeline.id][item.stage_id] =
            (pipelineItemCounts[pipeline.id][item.stage_id] || 0) + 1
        }
      }
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipelines</h1>
          <p className="text-sm text-gray-500">Track relationship progress across all areas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {!pipelines || pipelines.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pipelines configured</p>
          </div>
        ) : (
          pipelines.map((pipeline) => {
            const stages = pipeline.pipeline_stages
              ? [...pipeline.pipeline_stages].sort((a: { stage_order: number }, b: { stage_order: number }) => a.stage_order - b.stage_order)
              : []
            const totalItems = Object.values(pipelineItemCounts[pipeline.id] || {}).reduce((a, b) => a + b, 0)

            return (
              <Link key={pipeline.id} href={`/pipelines/${pipeline.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pipeline.name}</h3>
                      {pipeline.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{pipeline.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Stage bars */}
                  <div className="space-y-2">
                    {stages.slice(0, 6).map((stage: { id: string; name: string; colour: string }) => {
                      const count = pipelineItemCounts[pipeline.id]?.[stage.id] || 0
                      return (
                        <div key={stage.id} className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stage.colour || '#6366f1' }}
                          />
                          <span className="text-xs text-gray-600 flex-1 truncate">{stage.name}</span>
                          <span className="text-xs font-semibold text-gray-700 w-5 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
