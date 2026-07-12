export default function StudentLoading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: '#0a0f1a' }}>
      <div style={{ background: '#0d1829', borderBottom: '1px solid #1a2d45' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl" style={{ background: '#1a2d45' }} />
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="h-3 w-24 rounded-full" style={{ background: '#0f1c2e' }} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div className="h-3 w-32 rounded-full" style={{ background: '#1a2d45' }} />
        <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="h-5 w-40 rounded-full" style={{ background: '#1a2d45' }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl" style={{ background: '#0f1c2e' }} />
          ))}
        </div>

        <div className="h-3 w-28 rounded-full mt-4" style={{ background: '#1a2d45' }} />
        <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-1 h-14 rounded-xl" style={{ background: '#0f1c2e' }} />
            ))}
          </div>
          <div className="h-11 rounded-xl" style={{ background: '#0f1c2e' }} />
        </div>
      </div>
    </div>
  )
}
