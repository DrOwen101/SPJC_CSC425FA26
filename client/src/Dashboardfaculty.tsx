import { useEffect, useState } from 'react'
import {   loginFaculty,  logoutFaculty,

getFacultyRosters,   checkFacultySession,
getFacultyGrades,   updateFacultyGrade, getFacultyAdvisingNotes, createFacultyAdvisingNote,
getFacultyCourses,
type FacultyRoster,   type FacultyGrade,   type FacultyCourse, type FacultyAdvisingNote,

} from './facultyApi'

function Dashboardfaculty() {
const [rosters, setRosters] = useState<FacultyRoster[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [grades, setGrades] = useState<FacultyGrade[]>([])
const [gradesLoading, setGradesLoading] = useState(true)
const [gradesError, setGradesError] = useState('')
const [selectedGrades, setSelectedGrades] = useState<Record<number, string>>({})
const [savingGradeId, setSavingGradeId] = useState<number | null>(null)
const [gradeMessage, setGradeMessage] = useState('')
const [courses, setCourses] = useState<FacultyCourse[]>([])
const [coursesLoading, setCoursesLoading] = useState(true)
const [coursesError, setCoursesError] = useState('')
const [facultyToken, setFacultyToken] = useState('')
const [isFacultyAuthenticated, setIsFacultyAuthenticated] = useState(false)
const [loginError, setLoginError] = useState('')
const [checkingSession, setCheckingSession] = useState(true)
const [advisingNotes, setAdvisingNotes] = useState<FacultyAdvisingNote[]>([])
const [advisingStudentId, setAdvisingStudentId] = useState('')
const [advisingNoteText, setAdvisingNoteText] = useState('')
const [advisingMessage, setAdvisingMessage] = useState('')


useEffect(() => {
  async function restoreSession() {
    const authenticated = await checkFacultySession()
    setIsFacultyAuthenticated(authenticated)
    setCheckingSession(false)
  }

  void restoreSession()
}, [])

  useEffect(() => {

    if (!isFacultyAuthenticated) return
    async function loadRosters() {
      try {
        const data = await getFacultyRosters()
        setRosters(data)
      } catch (err) {
        console.error('Failed to load faculty rosters:', err)
        setError('Unable to load student rosters.')
      } finally {
        setLoading(false)
      }
    }

    void loadRosters()
  }, [isFacultyAuthenticated])

  useEffect(() => {
    if (!isFacultyAuthenticated) return
  async function loadGrades() {
    try {
      const data = await getFacultyGrades()
      setGrades(data)
    } catch (err) {
      console.error('Failed to load faculty grades:', err)
      setGradesError('Unable to load student grades.')
    } finally {
      setGradesLoading(false)
    }
  }

  void loadGrades()
}, [isFacultyAuthenticated])

useEffect(() => {
  if (!isFacultyAuthenticated) return
  async function loadCourses() {
    try {
      const data = await getFacultyCourses()
      setCourses(data)
    } catch (err) {
      console.error('Failed to load faculty courses:', err)
      setCoursesError('Unable to load courses.')
    } finally {
      setCoursesLoading(false)
    }
  }

  void loadCourses()
}, [isFacultyAuthenticated])


useEffect(() => {
  if (!isFacultyAuthenticated) return

  async function loadAdvisingNotes() {
    try {
      const data = await getFacultyAdvisingNotes()
      setAdvisingNotes(data.notes)
    } catch (error) {
      console.error('Failed to load advising notes:', error)
      setAdvisingMessage('Unable to load advising notes.')
    }
  }

  loadAdvisingNotes()
}, [isFacultyAuthenticated])




if (checkingSession) {
  return (
    <main className="dashboard">
      <p role="status">Checking faculty session...</p>
    </main>
  )
}


async function handleSaveAdvisingNote() {
  const studentId = Number(advisingStudentId)
  const noteText = advisingNoteText.trim()

  if (!Number.isSafeInteger(studentId) || studentId <= 0 || !noteText) {
    setAdvisingMessage('Please enter a valid student ID and note.')
    return
  }

  if (noteText.length > 2000) {
    setAdvisingMessage('Note must be 2000 characters or fewer.')
    return
  }

  try {
    await createFacultyAdvisingNote(studentId, noteText)

    setAdvisingMessage('Advising note saved successfully!')
    setAdvisingStudentId('')
    setAdvisingNoteText('')

    const data = await getFacultyAdvisingNotes()
    setAdvisingNotes(data.notes)
  } catch (error) {
    console.error('Failed to save advising note:', error)
    setAdvisingMessage('Unable to save advising note.')
  }
}



async function handleFacultyLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setLoginError('')

  try {
    await loginFaculty(facultyToken)
    setIsFacultyAuthenticated(true)
    setFacultyToken('')
  } catch (err) {
    console.error('Faculty login failed:', err)
    setLoginError('Invalid faculty credential. Please try again.')
  }
}

async function handleFacultyLogout() {
  try {
    await logoutFaculty()
    setIsFacultyAuthenticated(false)
    setRosters([])
    setGrades([])
    setCourses([])
    setSelectedGrades({})
    setError('')
    setGradesError('')
    setCoursesError('')
    setGradeMessage('')
  } catch (err) {
    console.error('Faculty logout failed:', err)
    setGradeMessage('Unable to log out. Please try again.')
  }
}

async function handleSaveGrade(enrollmentId: number, currentGrade: string | null) {
  const newGrade = selectedGrades[enrollmentId] ?? currentGrade ?? ''

  if (!newGrade) {
    setGradeMessage('Please select a grade.')
    return
  }

  setSavingGradeId(enrollmentId)
  setGradeMessage('')

  try {
    await updateFacultyGrade(enrollmentId, newGrade)

    setGrades((previousGrades) =>
      previousGrades.map((student) =>
        student.enrollment_id === enrollmentId
          ? { ...student, grade: newGrade }
          : student
      )
    )

    setGradeMessage('Grade updated successfully.')
  } catch (err) {
    console.error('Failed to save grade:', err)
    setGradeMessage('Unable to update grade. Please try again.')
  } finally {
    setSavingGradeId(null)
  }
}

if (!isFacultyAuthenticated) {
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <p className="eyebrow">Faculty Access</p>
        <h1>Faculty Login</h1>
        <p>Enter your faculty credential to access the dashboard.</p>
      </header>

      <section className="dashboard-card">
        <form onSubmit={handleFacultyLogin}>
          <label htmlFor="faculty-token">Faculty Credential</label>

          <input
            id="faculty-token"
            type="password"
            value={facultyToken}
            onChange={(event) => setFacultyToken(event.target.value)}
            required
            autoComplete="off"
            style={{ display: 'block', margin: '12px 0' }}
          />

          <button type="submit">Login</button>

          {loginError && (
            <p role="alert">{loginError}</p>
          )}
        </form>
      </section>
    </main>
  )
}
  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <button
  type="button"
  onClick={() => void handleFacultyLogout()}
  style={{ marginTop: '12px', marginBottom: '12px' }}
>
  Logout
</button>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
   <p className="demo-note">
  Faculty Dashboard — Connected to PostgreSQL.
  Manage faculty courses, view student rosters, update grades,
  and maintain academic advising notes.
  Faculty access is protected through authentication.
</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
            <li><a href="#faculty-courses">Courses</a></li>
            <li><a href="#class-rosters">Class Rosters</a></li>
            <li><a href="#grading">Grading</a></li>
            <li><a href="#faculty-advising">Advising Notes</a></li>
            <li><a href="#faculty-alerts">Alerts</a></li>
            <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section
  id="faculty-courses"
  className="dashboard-card"
  aria-labelledby="faculty-courses-heading"
  tabIndex={-1}
>
  <h2 id="faculty-courses-heading">Courses</h2>

  {coursesLoading && <p>Loading courses...</p>}

  {coursesError && <p role="alert">{coursesError}</p>}

  {!coursesLoading && !coursesError && courses.length === 0 && (
    <p>No courses found.</p>
  )}

  {!coursesLoading && !coursesError && courses.length > 0 && (
    <ul className="detail-list">
      {courses.map((course) => (
        <li key={course.course_code}>
          <strong>{course.course_code}</strong>
          {' — '}
          {course.student_count} enrolled student(s)
        </li>
      ))}
    </ul>
  )}
</section>
        <section
  id="class-rosters"
  className="dashboard-card"
  aria-labelledby="class-rosters-heading"
  tabIndex={-1}
