function FacultyDashboard() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Student navigation">
          <a href="#courses">Courses</a>
          <a href="#class-rosters">Class Rosters</a>
          <a href="#grades">Grades</a>
          <a href="#alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main>

        <section id="courses">
          <h2>Courses</h2>
          <p>View your courses list.</p>
        </section>

        <section id="class-rosters">
          <h2>Class Rosters</h2>
          <p>No students in your class at this time.</p>
        </section>

        <section id="grades">
          <h2>Grades</h2>
          <p>View and input grades.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="teaching-schedule">
          <h2>Teaching Schedule</h2>
          <p>View your schedule.</p>
        </section>
      </main>
    </>
  )
}

export default FacultyDashboard