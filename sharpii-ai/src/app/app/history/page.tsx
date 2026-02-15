"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-client-simple"
import UserHeader from "@/components/app/UserHeader"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { toast } from "sonner"

type HistoryListItem = {
  id: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string }>
  status: string
  createdAt: string
}

type HistoryDetail = {
  id: string
  taskId: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string }>
  modelName: string
  pageName: string
  status: string
  generationTimeMs: number | null
  settings: {
    style?: string | null
    mode?: string | null
    transformationStrength?: number | null
    skinTextureSize?: number | null
    detailLevel?: number | null
    failure_reason?: string
  }
  createdAt: string
}

export default function HistoryPage() {
  const { user, isLoading } = useAuth()
  const [items, setItems] = useState<HistoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selected, setSelected] = useState<HistoryDetail | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadHistory = async (reset = false) => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '24')
      if (!reset && cursor) {
        params.set('cursor', cursor)
      }

      const res = await fetch(`/api/history/list?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('History load failed:', errorData)
        toast.error(errorData.error || 'Failed to load history')
        setLoading(false)
        return
      }

      const data = await res.json()
      const newItems: HistoryListItem[] = data.items || []

      setItems(prev => reset ? newItems : [...prev, ...newItems])
      setCursor(data.nextCursor || null)
      setHasMore(!!data.hasMore)
    } catch (error) {
      console.error('History load error:', error)
      toast.error('Connection error while loading history')
    } finally {
      setLoading(false)
    }
  }

  const updateProcessingItems = async () => {
    const processingIds = items
      .filter(item => item.status === 'processing')
      .map(item => item.id)
    
    if (processingIds.length === 0) return

    try {
      const params = new URLSearchParams()
      params.set('ids', processingIds.join(','))
      
      const res = await fetch(`/api/history/list?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) return 

      const data = await res.json()
      const updatedItems: HistoryListItem[] = data.items || []
      
      if (updatedItems.length > 0) {
        setItems(prev => prev.map(item => {
          const updated = updatedItems.find(u => u.id === item.id)
          return updated ? { ...item, ...updated } : item
        }))
      }
    } catch (error) {
      // Silent fail for background updates
      console.error('Background update failed', error)
    }
  }

  const refreshIfProcessing = useMemo(
    () => items.some(item => item.status === 'processing'),
    [items]
  )

  useEffect(() => {
    if (!user) return
    loadHistory(true)
  }, [user])

  useEffect(() => {
    if (!refreshIfProcessing) return
    const interval = setInterval(() => {
      updateProcessingItems()
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshIfProcessing])

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/history/item?id=${id}`, { cache: 'no-store' })
      if (!res.ok) {
        toast.error('Failed to load details')
        return
      }
      const data = await res.json()
      setSelected(data)
      setModalOpen(true)
    } catch (error) {
      console.error('Failed to open detail:', error)
      toast.error('Connection error')
    }
  }

  if (isLoading) {
    return <ElegantLoading message="Loading history..." />
  }

  if (!user) {
    if (typeof window !== 'undefined') {
        window.location.href = '/login'
    }
    return <ElegantLoading message="Redirecting to login..." />
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      <UserHeader />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold">History</h1>
              <p className="text-white/60 text-sm mt-1">Your recent outputs and processing status</p>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                loadHistory(true)
              }}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <ElegantLoading message="Loading history..." />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-white/60 text-sm">
              No history items yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => {
                const primary = item.outputUrls?.find(o => o.type === 'image')?.url || item.outputUrls?.[0]?.url
                return (
                  <button
                    key={item.id}
                    onClick={() => openDetail(item.id)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/30 transition-all cursor-pointer"
                  >
                    {primary ? (
                      <img src={primary} alt="Output" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
                        Processing
                      </div>
                    )}

                    {item.status === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/80 bg-black/60 px-2 py-1 rounded-full">
                      <span className="uppercase tracking-wider">{item.status}</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center">
              <button
                onClick={() => loadHistory()}
                className="px-6 py-2 text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </main>

      {modalOpen && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#0c0c0e] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-sm font-semibold">{selected.modelName}</p>
                <p className="text-xs text-white/50">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs uppercase tracking-wider text-white/60 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
              <div className="grid grid-cols-2 gap-3">
                {selected.outputUrls?.map((output, idx) => (
                  output.type === 'image' ? (
                    <img key={`${output.url}-${idx}`} src={output.url} alt={`Output ${idx + 1}`} className="w-full aspect-square object-cover rounded-lg border border-white/10" />
                  ) : (
                    <video key={`${output.url}-${idx}`} src={output.url} controls className="w-full aspect-square object-cover rounded-lg border border-white/10" />
                  )
                ))}
              </div>

              <div className="space-y-4 text-xs text-white/70">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={`capitalize ${selected.status === 'failed' ? 'text-red-400' : 'text-white'}`}>{selected.status}</span>
                  </div>
                  {selected.status === 'failed' && selected.settings?.failure_reason && (
                    <div className="flex flex-col gap-1 border border-red-500/20 bg-red-500/10 p-3 rounded-lg mt-2">
                      <span className="text-red-400 font-medium">Failure Reason</span>
                      <span className="text-white/90 break-words">{selected.settings.failure_reason}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Page</span>
                    <span className="text-white">{selected.pageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Task ID</span>
                    <span className="text-white">{selected.taskId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generation Time</span>
                    <span className="text-white">{selected.generationTimeMs ? `${(selected.generationTimeMs / 1000).toFixed(1)}s` : '—'}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Style</span>
                    <span className="text-white">{selected.settings?.style || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode</span>
                    <span className="text-white">{selected.settings?.mode || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transformation Strength</span>
                    <span className="text-white">{selected.settings?.transformationStrength ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skin Texture Size</span>
                    <span className="text-white">{selected.settings?.skinTextureSize ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detail Level</span>
                    <span className="text-white">{selected.settings?.detailLevel ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
