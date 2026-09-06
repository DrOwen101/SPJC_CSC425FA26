import SPJCLogo from './assets/SPJCLogo.jpg'

function FacultyDashboard() {
  return (
    <>
      <header>
        <section aria-label="SPJC branding">
          <img src={SPJCLogo} width="100" alt="SPJC logo" />
        </section>

        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses</a>
          <a href="#class-rosters">Class Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#submissions">Submissions</a>
          <a href="#faculty-alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        <section id="faculty-courses">
          <h2>Courses</h2>
          <p>View assigned courses.</p>
        </section>

        <article id="class-rosters">
          <h2>Class Rosters</h2>
          <p>View enrolled students.</p>
        </article>

        <article id="grading">
          <h2>Grading</h2>
          <p>Review and update grades.</p>
        </article>

        <article id="submissions">
          <h2>Submissions</h2>
          <p>Review student submissions.</p>
        </article>

        <article id="faculty-alerts">
          <h2>Alerts</h2>
          <p>View faculty alerts.</p>
        </article>

        <article id="teaching-schedule">
          <h2>Teaching Schedule</h2>
          <p>View upcoming classes.</p>
        </article>
      </main>
    </>
  )
}

export default FacultyDashboard