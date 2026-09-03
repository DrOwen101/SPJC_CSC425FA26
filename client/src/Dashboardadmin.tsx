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
          <h2>User Management</h2>
          <p>Manage student, faculty, and administrator accounts.</p>
        </section>

        <section id="course-management">
          <h2>Course Management</h2>
          <p>Manage courses, sections, and enrollment.</p>
        </section>

        <section id="reports">
          <h2>Reports</h2>
          <p>View academic and administrative reports.</p>
        </section>

        <section id="admin-alerts">
          <h2>Alerts</h2>
          <p>No new administrative alerts.</p>
        </section>

        <section id="system-status">
          <h2>System Status</h2>
          <p>Review portal services and system activity.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardadmin
