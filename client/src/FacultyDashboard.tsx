import SPJCLogo from './assets/SPJCLogo.jpg'

function FacultyDashboard() {
  return (
    <>
      <header>
        <img
          src={SPJCLogo}
          width="100"
          alt="SPJC logo"
        />

        <h1>Faculty Dashboard</h1>
      </header>

      <main>
        <section>
          <h2>Courses</h2>

          <article>
            <h3>Class Rosters</h3>
            <p>Faculty class rosters will appear here.</p>
          </article>

          <article>
            <h3>Grading</h3>
            <p>Student grading information will appear here.</p>
          </article>

          <article>
            <h3>Submissions</h3>
            <p>Student submissions will appear here.</p>
          </article>
        </section>
      </main>
    </>
  )
}

export default FacultyDashboard