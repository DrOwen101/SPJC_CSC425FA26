function FacultyDashboard() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <a href="#courses">Courses</a>
          <a href="#class-rosters">Class Rosters</a>
          <a href="#grades">Grades</a>
          <a href="#alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main>

        <section id="attendance">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </section>

        <section id="transcript">
          <h2>Transcript</h2>
          <p>View your completed courses and grades.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="courses">
          <h2>Upcoming Courses</h2>
          <p>View your upcoming and registered courses.</p>
        </section>
      </main>
    </>
  )
}

export default FacultyDashboard