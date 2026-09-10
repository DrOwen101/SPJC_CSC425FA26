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

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="faculty-courses" className="dashboard-card" aria-labelledby="faculty-courses-heading" tabIndex={-1}>
          <h2 id="faculty-courses-heading">Courses</h2>
          <p className="status-label">Not connected</p>
          <p>Your assigned courses and sections will appear here.</p>
          <ul className="detail-list">
            <li>Course name and section</li>
            <li>Enrollment and course materials</li>
          </ul>
        </section>
        <section id="class-rosters" className="dashboard-card" aria-labelledby="class-rosters-heading" tabIndex={-1}>
          <h2 id="class-rosters-heading">Class Rosters</h2>
          <p className="status-label">Not connected</p>
          <p>Student lists will appear here when enrollment records are available.</p>
          <ul className="detail-list">
            <li>Students organized by course and section</li>
            <li>Attendance records for each class</li>
          </ul>
        </section>
        <section id="grading" className="dashboard-card" aria-labelledby="grading-heading" tabIndex={-1}>
          <h2 id="grading-heading">Grading</h2>
          <p className="status-label">Not connected</p>
          <p>Assignments awaiting review and grade submission deadlines will appear here.</p>
          <ul className="detail-list">
            <li>Submissions to review</li>
            <li>Grades and student feedback</li>
          </ul>
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
