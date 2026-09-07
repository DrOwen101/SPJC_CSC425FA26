function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#courses">Course List</a>
          <a href="#attendance">Student Attendance</a>
          <a href="#grades">Grading</a>
          <a href="#alerts">Alerts</a>
        </nav>
      </header>

      <main>
        <section id="courses">
          <h2>Course List</h2>
          <p>N/A</p>
        </section>

        <section id="attendance">
          <h2>Student Attendance</h2>
          <p>Overall attendance: 94%</p>
        </section>

        <section id="grades">
          <h2>Grading</h2>
          <p>View and update grades in your class</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
