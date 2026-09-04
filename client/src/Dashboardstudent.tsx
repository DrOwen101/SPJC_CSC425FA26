import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardstudent() {
  return (
    <>
      <header>
        <div className="dashboard-title">
          <h1>Student Dashboard</h1>
          <img className="dashboard-logo" src={SPJCLogo} alt="SPJC logo" />
        </div>
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
        <article id="gpa">
          <h2>GPA</h2>
          <p>Current GPA: 3.75</p>
        </article>

        <article id="attendance">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </article>

        <article id="transcript">
          <h2>Transcript</h2>
          <p>View your completed courses and grades.</p>
        </article>

        <article id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </article>

        <article id="courses">
          <h2>Upcoming Courses</h2>
          <p>View your upcoming and registered courses.</p>
        </article>
      </main>
    </>
  )
}

export default Dashboardstudent
