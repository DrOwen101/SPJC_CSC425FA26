import SPJCLogo from './assets/SPJCLogo.jpg'

function StudentDashboard() {
  return (
    <div id="student-dashboard" className="dashboard-page">
      <header>
        <section aria-label="SPJC branding">
          <img src={SPJCLogo} width="100" alt="SPJC logo" />
        </section>

        <h1>Student Dashboard</h1>
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <a href="#gpa">GPA</a>
          <a href="#attendance">Attendance</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
        </nav>
      </header>

      <main>
        <section aria-labelledby="student-overview-heading">
          <h2 id="student-overview-heading">Student Overview</h2>

          <article id="gpa">
            <h3>GPA</h3>
            <p>Current GPA: 3.75</p>
          </article>

          <article id="attendance">
            <h3>Attendance</h3>
            <p>Current attendance: 94%</p>
          </article>

          <article id="transcript">
            <h3>Transcript</h3>
            <p>View your completed courses and grades.</p>
          </article>

          <article id="alerts">
            <h3>Alerts</h3>
            <p>No new academic alerts.</p>
          </article>
        </section>

        <section id="courses">
          <h2>Upcoming Courses</h2>

          <article>
            <h3>Registered Courses</h3>
            <p>View your upcoming and registered courses.</p>
          </article>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard