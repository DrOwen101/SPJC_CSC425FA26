import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'

// struct to hold our course information
type CourseGrade = {
  id: number
  course: string
  grade: Grade
  credits: number
}

const gradePoints: Record<Grade, number> = {
  'A+': 4,
  A: 4,
  'A-': 3.7,
  'B+': 3.3,
  B: 3,
  'B-': 2.7,
  'C+': 2.3,
  C: 2,
  'C-': 1.7,
  D: 1,
  F: 0,
}

const gradeOptions = Object.keys(gradePoints) as Grade[]


function Dashboardstudent() {
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([])
  const [course, setCourse] = useState('')
  const [grade, setGrade] = useState<Grade>('A')
  const [credits, setCredits] = useState('3')
  const [error, setError] = useState('')

  const gpa = useMemo(() => {
    const totalCredits = courseGrades.reduce((total, item) => total + item.credits, 0)
    if (totalCredits === 0) return '0.00'
    const qualityPoints = courseGrades.reduce(
      (total, item) => total + gradePoints[item.grade] * item.credits,
      0,
    )
    return (qualityPoints / totalCredits).toFixed(2)
  }, [courseGrades])

  function addGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const creditHours = Number(credits)

    // input sanitization and validation
    if (!course.trim()) {
      setError('Enter a course name.')
      return
    }
    if (!Number.isInteger(creditHours) || creditHours < 1 || creditHours > 6) {
      setError('Credit hours must be a whole number from 1 to 6.')
      return
    }

    setCourseGrades((current) => [
      ...current,
      { id: Date.now(), course: course.trim(), grade, credits: creditHours },
    ])
    setCourse('')
    setCredits('3')
    setError('')
  }

  function removeGrade(id: number) {
    // take the current list of grades and filter out the one with the matching id
    setCourseGrades((current) => current.filter((item) => item.id !== id))
  }
  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
        <p className="demo-note">Course project preview. GPA and attendance are sample values; other records are not connected.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
          <li><a href="#grades">Grades</a></li>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="grades" className="dashboard-card" aria-labelledby="grades-heading" tabIndex={-1}>
          <h2 id="grades-heading">Grades</h2>
          <div className="grades-list">
            <form id="grade-form" className="grade-form" aria-label="Add a course grade" onSubmit={addGrade}>
              <label className="course-label" htmlFor="courseInput">Course</label>
              <input id="courseInput" name="course" value={course} onChange={(event) => setCourse(event.target.value)} placeholder="CSC 425" />
              <label className="grade-label" htmlFor="gradeInput">Grade</label>
              <select id="gradeInput" name="grade" value={grade} onChange={(event) => setGrade(event.target.value as Grade)}>
                {gradeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <label className="credits-label" htmlFor="creditsInput">Credits</label>
              <input id="creditsInput" name="credits" type="number" min="1" max="6" step="1" value={credits} onChange={(event) => setCredits(event.target.value)} />
              <button type="submit">Add grade</button>
            </form>
            {error && <p className="form-error" role="alert">{error}</p>}
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Credits</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {courseGrades.length === 0 ? (
                  <tr><td colSpan={4}>Add a course to begin calculating your GPA.</td></tr>
                ) : courseGrades.map((item) => (
                  <tr key={item.id}>
                    <td>{item.course}</td>
                    <td>{item.grade}</td>
                    <td>{item.credits}</td>
                    <td><button type="button" className="remove-grade" onClick={() => removeGrade(item.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <p className="metric" aria-live="polite">{gpa}</p>
          <p>Calculated GPA from {courseGrades.length} {courseGrades.length === 1 ? 'course' : 'courses'}</p>
        </section>
        <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Attendance</h2>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
        </section>
        <section id="transcript" className="dashboard-card" aria-labelledby="transcript-heading" tabIndex={-1}>
          <h2 id="transcript-heading">Transcript</h2>
          <p className="status-label">Not connected</p>
          <p>Completed courses, credit hours, and final grades will appear here when academic records are connected.</p>
        </section>
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
