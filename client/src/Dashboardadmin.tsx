import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react'
import AdminReports from './AdminReports'
import { AssignInstructorForm, NewSectionForm } from './AdminSectionForms'
import { adminSignIn, createAdminApi, type AdminApi, type AdminSection, type Instructor } from './adminApi'
import { dashboardError, type Session } from './facultyApi'
import './FacultyDashboard.css'

function Dashboardadmin() {
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const expire = useCallback(() => {
    setSession(null)
    setError('Your session ended. Sign in again to continue.')
  }, [])
  const api = useMemo(() => session ? createAdminApi(session.token, expire) : null, [session, expire])

  async function logIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      setSession(await adminSignIn(String(fields.get('username')), String(fields.get('password'))))
    } catch (error) {
      setError(dashboardError(error))
    } finally {
      setBusy(false)
    }
  }

  async function logOut() {
    setBusy(true)
    setError('')
    try {
      await api?.signOut()
      setSession(null)
    } catch (error) {
      setError(dashboardError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="admin-dashboard" className="dashboard faculty-dashboard" aria-labelledby="admin-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Administration workspace</p>
        <h1 id="admin-title">Admin Dashboard</h1>
        <p>Manage class sections and review attendance concerns.</p>
      </header>
      <section className="dashboard-card faculty-account" aria-label="Admin dashboard access">
        {session ? (
          <div className="faculty-controls faculty-account-row">
            <p>Signed in as <strong>{session.user.displayName}</strong> ({session.user.role}).</p>
            <button type="button" onClick={logOut} disabled={busy}>Sign out</button>
          </div>
        ) : (
          <form className="faculty-controls" onSubmit={logIn}>
            <label>Username<input name="username" required autoComplete="username" maxLength={64} /></label>
            <label>Password<input name="password" type="password" required autoComplete="current-password" maxLength={128} /></label>
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        )}
        {session && session.user.role !== 'admin' && (
          <p className="field-error" role="alert">Administrator access is required to view this workspace.</p>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </section>
      {api && session?.user.role === 'admin' && <AdminWorkspace api={api} />}
    </main>
  )
}

function AdminWorkspace({ api }: { api: AdminApi }) {
  const [setup, setSetup] = useState<{ instructors: Instructor[]; sections: AdminSection[] } | null>(null)
  const [version, setVersion] = useState(0)
  const [error, setError] = useState('')
  const refresh = () => { setError(''); setVersion((value) => value + 1) }

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([api.instructors(controller.signal), api.sections('', controller.signal)])
      .then(([{ instructors }, { sections }]) => {
        if (!controller.signal.aborted) setSetup({ instructors, sections })
      })
      .catch((error) => { if (!controller.signal.aborted) setError(dashboardError(error)) })
    return () => controller.abort()
  }, [api, version])

  return (
    <>
      {error && <p className="field-error" role="alert">{error} <button onClick={refresh}>Try again</button></p>}
      {!setup && !error && <p role="status">Loading sections and faculty…</p>}
      {setup && (
        <>
          <nav className="dashboard-nav" aria-label="Admin sections"><ul>
            <li><a href="#course-management">Create section</a></li>
            <li><a href="#instructor-assignment">Assign instructor</a></li>
            <li><a href="#course-directory">Section directory</a></li>
            <li><a href="#reports">Attendance concerns</a></li>
          </ul></nav>
          <div className="dashboard-grid">
            <NewSectionForm api={api} instructors={setup.instructors} onSaved={refresh} />
            <AssignInstructorForm api={api} instructors={setup.instructors} sections={setup.sections} onSaved={refresh} />
            <AdminReports api={api} version={version} />
          </div>
        </>
      )}
    </>
  )
}

export default Dashboardadmin
