'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0e1a', color: 'white', fontFamily: 'system-ui', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{error?.message || 'An unexpected error occurred'}</p>
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error?.digest && `Error ID: ${error.digest}`}</p>
          <button onClick={reset} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
