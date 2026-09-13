import SPJCLogo from './assets/SPJCLogo.jpg'

function FacultyDashboard() {
  return (
    <div id="faculty-dashboard" className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            src={SPJCLogo}
            className="dashboard-logo"
            width="80"
            alt="SPJC logo"
          />

          <div>
            <h1>Faculty Dashboard</h1>
            <p className="dashboard-subtitle">University Faculty Portal</p>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses</a>
          <a href="#class-rosters">Class Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#submissions">Submissions</a>
          <a href="#faculty-alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2>Faculty Overview</h2>

          <div className="dashboard-grid">
            <article id="faculty-courses" className="dashboard-card">
              <h3>Courses</h3>
              <p>View assigned courses.</p>
            </article>

            <article id="class-rosters" className="dashboard-card">
              <h3>Class Rosters</h3>
              <p>View enrolled students.</p>
            </article>

            <article id="grading" className="dashboard-card">
              <h3>Grading</h3>
              <p>Review and update grades.</p>
            </article>

            <article id="submissions" className="dashboard-card">
              <h3>Submissions</h3>
              <p>Review student submissions.</p>
            </article>

            <article id="faculty-alerts" className="dashboard-card">
              <h3>Alerts</h3>
              <p>View faculty alerts.</p>
            </article>

            <article id="teaching-schedule" className="dashboard-card">
              <h3>Teaching Schedule</h3>
              <p>View upcoming classes.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default FacultyDashboard