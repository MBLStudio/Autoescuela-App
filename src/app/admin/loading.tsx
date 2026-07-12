export default function AdminLoading() {
  return (
    <div className="px-4 py-6 md:p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full" style={{ background: '#1a2d45' }} />
          <div className="h-8 w-40 rounded-xl" style={{ background: '#1a2d45' }} />
          <div className="h-3 w-32 rounded-full" style={{ background: '#0f1c2e' }} />
        </div>
        <div className="h-11 w-36 rounded-xl" style={{ background: '#1a2d45' }} />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
            <div className="h-3 w-16 rounded-full mb-3" style={{ background: '#1a2d45' }} />
            <div className="h-10 w-10 rounded-xl" style={{ background: '#1a2d45' }} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl px-5 py-4 flex items-center gap-4" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: '#1a2d45' }} />
            <div className="w-14 space-y-2">
              <div className="h-6 rounded-lg" style={{ background: '#1a2d45' }} />
              <div className="h-3 rounded-full" style={{ background: '#0f1c2e' }} />
            </div>
            <div className="w-px h-10" style={{ background: '#1a2d45' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded-full" style={{ background: '#1a2d45' }} />
              <div className="h-3 w-24 rounded-full" style={{ background: '#0f1c2e' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
