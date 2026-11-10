import { useState, type SubmitEvent } from 'react'
import axios from 'axios'
import WeatherCard from './WeatherCard'
import StudentLookup from './StudentLookup'
import TranscriptCard from './TranscriptCard'

// Each letter grade maps to its value on a standard 4.0 GPA scale.
const gradePoints: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0,
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

type AttendanceRecord = {
  id: number
  studentID: string
  student: string
  date: string
  status: 'present' | 'absent' | 'late'
}

// This role component supplies content; App.css supplies the shared layout.
// Student lookup and transcript data come from the Express/PostgreSQL API.
function Dashboardstudent() {
  const [gradeEntry, setGradeEntry] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [gpa, setGpa] = useState<number | null>(null)
  const [gradeError, setGradeError] = useState('')
  const [attendanceForm, setAttendanceForm] = useState({
    studentID: '1001',
    date: '2026-11-09',
    status: 'present' as AttendanceRecord['status'],
  })
  const [savedAttendance, setSavedAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceError, setAttendanceError] = useState('')
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [deleteAttendanceID, setDeleteAttendanceID] = useState('6')
  const [deletedAttendance, setDeletedAttendance] = useState<AttendanceRecord | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingAttendance, setIsDeletingAttendance] = useState(false)

  function addGrade(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    // Removing spaces and capitalizing lets entries such as "b +" become "B+".
    const newGrade = gradeEntry.trim().toUpperCase().replaceAll(' ', '')

    if (!(newGrade in gradePoints)) {
      setGradeError('Enter a valid letter grade from A+ through F.')
      return
    }

    setGrades([...grades, newGrade])
    setGradeEntry('')
    setGradeError('')
    setGpa(null)
  }

  function calculateGpa() {
    const totalPoints = grades.reduce((total, grade) => total + gradePoints[grade], 0)
    setGpa(totalPoints / grades.length)
  }

  async function saveAttendance(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttendanceError('')
    setSavedAttendance(null)
    setIsSavingAttendance(true)

    try {
      const response = await axios.post<AttendanceRecord>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/attendance`,
        attendanceForm,
        { timeout: 15000 },
      )
      setSavedAttendance(response.data)
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setAttendanceError(
          error.response?.data?.message
            || (error.response
              ? `Saving attendance failed (HTTP ${error.response.status}).`
              : 'Unable to reach the student API. Check that the server is running.'),
        )
      } else {
        setAttendanceError('Unable to save the attendance record.')
      }
    } finally {
      setIsSavingAttendance(false)
    }
  }

  async function deleteAttendance(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeleteError('')
    setDeletedAttendance(null)
    setIsDeletingAttendance(true)

    const recordID = deleteAttendanceID.trim()
    if (!/^[1-9]\d*$/.test(recordID)) {
      setDeleteError('Enter a positive attendance record ID.')
      setIsDeletingAttendance(false)
      return
    }

    try {
      const deleteResponse = await axios.delete<AttendanceRecord>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/attendance/${recordID}`,
        { timeout: 15000 },
      )
      setDeletedAttendance(deleteResponse.data)
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setDeleteError(
          error.response?.data?.message
            || (error.response
              ? `Deleting attendance failed (HTTP ${error.response.status}).`
              : 'Unable to reach the student API. Check that the server is running.'),
        )
      } else {
        setDeleteError('Unable to delete the attendance record.')
      }
    } finally {
      setIsDeletingAttendance(false)
    }
  }

  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#student-lookup">Student lookup</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        {/* StudentLookup contains the Lab 7 form, request, state, and result.
            The dashboard imports and places it like any other React component. */}
        <StudentLookup />
        <WeatherCard />
        <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Record attendance</h2>
          <p>Save a student attendance entry to PostgreSQL through the Express API.</p>
          <form className="gpa-form" onSubmit={saveAttendance}>
            <label htmlFor="attendance-student-id">Student ID</label>
            <div className="gpa-entry-row">
              <input
                id="attendance-student-id"
                name="studentID"
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={attendanceForm.studentID}
                onChange={(event) => setAttendanceForm({ ...attendanceForm, studentID: event.target.value })}
                required
              />
            </div>
            <label htmlFor="attendance-date">Date</label>
            <div className="gpa-entry-row">
              <input
                id="attendance-date"
                name="date"
                type="date"
                value={attendanceForm.date}
                onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })}
                required
              />
            </div>
            <label htmlFor="attendance-status">Status</label>
            <div className="gpa-entry-row">
              <select
                id="attendance-status"
                name="status"
                value={attendanceForm.status}
                onChange={(event) => {
                  const status = event.target.value
                  if (status === 'present' || status === 'absent' || status === 'late') {
                    setAttendanceForm({ ...attendanceForm, status })
                  }
                }}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
              <button type="submit" disabled={isSavingAttendance}>
                {isSavingAttendance ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
          </form>
          {attendanceError && <p className="field-error" role="alert">{attendanceError}</p>}
          {savedAttendance && (
            <p className="status-label" role="status">
              Saved in PostgreSQL: record #{savedAttendance.id}, {savedAttendance.student} ({savedAttendance.studentID}),
              {` ${savedAttendance.date} · ${savedAttendance.status}`}
            </p>
          )}
          <form className="gpa-form" onSubmit={deleteAttendance}>
            <label htmlFor="delete-attendance-id">Delete attendance record by ID</label>
            <div className="gpa-entry-row">
              <input
                id="delete-attendance-id"
                name="recordID"
                type="number"
                min="1"
                step="1"
                value={deleteAttendanceID}
                onChange={(event) => setDeleteAttendanceID(event.target.value)}
                required
              />
              <button type="submit" disabled={isDeletingAttendance}>
                {isDeletingAttendance ? 'Deleting…' : 'Delete record'}
              </button>
            </div>
          </form>
          {deleteError && <p className="field-error" role="alert">{deleteError}</p>}
          {deletedAttendance && (
            <p className="status-label" role="status">
              Deleted record #{deletedAttendance.id}: {deletedAttendance.student} ({deletedAttendance.studentID}),
              {` ${deletedAttendance.date} · ${deletedAttendance.status}`}
            </p>
          )}
        </section>
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <p id="gpa-value" className="metric" aria-live="polite">
            {gpa === null ? '--' : gpa.toFixed(2)}
          </p>
          <p>Calculated GPA · equal weight per grade</p>

          <form className="gpa-form" onSubmit={addGrade} noValidate>
            <label htmlFor="grade-entry">Enter a letter grade</label>
            <div className="gpa-entry-row">
              <input
                id="grade-entry"
                name="grade"
                type="text"
                value={gradeEntry}
                onChange={(event) => setGradeEntry(event.target.value)}
                placeholder="A-"
                maxLength={3}
                autoComplete="off"
                aria-describedby={gradeError ? 'grade-help grade-error' : 'grade-help'}
                aria-invalid={gradeError ? true : undefined}
              />
              <button type="submit">Add Grade</button>
            </div>
            <p id="grade-help" className="field-help">Accepted grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, and F.</p>
            {gradeError && <p id="grade-error" className="field-error" role="alert">{gradeError}</p>}
          </form>

          <div className="grade-list-area">
            <h3>Grades entered</h3>
            {grades.length === 0 ? (
              <p>No grades entered yet.</p>
            ) : (
              <ol className="grade-list">
                {grades.map((grade, index) => (
                  <li key={`${grade}-${index}`}>
                    <span>{grade}</span>
                    <span>{gradePoints[grade].toFixed(1)} points</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <button className="calculate-button" type="button" onClick={calculateGpa} disabled={grades.length === 0}>
            Calculate GPA
          </button>
        </section>
        <TranscriptCard id="transcript" />
        <section id="alerts" className="dashboard-card" aria-labelledby="alerts-heading" tabIndex={-1}>
          <h2 id="alerts-heading">Alerts</h2>
          <p className="status-label">Sample status: no new academic alerts</p>
          <p>Check here for academic reminders and notices. Live alerts are not connected.</p>
        </section>
        <section id="courses" className="dashboard-card" aria-labelledby="courses-heading" tabIndex={-1}>
          <h2 id="courses-heading">Upcoming Courses</h2>
          <p className="status-label">Not connected</p>
          <p>Your registered courses, meeting times, and locations will appear here when registration data is connected.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboardstudent
