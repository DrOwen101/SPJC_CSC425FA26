function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
            <ol>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
            </ol>
        </nav>
      </header>

      <main>

        <section id="studentattendance">
          <h2>Student Attendance</h2>
          <p>Enter attendance information for each student below:</p>
          <p>Lorem Ipsum</p>
        </section>

        <section id="coursemanagement">
          <h2>Course Management</h2>
          <p>Manage your courses and their details.</p>
        </section>

        <section id="createalerts">
          <h2>Create Alerts</h2>
          <p>Create and manage academic alerts.</p>
        </section>

        <section id="grademanagement">
          <h2>Grade Management</h2>
          <p>Manage and view student grades.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardfaculty
