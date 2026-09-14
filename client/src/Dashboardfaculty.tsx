function Dashboardfaculty() {
  return (
    <>
      <main id="faculty-dashboard" className="dashboard-container">
        <header className="dashboard-header">
        <h1 className="dashboard-heading">Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav className="dashboard-nav" aria-label="Faculty navigation">
          <a href="#courses">Courses</a>
          <a href="#rosters">Class Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#alerts">Alerts</a>
          <a href="#schedule">Teaching Schedule</a>
        </nav>
        </header>

      <div className="dashboard-sections">
        <section className="dashboard-section" id="courses">
          <h2>My Courses</h2>
        </section>

        <section className="dashboard-section" id="rosters">
          <h2>Class Rosters</h2>
        </section>

        <section className="dashboard-section" id="grading">
          <h2>Grading</h2>
        </section>

        <section className="dashboard-section" id="alerts">
          <h2>Alerts</h2>
        </section>

        <section className="dashboard-section" id="schedule">
          <h2>Teaching Schedule</h2>
        </section>
      </div>
      </main>
    </>
  )
}

export default Dashboardfaculty
