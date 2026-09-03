function FacultyDashboard() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>SPJC Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#courses">Classes</a>
          <a href="#class_roster">Class Roster</a>
          <a href="#attendance">Attendance</a>
          <a href="#grades">Grades</a>
          <a href="#attendance_concerns">Attendance Concerns</a>
        </nav>
      </header>

      <main>
        <section id="courses">
          <h2>My Courses</h2>
          <p>View the courses you are currently teaching.</p>
        </section>

        <section id="class_roster">
          <h2>Class Roster</h2>
          <p>View the students enrolled in your classes.</p>
        </section>

        <section id="attendance">
          <h2>Attendance</h2>
          <p>Record attendance and view student attendance history.</p>
        </section>

        <section id="grades">
          <h2>Grades</h2>
          <p>Enter, update, and view student grades.</p>
        </section>

        <section id="attendance_concerns">
          <h2>Attendance Concerns</h2>
          <p>View students who may have too many absences.</p>
        </section>
      </main>
    </>
  )
}

export default FacultyDashboard