import SPJCLogo from './assets/SPJCLogo.jpg'

function StudentDashboard() {
  return (
    <>
      <header>
        <img
          src={SPJCLogo}
          width="100"
          alt="SPJC logo"
        />
        <h1>Student Dashboard</h1>
      </header>

      <main>
        <section>
          <h2>Courses</h2>

          <article>
            <h3>Upcoming Courses</h3>
            <p>Course information will appear here.</p>
          </article>
        </section>

        <section>
          <h2>Student Information</h2>

          <article>
            <h3>GPA</h3>
            <p>GPA information will appear here.</p>
          </article>

          <article>
            <h3>Attendance</h3>
            <p>Attendance information will appear here.</p>
          </article>

          <article>
            <h3>Transcript</h3>
            <p>Transcript information will appear here.</p>
          </article>

          <article>
            <h3>Alerts</h3>
            <p>Student alerts will appear here.</p>
          </article>
        </section>
      </main>
    </>
  )
}

export default StudentDashboard