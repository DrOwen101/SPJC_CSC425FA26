function DashboardFaculty() {
  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      <header className="dashboard-header">
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>
      </header>

        <nav className="dashboard-nav " aria-label="Faculty navigation">
        <ul>
          <li><a href="#class-rosters">Class Rosters</a></li>
          <li><a href="#class-attendance-faculty">Class Attendance</a></li>
          <li><a href="#grading">Grading</a></li>
          <li><a href="#submissions">Submissions</a></li>
          <li><a href="#available-classes">View Available courses</a></li>
          <li><a href="#faculty-alerts">Alerts</a></li>
        </ul>
        </nav>
      

      <div className="dashboard-grid">
        <section id="class-rosters" className="dashboard-card" aria-labelledby="class-rosters" tabIndex={-1}>
          <h2>Class Rosters</h2>
          <p className="status-label">Not connected</p>
          <p>You can see your class rosters here.</p>
        </section>

        <section id="class-attendance-faculty" className="dashboard-card" aria-labelledby="class-attendance-faculty" tabIndex={-1}>
          <h2>Class Attendance</h2>
          <p className="status-label">Not connected</p>
          <p>The attendance for each class can be viewed and edited here.</p>
        </section>

        <section id="grading" className="dashboard-card" aria-labelledby="grading" tabIndex={-1}>
          <h2>Grading</h2>
          <p className="status-label">Not connected</p>
          <p>Here you can adjust student grades, and see grade summaries.</p>
        </section>

        <section id="submissions" className="dashboard-card" aria-labelledby="submissions" tabIndex={-1}>
          <h2>Submissions</h2>
          <p className="status-label">Not connected</p>
          <p>New submissions will show up here.</p>
        </section>

        <section id="available-classes" className="dashboard-card" aria-labelledby="available-classes" tabIndex={-1}>
          <h2>View Available courses</h2>
          <p className="status-label">Not connected</p>
          <p>Courses will pop up here.</p>
        </section>

        <section id="faculty-alerts" className="dashboard-card" aria-labelledby="faculty-alerts" tabIndex={-1}>
          <h2>Alerts</h2>
          <p className="status-label">No new university alerts.</p>
          <p>No new alerts.</p>
        </section>
      </div>
    </main>
  )
}

export default DashboardFaculty