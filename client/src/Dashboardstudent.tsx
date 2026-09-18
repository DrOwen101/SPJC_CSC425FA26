// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
import { useState } from 'react'
function Dashboardstudent() {
  const [grades, setGrades] = useState<string[]>([])
  const [gpa, setGpa] = useState<number | null>(null)
  const gradePoints: Record<string, number> = {
    'A+': 4,
    A: 4,
    'A-': 3.7,
    'B+': 3.3,
    B: 3,
    'B-': 2.7,
    'C+': 2.3,
    C: 2,
    'C-': 1.7,
    'D+': 1.3,
    D: 1,
    'D-': 0.7,
    F: 0,
  }

  function addGrade(grade: string) {
    setGrades([...grades, grade])
    setGpa(null) // Reset GPA when a new grade is added
  }

  function calculateGPA() {
    if (grades.length === 0) {
      setGpa(null)
      return
    }

    const total = grades.reduce((sum, currentGrade) => {
      return sum + gradePoints[currentGrade]
    }, 0)
    setGpa(total / grades.length)
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
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <div className="current-gpa">
            <p className="current-gpa-label">Current GPA</p>
            <p className="metric">3.25</p>
            <p className="current-gpa-note">Sample value</p>
          </div>
          <div className="gpa-calculator">
            <div className="grade-buttons" aria-label="Select a grade">
              {Object.keys(gradePoints).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => addGrade(grade)}
                  aria-label={`Add grade ${grade}`}
                >
                  {grade}
                </button>
              ))}
            </div>
            <div className="grades-entered">
              <p>Grades entered:</p>
              {grades.length === 0 ? (
                <p>None</p>
              ) : (
                <ul>
                  {grades.map((grade, index) => (
                    <li key={`${grade}-${index}`}>
                      {grade}: {gradePoints[grade]} points
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="gpa-actions">
              <button type="button" onClick={calculateGPA}>
                Calculate GPA
              </button>
              <button type="button" onClick={() => {
                setGrades([])
                setGpa(null)
              }}>
                Reset
              </button>
            </div>
            {gpa !== null && (
              <p className="gpa-result">
                Calculated GPA: <strong>{gpa.toFixed(2)}</strong>
              </p>
            )}
            {gpa !== null && gpa < 2 && (
              <p className="gpa-warning" role="alert">
                <strong>WARNING: Your GPA is below 2.0.</strong>
                <span> Please consult your academic advisor for support and guidance.</span>
              </p>
            )}
            {gpa !== null && gpa >= 2.0 && (
              <p className="gpa-good-standing" role="status">
                <strong>GPA is in good standing.</strong>
              </p>
            )}
          </div>
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