>
  <h2 id="class-rosters-heading">Class Rosters</h2>

  {loading && <p>Loading student rosters...</p>}

  {error && <p role="alert">{error}</p>}

  {!loading && !error && rosters.length === 0 && (
    <p>No student enrollments found.</p>
  )}

  {!loading && !error && rosters.length > 0 && (
    <ul className="detail-list">
      {rosters.map((student) => (
        <li key={student.enrollment_id}>
          <strong>
            {student.first_name} {student.last_name}
          </strong>
          {' — '}
          ID: {student.student_id}
          {' — '}
          Course: {student.course_code}
        </li>
      ))}
    </ul>
  )}
</section>

<section
  id="grading"
  className="dashboard-card"
  aria-labelledby="grading-heading"
  tabIndex={-1}
>
  <h2 id="grading-heading">Grade Management</h2>

  {gradesLoading && <p>Loading grades...</p>}

  {gradesError && <p role="alert">{gradesError}</p>}

  {!gradesLoading && !gradesError && grades.length === 0 && (
    <p>No grades found.</p>
  )}

  {!gradesLoading && !gradesError && grades.length > 0 && (
    <ul className="detail-list">
      {grades.map((student) => (
  <li key={student.enrollment_id}>
    <strong>
      {student.first_name} {student.last_name}
    </strong>

    {' — '}
    {student.course_code}

    <div style={{ marginTop: '10px' }}>
      <label htmlFor={`grade-${student.enrollment_id}`}>
        Grade:{' '}
      </label>

      <select
        id={`grade-${student.enrollment_id}`}
        value={
          selectedGrades[student.enrollment_id] ??
          student.grade ??
          ''
        }
        onChange={(event) =>
          setSelectedGrades((previous) => ({
            ...previous,
            [student.enrollment_id]: event.target.value,
          }))
        }
      >
        <option value="">Not graded</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
        <option value="F">F</option>
      </select>

      <button
        type="button"
        style={{ marginLeft: '10px' }}
        disabled={savingGradeId !== null}
        onClick={() =>
          void handleSaveGrade(
            student.enrollment_id,
            student.grade
          )
        }
      >
        {savingGradeId === student.enrollment_id
          ? 'Saving...'
          : 'Save'}
      </button>
    </div>
  </li>
))}
    </ul>
  )}
  {gradeMessage && (
  <p role="status">{gradeMessage}</p>
)}
</section>

<section
  id="faculty-advising"
  className="dashboard-card"
  aria-labelledby="faculty-advising-heading"
  tabIndex={-1}
>
  <h2 id="faculty-advising-heading">Faculty Advising Notes</h2>

  <p>Record academic advising notes for students.</p>

  <div style={{ marginBottom: '12px' }}>
    <label htmlFor="advising-student-id">Student ID</label>
    <input
      id="advising-student-id"
      type="number"
      min="1"
      value={advisingStudentId}
      onChange={(event) => setAdvisingStudentId(event.target.value)}
      style={{ display: 'block', marginTop: '6px' }}
    />
  </div>

  <div style={{ marginBottom: '12px' }}>
    <label htmlFor="advising-note-text">Advising Note</label>
    <textarea
      id="advising-note-text"
      value={advisingNoteText}
      maxLength={2000}
      onChange={(event) => setAdvisingNoteText(event.target.value)}
      rows={4}
      style={{ display: 'block', width: '100%', marginTop: '6px' }}
    />
  </div>

  <button
    type="button"
    onClick={() => void handleSaveAdvisingNote()}
  >
    Save Note
  </button>

  {advisingMessage && (
    <p role="status">{advisingMessage}</p>
  )}

  <h3>Saved Advising Notes</h3>

  {advisingNotes.length === 0 ? (
    <p>No advising notes found.</p>
  ) : (
    <ul className="detail-list">
      {advisingNotes.map((note) => (
        <li key={note.note_id}>
          <strong>
            {note.first_name} {note.last_name}
          </strong>
          {' — '}
          Student ID: {note.student_id}
          <p>{note.note_text}</p>
        </li>
      ))}
    </ul>
  )}
</section>


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
    </main>
  )
}

export default Dashboardfaculty
