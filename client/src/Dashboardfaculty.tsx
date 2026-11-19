import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react'
import FacultyAttendance from './FacultyAttendance'
import FacultyGradeSummary from './FacultyGradeSummary'
import FacultyStudentLookup from './FacultyStudentLookup'
import RecordTable from './RecordTable'
import { createFacultyApi, facultyError, signIn, type FacultyApi, type Section, type Session } from './facultyApi'
import './FacultyDashboard.css'

function Dashboardfaculty() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const expire = useCallback(() => {
    setSession(null)
    setError('Your session ended. Sign in again to continue.')
  }, [])
  const api = useMemo(() => session ? createFacultyApi(session.token, expire) : null, [session, expire])

  async function logIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      setSession(await signIn(String(data.get('username')), String(data.get('password'))))
    } catch (error) {
      setError(facultyError(error))
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
      setError(facultyError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="faculty-dashboard" className="dashboard faculty-dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Review your assigned sections, class rosters, attendance, and grades.</p>
      </header>
      <section className="dashboard-card faculty-account" aria-label="Faculty dashboard access">
        {session ? (
          <div className="faculty-controls faculty-account-row">
            <p>Signed in as <strong>{session.user.displayName}</strong> ({session.user.role}).</p>
            <button type="button" onClick={logOut} disabled={busy}>Sign out</button>
          </div>
        ) : (
          <>
            <h2>Sign in</h2>
            <p>Use your local demo account to continue.</p>
            <form className="faculty-controls" onSubmit={logIn}>
              <label>Username<input name="username" required autoComplete="username" maxLength={64} /></label>
              <label>Password<input name="password" type="password" required autoComplete="current-password" maxLength={128} /></label>
              <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          </>
        )}
        {session?.user.role === 'student' && <p role="alert" className="field-error">Faculty access is required to view this workspace.</p>}
        {error && <p role="alert" className="field-error">{error}</p>}
      </section>
      {api && session?.user.role === 'faculty' && <FacultyWorkspace api={api} />}
    </main>
  )
}

function FacultyWorkspace({ api }: { api: FacultyApi }) {
  const [sections, setSections] = useState<Section[] | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api.sections(controller.signal)
      .then(({ sections }) => { if (!controller.signal.aborted) setSections(sections) })
      .catch((error) => { if (!controller.signal.aborted) setError(facultyError(error)) })
    return () => controller.abort()
  }, [api, retry])

  if (!sections) return (
    <section className="dashboard-card faculty-account" aria-label="Sections">
      {error ? (
        <>
          <p className="field-error" role="alert">{error}</p>
          <button type="button" onClick={() => { setError(''); setRetry(retry + 1) }}>Try again</button>
        </>
      ) : <p role="status">Loading your assigned sections…</p>}
    </section>
  )

  return (
    <>
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#teaching-schedule">Teaching schedule</a></li>
          <li><a href="#faculty-attendance">Attendance</a></li>
          <li><a href="#class-rosters">Find a student</a></li>
          <li><a href="#grading">Grade summary</a></li>
        </ul>
      </nav>
      <div className="dashboard-grid">
        <section id="teaching-schedule" className="dashboard-card faculty-card" aria-labelledby="schedule-heading" tabIndex={-1}>
          <h2 id="schedule-heading">Teaching schedule</h2>
          {sections.length === 0 ? <p>No sections are assigned to you yet.</p> : (
            <RecordTable caption="Your assigned sections" regionLabel="Weekly teaching schedule"
              columns={['Section', 'Course', 'Days', 'Time', 'Location', 'Enrolled']}>
              {sections.map((section) => (
                <tr key={section.id}>
                  <th scope="row">{section.id}</th><td>{section.title}</td><td>{section.meetingDays}</td>
                  <td>{section.startsAt}–{section.endsAt}</td><td>{section.location}</td><td>{section.studentCount}</td>
                </tr>
              ))}
            </RecordTable>
          )}
        </section>
        <FacultyAttendance api={api} sections={sections} />
        <FacultyStudentLookup api={api} />
        <FacultyGradeSummary api={api} sections={sections} />
      </div>
    </>
  )
}

export default Dashboardfaculty
