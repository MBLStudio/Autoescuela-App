export default function AlumnosLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full" style={{ background: '#1a2d45' }} />
          <div className="h-8 w-32 rounded-xl" style={{ background: '#1a2d45' }} />
        </div>
        <div className="h-11 w-36 rounded-xl" style={{ background: '#1a2d45' }} />
      </div>

      <div className="h-11 w-full rounded-xl mb-6" style={{ background: '#0d1829', border: '1px solid #1a2d45' }} />

      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1829', border: '1px solid #1a2d45' }}>
        <div className="grid grid-cols-6 px-5 py-3" style={{ borderBottom: '1px solid #0f1c2e' }}>
          {['#', 'ALUMNO', 'DNI', 'PRÁCTICAS', 'INSTRUCTOR', 'ALTA'].map(h => (
            <div key={h} className="h-3 w-16 rounded-full" style={{ background: '#0f1c2e' }} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 px-5 py-4 items-center" style={{ borderBottom: '1px solid #0f1c2e' }}>
            <div className="h-7 w-7 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded-full" style={{ background: '#1a2d45' }} />
              <div className="h-3 w-20 rounded-full" style={{ background: '#0f1c2e' }} />
            </div>
            <div className="h-3 w-24 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="h-6 w-16 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="h-6 w-24 rounded-full" style={{ background: '#1a2d45' }} />
            <div className="h-3 w-20 rounded-full" style={{ background: '#0f1c2e' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
