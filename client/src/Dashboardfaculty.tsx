/** Faculty-only dashboard, using the existing SPJC layout and session API. */
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import FacultyRoster from './FacultyRoster'
import { FacultyAttendance, FacultyGrades, FacultySummary } from './FacultyFeatures'

const API = 'http://localhost:3000/api'
type FacultyUser = { id: number; email: string; role: string; facultyId: number }
type FacultySection = {
  id: number; course_id: number; course_code: string; course_name: string
  semester: string; section_code: string
}

function Dashboardfaculty() {
  const [user, setUser] = useState<FacultyUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [sections, setSections] = useState<FacultySection[]>([])
  const [sectionId, setSectionId] = useState<number | null>(null)
  const [sectionsError, setSectionsError] = useState('')
  const [gradesVersion, setGradesVersion] = useState(0)

  useEffect(() => {
    let active = true
    axios.get<{ user: FacultyUser }>(`${API}/auth/me`, { withCredentials: true })
      .then(({ data }) => {
        if (!active) return
        if (data.user.role === 'faculty') setUser(data.user)
        else setLoginError('Faculty access is required for this dashboard.')
      }).catch(() => {})
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    axios.get<{ sections: FacultySection[] }>(`${API}/faculty/sections`, { withCredentials: true })
      .then(({ data }) => {
        if (!active) return
        setSections(data.sections)
        setSectionId(data.sections[0]?.id ?? null)
        setSectionsError('')
      }).catch(() => {
        if (active) setSectionsError('Unable to load assigned sections.')
      })
    return () => { active = false }
  }, [user])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    try {
      const { data } = await axios.post<{ user: FacultyUser }>(
        `${API}/auth/login`, { email, password }, { withCredentials: true },
      )
      setPassword('')
      if (data.user.role === 'faculty') setUser(data.user)
      else setLoginError('This account is not a faculty account.')
    } catch {
      setPassword('')
      setLoginError('Unable to log in. Check your email and password.')
    }
  }

  async function logout() {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true })
      setUser(null)
      setSections([])
      setSectionId(null)
      setLoginError('')
    } catch {
      setSectionsError('Unable to log out. Please try again.')
    }
  }

  if (checking) {
    return <main id="faculty-dashboard" className="dashboard" tabIndex={-1}><p>Checking faculty session...</p></main>
  }

  if (!user) {
    return (
      <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
        <header className="dashboard-header">
          <h1 id="faculty-title">Faculty Login</h1>
          <p>Sign in with an authorized faculty account to manage teaching records.</p>
        </header>
        <section className="dashboard-card" aria-labelledby="faculty-login-heading">
          <h2 id="faculty-login-heading">Sign in</h2>
          <form onSubmit={login}>
            <label htmlFor="faculty-email">Email</label>{' '}
            <input id="faculty-email" type="email" required value={email}
              onChange={(event) => setEmail(event.target.value)} />{' '}
            <label htmlFor="faculty-password">Password</label>{' '}
            <input id="faculty-password" type="password" required value={password}
              onChange={(event) => setPassword(event.target.value)} />{' '}
            <button type="submit">Log in</button>
          </form>
          {loginError && <p className="field-error" role="alert">{loginError}</p>}
        </section>
      </main>
    )
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Manage class rosters, attendance, assessments, and grade summaries.</p>
        <p>Signed in as {user.email}</p>
        <button type="button" onClick={logout}>Log out</button>
      </header>
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#faculty-courses">Assigned Section</a></li>
          <li><a href="#class-rosters">Class Roster</a></li>
          <li><a href="#attendance-entry">Attendance</a></li>
          <li><a href="#grading">Grade Entry</a></li>
          <li><a href="#grade-summary">Grade Summary</a></li>
        </ul>
      </nav>
      <div className="dashboard-grid">
        <section id="faculty-courses" className="dashboard-card" tabIndex={-1}
          aria-labelledby="faculty-courses-heading">
          <h2 id="faculty-courses-heading">Assigned Section</h2>
          <label htmlFor="faculty-section">Course / section</label>{' '}
          <select id="faculty-section" value={sectionId ?? ''}
            onChange={(event) => setSectionId(event.target.value ? Number(event.target.value) : null)}>
            {sections.length === 0 && <option value="">No assigned sections</option>}
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.course_code} — {section.course_name}, Section {section.section_code} ({section.semester})
              </option>
            ))}
          </select>
          {sectionsError && <p className="field-error" role="alert">{sectionsError}</p>}
        </section>
        <FacultyRoster sectionId={sectionId} />
        <FacultyAttendance sectionId={sectionId} />
        <FacultyGrades sectionId={sectionId} onSaved={() => setGradesVersion((n) => n + 1)} />
        <FacultySummary sectionId={sectionId} refreshKey={gradesVersion} />
      </div>
    </main>
  )
}

export default Dashboardfaculty
