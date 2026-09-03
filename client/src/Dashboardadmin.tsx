function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Administration Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#user-management">User Management</a>
          <a href="#course-management">Course Management</a>
          <a href="#reports">Reports</a>
          <a href="#admin-alerts">Alerts</a>
          <a href="#system-status">System Status</a>
        </nav>
      </header>

      <main id="admin-dashboard">
        <section id="user-management">
          <h2>User management</h2>
          <p>Manage students, faculty, and other admin accounts.</p>
        </section>

        <section id="course-management">
          <h2>Course Management</h2>
          <p>Manage enrollment for students and faculty.</p>
        </section>

        <section id="reports">
          <h2>Reports</h2>
          <p>No recent reports to show.</p>
        </section>

        <section id="admin-alerts">
          <h2>Admin alerts</h2>
          <p>View upcoming alerts for admins.</p>
        </section>

        <section id="system-status">
          <h2>System status</h2>
          <p>Shows advanced system status details.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardadmin
