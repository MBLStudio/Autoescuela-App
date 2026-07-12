export default function CalendarioLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-24 rounded-full" style={{ background: '#1a2d45' }} />
        <div className="h-8 w-40 rounded-xl" style={{ background: '#1a2d45' }} />
      </div>

      {/* Selector de semana */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-9 w-9 rounded-xl" style={{ background: '#1a2d45' }} />
        <div className="h-5 w-48 rounded-full" style={{ background: '#1a2d45' }} />
        <div className="h-9 w-9 rounded-xl" style={{ background: '#1a2d45' }} />
      </div>

      {/* Columnas días */}
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
            <div className="h-4 w-16 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="h-3 w-12 rounded-full mb-3" style={{ background: '#0f1c2e' }} />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-14 rounded-xl" style={{ background: '#0f1c2e' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
