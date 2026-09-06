'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ background: '#0a0e1a', color: 'white', fontFamily: 'system-ui', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{error?.message || 'An unexpected error occurred'}</p>
        <button onClick={reset} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}>
          Try Again
        </button>
      </div>
    </div>
  )
}
