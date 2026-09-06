function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>

        <nav className="dashboard-nav" aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses</a>
          <a href="#course-rosters">Course Rosters</a>
          <a href="#grading">Grading</a>
          <a href="#faculty-alerts">Alerts</a>
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        <section>
          <article id="faculty-courses">
            <h4>Courses</h4>
            <p>View and manage courses, including course materials (modules, assets, files), assignments, and announcements.</p>
          </article>
          <article id="course-rosters">
            <h4>Course Rosters</h4>
            <p>Access and manage student rosters for courses</p>
          </article>
          <article id="grading">
            <h4>Grading</h4>
            <p>Submit grades, view grade stats, and manage grading policies.</p>
          </article>
          <article id="faculty-alerts">
            <h4>Alerts</h4>
            <p>Receive notifications related to courses and students.</p>
          </article>
          <article id="teaching-schedule">
            <h4>Teaching Schedule</h4>
            <p>View teaching schedule and metadata like location and time.</p>
          </article>
       </section>    
      </main>
    </>
  )
}

export default Dashboardfaculty
