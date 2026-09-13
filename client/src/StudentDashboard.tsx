import SPJCLogo from './assets/SPJCLogo.jpg'

function StudentDashboard() {
  return (
    <div id="student-dashboard" className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            src={SPJCLogo}
            className="dashboard-logo"
            width="80"
            alt="SPJC logo"
          />

          <div>
            <h1>Student Dashboard</h1>
            <p className="dashboard-subtitle">University Student Portal</p>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Student navigation">
          <a href="#gpa">GPA</a>
          <a href="#attendance">Attendance</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2>Student Overview</h2>

          <div className="dashboard-grid">
            <article id="gpa" className="dashboard-card">
              <h3>GPA</h3>
              <p className="dashboard-value">3.75</p>
              <p>Current cumulative GPA</p>
            </article>

            <article id="attendance" className="dashboard-card">
              <h3>Attendance</h3>
              <p className="dashboard-value">94%</p>
              <p>Current class attendance</p>
            </article>

            <article id="transcript" className="dashboard-card">
              <h3>Transcript</h3>
              <p>View your completed courses and grades.</p>
            </article>

            <article id="alerts" className="dashboard-card">
              <h3>Alerts</h3>
              <p>No new academic alerts.</p>
            </article>
          </div>
        </section>

        <section id="courses" className="dashboard-section">
          <h2>Upcoming Courses</h2>

          <article className="dashboard-card dashboard-wide">
            <h3>Registered Courses</h3>
            <p>View your upcoming and registered courses.</p>
          </article>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard