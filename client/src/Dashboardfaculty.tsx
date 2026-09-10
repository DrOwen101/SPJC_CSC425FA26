function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav className="navbarDash" aria-label="Faculty navigation">
          <a className="navbar-Dashlink" href="#faculty-courses">Courses</a>
          <a className="navbar-Dashlink" href="#class-rosters">Class Rosters</a>
          <a className="navbar-Dashlink" href="#grading">Grading</a>
          <a className="navbar-Dashlink" href="#faculty-alerts">Alerts</a>
          <a className="navbar-Dashlink" href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main className="topicHeader" id="faculty-dashboard">
        <section id="Courses">
          <h2>Courses</h2>
          <p>Courses you are teaching.</p>
        </section>

        <section id="Class Rosters">
          <h2>Class Rosters</h2>
          <p>View your class rosters.</p>
        </section>

        <section id="Grading">
          <h2>Grading</h2>
          <p>Manage and view your students' grades.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="Teaching Schedule">
          <h2>Teaching Schedule</h2>
          <p>View your teaching schedule and class times.</p>
        </section>
        
      </main>
    </>
  )
}

export default Dashboardfaculty
