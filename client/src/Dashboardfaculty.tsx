function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#courses">Courses</a>
          <a href="#rosters">Class Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#alerts">Alerts</a>
          <a href="#schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        <section id="courses">
          <h2>My Courses</h2>
        </section>

        <section id="rosters">
          <h2>Class Rosters</h2>
        </section>

        <section id="grading">
          <h2>Grading</h2>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
        </section>

        <section id="schedule">
          <h2>Teaching Schedule</h2>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
