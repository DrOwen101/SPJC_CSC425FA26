function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses</a>
          <a href="#class-rosters">Class Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#faculty-alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        <section id="faculty-courses">
          <h2>Courses</h2>
          <p>View courses</p>
        </section>

        <section id="class-rosters">
          <h2>Class Rosters</h2>
          <p>View Class Rosters</p>
        </section>
        
        <section id="grading">
          <h2>Grading</h2>
          <p>Manage Grades</p>
        </section>

        <section id="faculty-alerts">
          <h2>Alerts</h2>
          <p>View Alerts</p>
        </section>

        <section id="teaching-schedule">
          <h2>Teaching Schedule</h2>
          <p>View teaching Schedule</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
