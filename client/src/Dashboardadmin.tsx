function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#courses">View Courses</a>
          <a href="#sections">Create Sections</a>
          <a href="#instructors">Assign Instructors</a>
          <a href='#rosters'>View Class Rosters</a>
          <a href='#enrollment'>Manage Enrollment</a>
          <a href='#attendance'>Address Attendance Concerns</a>
          <a href='#success'>View Student Success Indicators</a>
          <a href='#finance'>View Financial Summaries</a>
        </nav>
      </header>

      <main>
        <section id="courses">
          <h2>Courses</h2>
          <p>Current courses: Math 101, Physics 101, Chemistry 101</p>
        </section>

        <section id="sections">
          <h2>Sections</h2>
          <p>Create and manage course sections.</p>
        </section>

        <section id="instructors">
          <h2>Instructors</h2>
          <p>Assign and manage instructors for courses.</p>
        </section>

        <section id="rosters">
          <h2>Class Rosters</h2>
          <p>View the class rosters for courses.</p>
        </section>

        <section id="enrollment">
          <h2>Enrollment</h2>
          <p>Manage student enrollment for your courses.</p>
        </section>

        <section id="attendance">
          <h2>Attendance</h2>
          <p>View enrollment trends</p>
        </section>

        <section id="success">
          <h2>Student Success</h2>
          <p>View student success indicators</p>
        </section>

        <section id="finance">
          <h2>Finance</h2>
          <p>View financial summaries</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardadmin
