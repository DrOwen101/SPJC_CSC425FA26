function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#gpa">GPA</a>
          <a href="#attendance">Attendance</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
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

export default Dashboardadmin