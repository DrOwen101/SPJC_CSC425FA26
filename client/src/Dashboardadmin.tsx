function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav aria-label="Admin navigation">
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
        <section id="enrollementapplications">
          <h2>Enrollment Applications</h2>
          <p>Review and manage student enrollment applications.</p>
        </section>

        <section id="adminfinancialaid">
          <h2>Financial Aid</h2>
          <p>Manage and review student financial aid applications.</p>
        </section>

        <section id="coursemanagement">
          <h2>Course Management</h2>
          <p>Manage and view course information.</p>
        </section>

        <section id="createalerts">
          <h2>Create Alerts</h2>
          <p>Add new alerts for students and faculty.</p>
        </section>

        <section id="tuitionmanagement">
          <h2>Tuition Management</h2>
          <p>Manage and view tuition information.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardadmin
