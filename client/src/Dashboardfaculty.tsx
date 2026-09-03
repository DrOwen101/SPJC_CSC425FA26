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
          <p>View your managed courses.</p>
        </section>

        <section id="class-rosters">
          <h2>Class Rosters</h2>
          <p>View students enrolled in your courses.</p>
        </section>

        <section id="grading">
          <h2>Grading</h2>
          <p>Manage student grades.</p>
        </section>

        <section id="faculty-alerts">
          <h2>Faculty alerts</h2>
          <p>View upcoming notifications for faculty.</p>
        </section>

        <section id="teaching-schedule">
          <h2>Teaching Schedule</h2>
          <p>View your schedule on a day-to-day basis.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
