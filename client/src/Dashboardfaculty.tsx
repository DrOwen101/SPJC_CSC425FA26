function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#courses">View Courses</a>
          <a href='#attendance'>Record Attendance</a>
          <a href="#grades">Submit Grades</a>
          <a href="#sections">Create Sections</a>
          <a href="#instructors">Assign Instructors</a>
          <a href='#rosters'>View Class Rosters</a>
        </nav>
      </header>

      <main>
        <section id="courses">
          <h2>Courses</h2>
          <p>Current courses: Math 101, Physics 101, Chemistry 101</p>
        </section>

        <section id="attendance">
          <h2>Attendance</h2>
          <p>Current attendance Student 1: 94%</p>
        </section>

        <section id="grades">
          <h2>Grades</h2>
          <p>View grades for Student 1.</p>
        </section>

        <section id="sections">
          <h2>Sections</h2>
          <p>Create and manage course sections.</p>
        </section>

        <section id="instructors">
          <h2>Instructors</h2>
          <p>Assign and manage instructors for your courses.</p>
        </section>

        <section id="rosters">
          <h2>Class Rosters</h2>
          <p>View the class rosters for your courses.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
