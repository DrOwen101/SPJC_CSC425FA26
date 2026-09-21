import { useMemo, useState } from 'react'

const GRADE_POINTS: Record<string, number> = {
  'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
}

type Course = { id: number; grade: string; credits: number }

let nextCourseId = 1

// Live GPA calculator
function GpaCalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { id: nextCourseId++, grade: 'A', credits: 3 },
    { id: nextCourseId++, grade: 'B+', credits: 3 },
  ])

  function addCourse() {
    setCourses(prev => [...prev, { id: nextCourseId++, grade: 'A', credits: 3 }])
  }

  function removeCourse(id: number) {
    setCourses(prev => prev.filter(course => course.id !== id))
  }

  function updateCourse(id: number, field: 'grade' | 'credits', value: string) {
    setCourses(prev => prev.map(course => {
      if (course.id !== id) return course
      return field === 'credits'
        ? { ...course, credits: Math.max(0, Number(value) || 0) }
        : { ...course, grade: value }
    }))
  }

  const { gpa, totalCredits } = useMemo(() => {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)
    const totalPoints = courses.reduce((sum, course) => sum + GRADE_POINTS[course.grade] * course.credits, 0)
    return { gpa: totalCredits > 0 ? totalPoints / totalCredits : 0, totalCredits }
  }, [courses])

  let alertMessage = 'Add at least one course to calculate a GPA.'
  let alertClass = 'gpa-alert gpa-alert-neutral'
  if (totalCredits > 0) {
    if (gpa < 2.0) {
      alertMessage = 'Academic warning: GPA is below 2.0. Meet with an advisor.'
      alertClass = 'gpa-alert gpa-alert-danger'
    } else if (gpa < 3.5) {
      alertMessage = 'Good standing: GPA meets progress requirements.'
      alertClass = 'gpa-alert gpa-alert-ok'
    } else {
      alertMessage = "Dean's List eligible: GPA is 3.5 or higher!"
      alertClass = 'gpa-alert gpa-alert-good'
    }
  }

  return (
    <div className="gpa-calculator">
      <p className="metric">{gpa.toFixed(2)}</p>
      <p>Live GPA · {totalCredits} credit{totalCredits === 1 ? '' : 's'} entered</p>
      <div role="status" className={alertClass}>{alertMessage}</div>

      <table className="gpa-table">
        <thead>
          <tr>
            <th scope="col">Course grade</th>
            <th scope="col">Credit hours</th>
            <th scope="col"><span className="visually-hidden">Remove</span></th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.id}>
              <td>
                <label>
                  <span className="visually-hidden">Grade</span>
                  <select
                    value={course.grade}
                    onChange={e => updateCourse(course.id, 'grade', e.target.value)}
                  >
                    {Object.keys(GRADE_POINTS).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </label>
              </td>
              <td>
                <label>
                  <span className="visually-hidden">Credit hours</span>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={course.credits}
                    onChange={e => updateCourse(course.id, 'credits', e.target.value)}
                  />
                </label>
              </td>
              <td>
                <button
                  type="button"
                  className="gpa-remove-btn"
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length === 1}
                  aria-label="Remove course"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="gpa-add-btn" onClick={addCourse}>+ Add course</button>
    </div>
  )
}

// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function Dashboardstudent() {
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
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* Each subsection uses native details behavior for keyboard-accessible dropdowns. */}
      <div className="dashboard-grid">
        <details id="gpa" className="dashboard-card" open>
          <summary>GPA Calculator</summary>
          <GpaCalculator />
        </details>
        <details id="attendance" className="dashboard-card">
          <summary>Attendance</summary>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
        </details>
        <details id="transcript" className="dashboard-card">
          <summary>Transcript</summary>
          <p className="status-label">Not connected</p>
          <p>Completed courses, credit hours, and final grades will appear here when academic records are connected.</p>
        </details>
        <details id="alerts" className="dashboard-card">
          <summary>Alerts</summary>
          <p className="status-label">Sample status: no new academic alerts</p>
          <p>Check here for academic reminders and notices. Live alerts are not connected.</p>
        </details>
        <details id="courses" className="dashboard-card">
          <summary>Upcoming Courses</summary>
          <p className="status-label">Not connected</p>
          <p>Your registered courses, meeting times, and locations will appear here when registration data is connected.</p>
        </details>
      </div>
    </main>
  )
}

export default Dashboardstudent
