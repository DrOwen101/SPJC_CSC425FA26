function DashboardFaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#view courses">View Courses</a>
          <a href="#attendance tally">Attendance</a>
          <a href="#roster">Roster</a>
          <a href="#alerts">Alerts</a>
          <a href="#instructors">Instructors</a>
        </nav>
      </header>

      <main>
        <section id="view courses">
          <h2>View Courses</h2>
          <p>View your assigned courses and sections.</p>
        </section>

        <section id="attendance tally">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </section>

        <section id="roster">
          <h2>Roster</h2>
          <p>View your students and their information.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="instructors">
          <h2>Instructors</h2>
          <p>View information about your fellow instructors.</p>
        </section>
      </main>
    </>
  )
}

export default DashboardFaculty
