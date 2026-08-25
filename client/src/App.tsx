import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  database: string
  message?: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', database: 'unavailable' }))
  }, [])

  return (
    <main>
      <section className="card">
        <p className="eyebrow">CSC 425 · Fall 2026</p>
        <h1>Full-Stack Development Starter</h1>
        <p>Your React, TypeScript, Express, and PostgreSQL starter is ready for your first project.</p>
        <div className={`status ${health?.status === 'ok' ? 'ok' : ''}`}>
          <span aria-hidden="true" />
          {health ? `API: ${health.status} · Database: ${health.database}` : 'Checking the API…'}
        </div>
      </section>
    </main>
  )
}

export default App
