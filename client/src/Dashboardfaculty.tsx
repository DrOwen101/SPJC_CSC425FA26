import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`
const facultySessionKey = 'spjc-faculty-session'

type Assignment = {
  id: number
  courseCode: string
  courseTitle: string
  section: string
  meetingDay: string
  meetingTime: string
  location: string
  facultyName: string
}

type RosterStudent = {
  studentID: string
  student: string
  major: string
  attendanceID: number | null
  status: 'present' | 'absent' | 'late'
}

type AdvisingNote = {
  id: number
  studentID: string
  student: string
  note: string
  status: 'open' | 'completed'
  createdAt: string
}

type GradeSubmission = {
  id: number
  studentID: string
  student: string
  courseCode: string
  grade: string
  feedback: string
  status: string
  createdAt: string
}

function Dashboardfaculty() {
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem(facultySessionKey) || '')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [rosterDate, setRosterDate] = useState('2026-11-09')
  const [advising, setAdvising] = useState<AdvisingNote[]>([])
  const [grades, setGrades] = useState<GradeSubmission[]>([])
  const [error, setError] = useState('')
  const [advisingForm, setAdvisingForm] = useState({ studentID: '1001', note: '' })
  const [gradeForm, setGradeForm] = useState({ studentID: '1001', courseCode: 'CS101', grade: 'A', feedback: '' })
  const facultyHeaders = useMemo(
    () => ({ Authorization: `Bearer ${sessionToken}` }),
    [sessionToken],
  )

  async function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoggingIn(true)
    try {
      const result = await axios.post<{ token: string }>(
        `${apiBaseUrl}/api/faculty/login`,
        loginForm,
      )
      sessionStorage.setItem(facultySessionKey, result.data.token)
      setSessionToken(result.data.token)
      setLoginForm({ username: '', password: '' })
    } catch (requestError) {
      setError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Unable to log in.'
        : 'Unable to log in.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function logout() {
    try {
      await axios.post(`${apiBaseUrl}/api/faculty/logout`, {}, { headers: facultyHeaders })
    } finally {
      sessionStorage.removeItem(facultySessionKey)
      setSessionToken('')
    }
  }

  const loadFacultyData = useCallback(async () => {
    setError('')
    try {
      const [assignmentResult, advisingResult, gradeResult] = await Promise.all([
        axios.get<Assignment[]>(`${apiBaseUrl}/api/faculty/assignments`, { headers: facultyHeaders }),
        axios.get<AdvisingNote[]>(`${apiBaseUrl}/api/faculty/advising`, { headers: facultyHeaders }),
        axios.get<GradeSubmission[]>(`${apiBaseUrl}/api/faculty/grading`, { headers: facultyHeaders }),
      ])
      setAssignments(assignmentResult.data)
      setAdvising(advisingResult.data)
      setGrades(gradeResult.data)
    } catch (requestError) {
      setError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Unable to load faculty records.'
        : 'Unable to load faculty records.')
    }
  }, [facultyHeaders])

  const loadRoster = useCallback(async (date = rosterDate) => {
    setError('')
    try {
      const result = await axios.get<RosterStudent[]>(
        `${apiBaseUrl}/api/faculty/roster`,
        { params: { date }, headers: facultyHeaders },
      )
      setRoster(result.data)
    } catch (requestError) {
      setError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Unable to load the class roster.'
        : 'Unable to load the class roster.')
    }
  }, [rosterDate, facultyHeaders])

  useEffect(() => {
    if (sessionToken) void loadFacultyData()
  }, [loadFacultyData, sessionToken])

  useEffect(() => {
    if (sessionToken) void loadRoster()
  }, [loadRoster, sessionToken])

  async function saveAdvising(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await axios.post(`${apiBaseUrl}/api/faculty/advising`, advisingForm, { headers: facultyHeaders })
      setAdvisingForm({ ...advisingForm, note: '' })
      await loadFacultyData()
    } catch (requestError) {
      setError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Unable to save the advising note.'
        : 'Unable to save the advising note.')
    }
  }

  async function completeAdvising(id: number) {
    try {
      await axios.patch(`${apiBaseUrl}/api/faculty/advising/${id}`, { status: 'completed' }, { headers: facultyHeaders })
      await loadFacultyData()
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to update the note.' : 'Unable to update the note.')
    }
  }

  async function saveGrade(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await axios.post(`${apiBaseUrl}/api/faculty/grading`, gradeForm, { headers: facultyHeaders })
      setGradeForm({ ...gradeForm, feedback: '' })
      await loadFacultyData()
    } catch (requestError) {
      setError(axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Unable to submit the grade.'
        : 'Unable to submit the grade.')
    }
  }

  async function updateAttendance(studentID: string, status: RosterStudent['status']) {
    try {
      await axios.post(`${apiBaseUrl}/api/faculty/roster`, { studentID, date: rosterDate, status }, { headers: facultyHeaders })
      await loadRoster(rosterDate)
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to save attendance.' : 'Unable to save attendance.')
    }
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Manage advising, assignments, roster attendance, and grade feedback.</p>
      </header>

      {!sessionToken ? (
        <section className="dashboard-card" aria-labelledby="faculty-login-heading">
          <h2 id="faculty-login-heading">Faculty login</h2>
          <p>Sign in with a faculty account to access this dashboard.</p>
          {error && <p className="field-error" role="alert">{error}</p>}
          <form className="gpa-form" onSubmit={login}>
            <label htmlFor="faculty-username">Username</label>
            <input
              id="faculty-username"
              name="username"
              autoComplete="username"
              value={loginForm.username}
              onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
              required
            />
            <label htmlFor="faculty-password">Password</label>
            <input
              id="faculty-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
            <button className="calculate-button" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in…' : 'Log in'}
            </button>
          </form>
        </section>
      ) : (
        <>
      <button type="button" className="calculate-button faculty-logout-button" onClick={logout}>Log out</button>
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#faculty-courses">Teaching assignments</a></li>
          <li><a href="#class-rosters">Class roster</a></li>
          <li><a href="#grading">Grade review</a></li>
          <li><a href="#faculty-advising">Advising</a></li>
        </ul>
      </nav>

      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="dashboard-grid">
        <section id="faculty-courses" className="dashboard-card" aria-labelledby="faculty-courses-heading" tabIndex={-1}>
          <h2 id="faculty-courses-heading">Teaching assignments</h2>
          <p>Repurposed from the student Upcoming Courses module: this view shows faculty-owned sections and meeting details.</p>
          {assignments.map((assignment) => (
            <div key={assignment.id}>
              <h3>{assignment.courseCode} · {assignment.section}</h3>
              <p>{assignment.courseTitle}<br />{assignment.meetingDay}, {assignment.meetingTime} · {assignment.location}</p>
            </div>
          ))}
        </section>

        <section id="class-rosters" className="dashboard-card" aria-labelledby="class-rosters-heading" tabIndex={-1}>
          <h2 id="class-rosters-heading">Class roster attendance</h2>
          <p>Repurposed from the student Attendance module: update attendance for an entire class roster.</p>
          <form className="gpa-form" onSubmit={(event) => { event.preventDefault(); void loadRoster(rosterDate) }}>
            <label htmlFor="roster-date">Attendance date</label>
            <div className="gpa-entry-row">
              <input id="roster-date" type="date" value={rosterDate} onChange={(event) => setRosterDate(event.target.value)} />
              <button type="submit">Load roster</button>
            </div>
          </form>
          {roster.map((student) => (
            <div className="gpa-entry-row" key={student.studentID} style={{ marginTop: '.75rem' }}>
              <span style={{ flex: '1 1 12rem' }}>{student.student} ({student.studentID})</span>
              <select aria-label={`Attendance for ${student.student}`} value={student.status} onChange={(event) => updateAttendance(student.studentID, event.target.value as RosterStudent['status'])}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          ))}
        </section>

        <section id="grading" className="dashboard-card" aria-labelledby="grading-heading" tabIndex={-1}>
          <h2 id="grading-heading">Grade review</h2>
          <p>Record a course grade and student feedback.</p>
          <form className="gpa-form" onSubmit={saveGrade}>
            <label htmlFor="grade-student">Student ID</label>
            <input id="grade-student" value={gradeForm.studentID} onChange={(event) => setGradeForm({ ...gradeForm, studentID: event.target.value })} />
            <label htmlFor="grade-course">Course code</label>
            <input id="grade-course" value={gradeForm.courseCode} onChange={(event) => setGradeForm({ ...gradeForm, courseCode: event.target.value })} />
            <label htmlFor="grade-value">Grade</label>
            <select id="grade-value" value={gradeForm.grade} onChange={(event) => setGradeForm({ ...gradeForm, grade: event.target.value })}>
              {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'].map((grade) => <option key={grade}>{grade}</option>)}
            </select>
            <label htmlFor="grade-feedback">Feedback</label>
            <textarea id="grade-feedback" value={gradeForm.feedback} onChange={(event) => setGradeForm({ ...gradeForm, feedback: event.target.value })} />
            <button className="calculate-button" type="submit">Submit grade</button>
          </form>
          {grades.map((item) => <p key={item.id}><strong>{item.student}</strong> · {item.courseCode}: {item.grade}<br />{item.feedback || 'No feedback added.'}</p>)}
        </section>

        <section id="faculty-advising" className="dashboard-card" aria-labelledby="faculty-advising-heading" tabIndex={-1}>
          <h2 id="faculty-advising-heading">Student advising workflow</h2>
          <p>Create a follow-up note for a student and track whether advising is complete.</p>
          <form className="gpa-form" onSubmit={saveAdvising}>
            <label htmlFor="advising-student">Student ID</label>
            <input id="advising-student" value={advisingForm.studentID} onChange={(event) => setAdvisingForm({ ...advisingForm, studentID: event.target.value })} />
            <label htmlFor="advising-note">Advising note</label>
            <textarea id="advising-note" value={advisingForm.note} onChange={(event) => setAdvisingForm({ ...advisingForm, note: event.target.value })} required />
            <button className="calculate-button" type="submit">Save advising note</button>
          </form>
          {advising.map((note) => (
            <div key={note.id}>
              <p><strong>{note.student}</strong> · {note.status}<br />{note.note}</p>
              {note.status === 'open' && <button type="button" onClick={() => completeAdvising(note.id)}>Mark completed</button>}
            </div>
          ))}
        </section>
      </div>
        </>
      )}
    </main>
  )
}

export default Dashboardfaculty
