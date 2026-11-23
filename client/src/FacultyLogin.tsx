import { useState, type FormEvent } from 'react'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

function FacultyLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post<{ role: string }>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/auth/login`,
        { username, password },
        { withCredentials: true },
      )
      setPassword('')

      if (response.data.role !== 'faculty') {
        setError('This account is not a faculty account.')
        return
      }
      onLogin()
    } catch {
      setError('Unable to log in. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="dashboard-card">
      <h2>Faculty login</h2>
      <label htmlFor="faculty-username">Username</label>
      <input id="faculty-username" value={username}
        onChange={(event) => setUsername(event.target.value)} required />

      <label htmlFor="faculty-password">Password</label>
      <input id="faculty-password" type="password" value={password}
        onChange={(event) => setPassword(event.target.value)} required />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}

export default FacultyLogin