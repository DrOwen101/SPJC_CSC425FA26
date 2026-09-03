function DashboardAdmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#system-settings">System Settings</a>
          <a href="#user-management">User Management</a>
          <a href="#user-management">Course Management</a>
          <a href="#attendance-concerns">Attendance Concerns</a>
          <a href="#attendance-concerns">Enrollment trends</a>
          <a href="#attendance-concerns">Student Success Indicators</a>
          <a href="#attendance-concerns">Financial Summaries</a>
          <a href="#attendance-concerns">Attendance Concerns</a>
          <a href="#alerts">Alerts</a>
        </nav>
      </header>

      <main>
        <section id="System Settings">
          <h2>System Settings</h2>
          <p>You can adjust the settings here.</p>
        </section>

        <section id="User Management">
          <h2>User Management</h2>
          <p>You can create and manage users(students and faculty) here.</p>
        </section>

        <section id="Course Management">
          <h2>Course Management</h2>
          <p>You can create new courses and sections here. You can also assign instructors and view class rosters here.</p>
        </section>

        <section id="Attendance Concerns">
          <h2>Attendance Concerns</h2>
          <p>This is where students with attendance concerns show up.</p>
        </section>

        <section id="Financial Summaries">
          <h2>Financial Summaries</h2>
          <p>Studetn financial summaries can be seen here.</p>
        </section>

        <section id="Enrollment trends">
          <h2>Enrollment trends</h2>
          <p>Trends in enrollment can be seen here.</p>
        </section>

        <section id="Student Success Indicators">
          <h2>Student Success Indicators</h2>
          <p>Indicators that students are succeeding will pop up here.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>Any system alerts can be seen here.</p>
        </section>
      </main>
    </>
  )
}

export default DashboardAdmin
