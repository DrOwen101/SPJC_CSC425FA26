import { useEffect, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import FacultyClassRoster from './FacultyClassRoster'
import FacultyGradebook from './FacultyGradebook'
import FacultyCoursePerformance from './FacultyCoursePerformance'
import TranscriptCard from './TranscriptCard'
import { facultyApi } from './facultyApi'
import './FacultyDashboard.css'

// This role component supplies content; App.css supplies the shared layout.
function Dashboardfaculty() {
  const [authState, setAuthState] = useState<'checking' | 'signedOut' | 'signedIn' | 'unavailable'>('checking')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    facultyApi.get('/api/faculty/session')
      .then(() => setAuthState('signedIn'))
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setAuthState('signedOut')
        } else {
          setAuthMessage('Could not contact the server. Check that the backend is running.')
          setAuthState('unavailable')
        }
      })
  }, [])

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setAuthMessage('')
    try {
      await facultyApi.post('/api/faculty/login', { username, password })
      setPassword('')
      setAuthState('signedIn')
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        setAuthMessage(error.response?.data?.error || 'Could not sign in. Check the server connection.')
      } else {
        setAuthMessage('Could not sign in. Check the server connection.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setAuthMessage('')
    try {
      await facultyApi.post('/api/faculty/logout')
      setAuthState('signedOut')
    } catch {
      setAuthMessage('Could not sign out. Please try again.')
    }
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
      </header>

      {authState !== 'signedIn' && (
        <section className="dashboard-card faculty-login" aria-labelledby="faculty-login-heading">
          <h2 id="faculty-login-heading">Faculty sign in</h2>
          {authState === 'checking' && <p role="status">Checking your faculty session…</p>}
          {authState === 'unavailable' && (
            <p role="alert">{authMessage}</p>
          )}
          {authState === 'signedOut' && (
            <form onSubmit={handleLogin}>
              <label htmlFor="faculty-username">Username</label>
              <input
                id="faculty-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
              <label htmlFor="faculty-password">Password</label>
              <input
                id="faculty-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
              {authMessage && <p role="alert">{authMessage}</p>}
              <p className="faculty-login-note">Local demo credentials: faculty / password</p>
            </form>
          )}
          {authState === 'unavailable' && (
            <button type="button" onClick={() => window.location.reload()}>Try again</button>
          )}
        </section>
      )}

      {authState === 'signedIn' && (
        <>
          <div className="faculty-session-bar">
            <p>Signed in to the local demo faculty account.</p>
            <button type="button" onClick={() => void handleLogout()}>Sign out</button>
          </div>
      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
            <li><a href="#faculty-courses">Courses</a></li>
            <li><a href="#class-rosters">Class Rosters</a></li>
            <li><a href="#grading">Grading</a></li>
            <li><a href="#faculty-progress">Student Progress</a></li>
            <li><a href="#faculty-performance">Course Performance</a></li>
            <li><a href="#faculty-alerts">Alerts</a></li>
            <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="faculty-courses" className="dashboard-card" aria-labelledby="faculty-courses-heading" tabIndex={-1}>
          <h2 id="faculty-courses-heading">Courses</h2>
          <p className="status-label">Not connected</p>
          <p>Your assigned courses and sections will appear here.</p>
          <ul className="detail-list">
            <li>Course name and section</li>
            <li>Enrollment and course materials</li>
          </ul>
        </section>
        <FacultyClassRoster />
        <FacultyGradebook />
        <TranscriptCard id="faculty-progress" facultyMode />
        <FacultyCoursePerformance />
        <section id="faculty-alerts" className="dashboard-card" aria-labelledby="faculty-alerts-heading" tabIndex={-1}>
          <h2 id="faculty-alerts-heading">Alerts</h2>
          <p className="status-label">Live alerts unavailable</p>
          <p>Teaching reminders, schedule changes, and department announcements will appear here when notifications are connected.</p>
        </section>
        <section id="teaching-schedule" className="dashboard-card" aria-labelledby="teaching-schedule-heading" tabIndex={-1}>
          <h2 id="teaching-schedule-heading">Teaching Schedule</h2>
          <p className="status-label">Not connected</p>
          <p>Class meetings and office hours will appear here.</p>
          <ul className="detail-list">
            <li>Day, time, and room or online location</li>
            <li>Office hours and student appointments</li>
          </ul>
        </section>
      </div>
        </>
      )}
    </main>
  )
}

export default Dashboardfaculty
