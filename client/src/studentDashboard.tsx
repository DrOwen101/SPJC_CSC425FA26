function Dashboardstudent() {
  return (
    <>
      <header className="section">
        <h1>Student Dashboard</h1>
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <ul className="section-sub">
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="section" id="gpa">
          <h2 className="section-title">GPA</h2>
          <ul className="section-sub">
            <li><p>Current GPA: 3.75</p></li>
          </ul>
        </section>

        <section className="section" id="attendance">
          <h2 className="section-title">Attendance</h2>
          <ul className="section-sub">
            <li><p>Current attendance: 94%</p></li>
          </ul>
        </section>

        <section className="section" id="transcript">
          <h2 className="section-title">Transcript</h2>
          <ul className="section-sub">
            <li><p>View your completed courses and grades.</p></li>
          </ul>
        </section>

        <section className="section" id="alerts">
          <h2 className="section-title">Alerts</h2>
          <ul className="section-sub">
            <li><p>No new academic alerts.</p></li>
          </ul>
        </section>

        <section className="section" id="courses">
          <h2 className="section-title">Upcoming Courses</h2>
          <ul className="section-sub">
            <li><p>View your upcoming and registered courses.</p></li>
          </ul>
        </section>
      </main>
    </>
  )
}

export default Dashboardstudent
