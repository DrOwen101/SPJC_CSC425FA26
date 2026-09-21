function Dashboardstudent() {
  return (
    <>
      <main id="student-dashboard" className="dashboard-container">
        <header className="dashboard-header">
        <h1 className="dashboard-heading">Student Dashboard</h1>
        <p>University Student Portal</p>

        <nav className="dashboard-nav" aria-label="Student navigation">
          <a href="/src/index2.html">GPA</a>
          <a href="#attendance">Attendance</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
        </nav>
        </header>

      <div className="dashboard-sections">
        <section className="dashboard-section" id="gpa">
          <h2>GPA</h2>
          <p>Current GPA: 3.75</p>
          <p><a href="/src/index2.html">Open GPA Calculator</a></p>
        </section>

        <section className="dashboard-section" id="attendance">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </section>

        <section className="dashboard-section" id="transcript">
          <h2>Transcript</h2>
          <p>View your completed courses and grades.</p>
        </section>

        <section className="dashboard-section" id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section className="dashboard-section" id="courses">
          <h2>Upcoming Courses</h2>
          <p>View your upcoming and registered courses.</p>
        </section>
      </div>
      </main>
    </>
  )
}

export default Dashboardstudent
