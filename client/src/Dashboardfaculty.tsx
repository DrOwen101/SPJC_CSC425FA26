import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { attendanceApi, type AttendanceRecord } from './attendanceApi'
import { isStudentsResponse, normalizeName, type Student } from './studentLookupApi'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  timeout: 10000,
})

type Course = { code: string; title: string; meetingTime: string; room: string }
type GradingTask = {
  id: number
  courseCode: string
  assignment: string
  studentName: string
  reviewedAt: string | null
}
type CourseRecords = { code: string; roster: Student[]; attendance: AttendanceRecord[] }

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || fallback
  }
  return fallback
}

function Dashboardfaculty() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState<{ username: string; password: string } | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [tasks, setTasks] = useState<GradingTask[]>([])
  const [courseCode, setCourseCode] = useState('')
  const [records, setRecords] = useState<CourseRecords | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadCourse(code: string, credentials: NonNullable<typeof auth>) {
    const path = `/api/faculty/courses/${encodeURIComponent(code)}`
    const [roster, attendance] = await Promise.all([
      api.get<unknown>(`${path}/roster`, { auth: credentials }),
      attendanceApi.get<AttendanceRecord[]>(`${path}/attendance`, { auth: credentials }),
    ])

    if (!isStudentsResponse(roster.data)) throw new Error('Invalid roster response')
    setRecords({ code, roster: roster.data.students, attendance: attendance.data })
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const credentials = { username: 'faculty', password }

    try {
      const [schedule, grading] = await Promise.all([
        api.get<Course[]>('/api/faculty/schedule', { auth: credentials }),
        api.get<GradingTask[]>('/api/faculty/grading', { auth: credentials }),
      ])
      setCourses(schedule.data)
      setTasks(grading.data)
      setCourseCode(schedule.data[0]?.code ?? '')
      setAuth(credentials)
      if (schedule.data[0]) await loadCourse(schedule.data[0].code, credentials)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to load the Faculty Dashboard.'))
    } finally {
      setPassword('')
      setBusy(false)
    }
  }

  function signOut() {
    setAuth(null)
    setCourses([])
    setTasks([])
    setRecords(null)
    setCourseCode('')
    setSearch('')
    setError('')
    setMessage('')
  }

  async function selectCourse(code: string) {
    if (!auth) return
    setCourseCode(code)
    setRecords(null)
    setSearch('')
    setError('')
    setMessage('')
    setBusy(true)

    try {
      await loadCourse(code, auth)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to load course records.'))
    } finally {
      setBusy(false)
    }
  }

  async function markReviewed(id: number) {
    if (!auth) return
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const result = await api.put<{ reviewedAt: string }>(
        `/api/faculty/grading/${id}/review`, null, { auth },
      )
      setTasks(current => current.map(task =>
        task.id === id ? { ...task, reviewedAt: result.data.reviewedAt } : task,
      ))
      setMessage('Assignment marked reviewed.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update the grading task.'))
    } finally {
      setBusy(false)
    }
  }

  const visibleRoster = records?.roster.filter(student =>
    normalizeName(`${student.firstName} ${student.lastName}`).includes(normalizeName(search)),
  )

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <h1 id="faculty-title">Faculty Dashboard</h1>
      </header>
      {error && <p role="alert">{error}</p>}
      {!auth ? (
        <form className="dashboard-card faculty-form" onSubmit={signIn}>
          <label htmlFor="faculty-password">Faculty demo password</label>
          <input id="faculty-password" type="password" required autoComplete="current-password"
            value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      ) : (
        <>
          <button type="button" onClick={signOut} disabled={busy}>Sign out</button>
          <nav className="dashboard-nav" aria-label="Faculty sections">
            <ul>
              <li><a href="#teaching-schedule">Teaching Schedule</a></li>
              <li><a href="#class-rosters">Class Roster</a></li>
              <li><a href="#faculty-attendance">Class Attendance</a></li>
              <li><a href="#grading">Grading Review</a></li>
            </ul>
          </nav>

          <div className="dashboard-grid">
            <section id="teaching-schedule" className="dashboard-card" tabIndex={-1}>
              <h2>Teaching Schedule</h2>
              {courses.length ? (
                <ul className="detail-list">
                  {courses.map(course => (
                    <li key={course.code}>
                      <strong>{course.code} · {course.title}</strong>
                      <div>{course.meetingTime} · {course.room}</div>
                    </li>
                  ))}
                </ul>
              ) : <p>No teaching assignments.</p>}
            </section>

            <section id="class-rosters" className="dashboard-card" tabIndex={-1}>
              <h2>Class Roster</h2>
              {courses.length > 0 && (
                <div className="faculty-form">
                  <label htmlFor="faculty-course">Course for roster and attendance</label>
                  <select id="faculty-course" value={courseCode} disabled={busy}
                    onChange={event => void selectCourse(event.target.value)}>
                    {courses.map(course => <option key={course.code} value={course.code}>{course.code}</option>)}
                  </select>
                  <label htmlFor="faculty-roster-search">Search the roster by name</label>
                  <input id="faculty-roster-search" value={search} disabled={!records}
                    onChange={event => setSearch(event.target.value)} />
                </div>
              )}
              {visibleRoster?.length ? (
                <ul className="detail-list">
                  {visibleRoster.map(student => (
                    <li key={student.studentID}>
                      {student.firstName} {student.lastName} · {student.major}
                    </li>
                  ))}
                </ul>
              ) : <p>{records ? 'No matching students.' : 'No roster loaded.'}</p>}
              {!records && courseCode && !busy && (
                <button type="button" onClick={() => void selectCourse(courseCode)}>Retry loading course</button>
              )}
            </section>

            <section id="faculty-attendance" className="dashboard-card" tabIndex={-1}>
              <h2>Class Attendance{records && ` · ${records.code}`}</h2>
              {records?.attendance.length ? (
                <ul className="detail-list">
                  {records.attendance.map(record => (
                    <li key={record.id}>{record.date} · {record.studentName} · {record.status}</li>
                  ))}
                </ul>
              ) : <p>{records ? 'No attendance records for this course.' : 'No course attendance loaded.'}</p>}
            </section>

            <section id="grading" className="dashboard-card" tabIndex={-1}>
              <h2>Grading Review</h2>
              {message && <p role="status">{message}</p>}
              {tasks.length ? (
                <ul className="detail-list">
                  {tasks.map(task => (
                    <li key={task.id}>
                      <div>{task.courseCode} · {task.assignment} · {task.studentName}</div>
                      {task.reviewedAt ? <strong>Reviewed</strong> : (
                        <button type="button" disabled={busy} onClick={() => void markReviewed(task.id)}
                          aria-label={`Mark reviewed: ${task.assignment}`}>Mark reviewed</button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : <p>No grading tasks.</p>}
            </section>
          </div>
        </>
      )}
    </main>
  )
}

export default Dashboardfaculty
