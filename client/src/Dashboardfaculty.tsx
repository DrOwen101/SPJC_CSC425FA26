// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function Dashboardfaculty() {
  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
        <p className="demo-note">Course project preview. Live records and management actions are not connected yet.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
            <li><a href="#faculty-courses">Courses</a></li>
            <li><a href="#class-rosters">Class Rosters</a></li>
            <li><a href="#grading">Grading</a></li>
            <li><a href="#faculty-alerts">Alerts</a></li>
            <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      {/* Each subsection uses native details behavior for keyboard-accessible dropdowns. */}
      <div className="dashboard-grid">
        <details id="faculty-courses" className="dashboard-card">
          <summary>Courses</summary>
          <p className="status-label">Not connected</p>
          <p>Your assigned courses and sections will appear here.</p>
          <ul className="detail-list">
            <li>Course name and section</li>
            <li>Enrollment and course materials</li>
          </ul>
        </details>
        <details id="class-rosters" className="dashboard-card">
          <summary>Class Rosters</summary>
          <p className="status-label">Not connected</p>
          <p>Student lists will appear here when enrollment records are available.</p>
          <ul className="detail-list">
            <li>Students organized by course and section</li>
            <li>Attendance records for each class</li>
          </ul>
        </details>
        <details id="grading" className="dashboard-card">
          <summary>Grading</summary>
          <p className="status-label">Not connected</p>
          <p>Assignments awaiting review and grade submission deadlines will appear here.</p>
          <ul className="detail-list">
            <li>Submissions to review</li>
            <li>Grades and student feedback</li>
          </ul>
        </details>
        <details id="faculty-alerts" className="dashboard-card">
          <summary>Alerts</summary>
          <p className="status-label">Live alerts unavailable</p>
          <p>Teaching reminders, schedule changes, and department announcements will appear here when notifications are connected.</p>
        </details>
        <details id="teaching-schedule" className="dashboard-card">
          <summary>Teaching Schedule</summary>
          <p className="status-label">Not connected</p>
          <p>Class meetings and office hours will appear here.</p>
          <ul className="detail-list">
            <li>Day, time, and room or online location</li>
            <li>Office hours and student appointments</li>
          </ul>
        </details>
      </div>
    </main>
  )
}

export default Dashboardfaculty
