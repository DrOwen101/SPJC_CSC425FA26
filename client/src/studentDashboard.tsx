function Dashboardstudent() {
  return (
    <>
      <header>
        <h1>Student Dashboard</h1>
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <ul>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section id="gpa">
          <h2>GPA</h2>
          <p>Current GPA: 3.75</p>
        </section>

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

export default Dashboardstudent
