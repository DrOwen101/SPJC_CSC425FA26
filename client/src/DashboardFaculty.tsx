function DashboardFaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#class-rosters">Class Rosters</a>
          <a href="#class-attendance">Class Attendance</a>
          <a href="#grading">Grading</a>
          <a href="#submissions">Submissions</a>
          <a href="#submissions">View Available courses</a>
          <a href="#alerts">Alerts</a>
        </nav>
      </header>

      <main>
        <section id="Class Rosters">
          <h2>Class Rosters</h2>
          <p>You can see your class rosters here.</p>
        </section>

        <section id="Class Attendance">
          <h2>Class Attendance</h2>
          <p>The attendance for each class can be viewed and edited here.</p>
        </section>

        <section id="Grading">
          <h2>Grading</h2>
          <p>Here you can adjust student grades, and see grade summaries.</p>
        </section>

        <section id="Submissions">
          <h2>Submissions</h2>
          <p>New submissions will show up here.</p>
        </section>

        <section id="View Available courses">
          <h2>View Available courses</h2>
          <p>Courses will pop up here.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new alerts.</p>
        </section>
      </main>
    </>
  )
}

export default DashboardFaculty
