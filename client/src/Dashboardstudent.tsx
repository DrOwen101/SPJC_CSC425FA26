import { useState } from 'react'

// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function Dashboardstudent() {
  const [grades, setGrades] = useState<number[]>([92, 88, 95])
  const [inputValue, setInputValue] = useState('')

  const gpaValue = grades.length
    ? (grades.reduce((total, grade) => total + grade, 0) / grades.length / 25).toFixed(2)
    : '0.00'

  const handleAddGrade = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const grade = Number.parseInt(inputValue, 10)

    if (!Number.isInteger(grade) || grade < 0 || grade > 100) {
      setInputValue('')
      return
    }

    setGrades((currentGrades) => [...currentGrades, grade])
    setInputValue('')
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
          <p className="metric">{gpaValue}</p>
          <p>Current GPA · calculated from recorded grades</p>

          <form className="gpa-form" onSubmit={handleAddGrade}>
            <label htmlFor="gpa-grade-input">Add course grade</label>
            <div className="gpa-input-row">
              {/* input grades */}
              <input
                id="gpa-grade-input"
                type="number"
                className="gpa-input"
                min="0"
                max="100"
                step="1"
                inputMode="numeric"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Enter grade"
                aria-label="Enter a grade. Grades must be whole numbers between 0 and 100."
              />
              <button type="submit" className="gpa-button">Add grade</button>
            </div>
          </form>

          <p className="gpa-recorded-label">Recorded grades:</p>
          <ul className="gpa-grade-list">
            {grades.map((grade, index) => (
              <li key={`${grade}-${index}`}>{grade}</li>
            ))}
          </ul>
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
