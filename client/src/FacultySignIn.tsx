import { useState, type SubmitEvent } from 'react'
import { errorMessage } from './apiClient'
import { signIn, signOut, type SignedInUser } from './facultyApi'

type FacultySignInProps = {
  user: SignedInUser | null
  onChange: (user: SignedInUser | null) => void
}

// Lab 12: demo sign-in. The server checks the token on every faculty request,
// so this card only decides what the interface shows.
function FacultySignIn({ user, onChange }: FacultySignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onChange(await signIn(email, password))
      setPassword('')
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
    } finally {
      onChange(null)
      setBusy(false)
    }
  }

  return (
    <section id="faculty-sign-in" className="dashboard-card faculty-card faculty-wide" aria-labelledby="faculty-sign-in-heading" tabIndex={-1}>
      <h2 id="faculty-sign-in-heading">Sign In</h2>
      {user ? (
        <div className="faculty-row">
          <p role="status">Signed in as <strong>{user.name}</strong> ({user.role}).</p>
          <button type="button" onClick={handleSignOut} disabled={busy}>Sign out</button>
        </div>
      ) : (
        <form className="faculty-form" onSubmit={handleSignIn} noValidate>
          <p>Faculty features need a faculty account. Demo accounts are listed in server/db/README.md.</p>
          <label htmlFor="faculty-email">Email</label>
          <input id="faculty-email" type="email" autoComplete="username" value={email}
            onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="faculty-password">Password</label>
          <input id="faculty-password" type="password" autoComplete="current-password" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <button type="submit" disabled={busy}>Sign in</button>
          {error && <p className="faculty-error" role="alert">{error}</p>}
        </form>
      )}
    </section>
  )
}

export default FacultySignIn
