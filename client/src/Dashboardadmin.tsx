function Dashboardadmin() {
  return (
    <>
      <main id="admin-dashboard" className="dashboard-container">
        <header className="dashboard-header">
        <h1 className="dashboard-heading">Admin Dashboard</h1>
        <p>University Administration Portal</p>

        <nav className="dashboard-nav" aria-label="Admin navigation">
          <a href="#users">User Management</a>
          <a href="#courses">Course Management</a>
          <a href="#reports">Reports</a>
          <a href="#alerts">Alerts</a>
          <a href="#status">System Status</a>
        </nav>
        </header>

      <div className="dashboard-sections">
        <section className="dashboard-section" id="users">
          <h2>User Management</h2>
          <p>View and manage student, faculty, and staff accounts.</p>
        </section>

        <section className="dashboard-section" id="courses">
          <h2>Course Management</h2>
          <p>View courses, create sections, and assign instructors.</p>
        </section>

        <section className="dashboard-section" id="reports">
          <h2>Reports</h2>
          <p>View enrollment, attendance, and student success reports.</p>
        </section>

        <section className="dashboard-section" id="alerts">
          <h2>Alerts</h2>
          <p>View important administrative alerts and notifications.</p>
        </section>

        <section className="dashboard-section" id="status">
          <h2>System Status</h2>
          <p>Check the current status of the school management system.</p>
        </section>

        <section className="dashboard-section">
          <h2>Administrative Articles</h2>

          <article className="dashboard-card">
            <h3>Enrollment Update</h3>
            <p>Review current enrollment information and trends.</p>
          </article>

          <article className="dashboard-card">
            <h3>Student Success</h3>
            <p>Review attendance concerns and student success information.</p>
          </article>
        </section>
      </div>
      </main>
    </>
  )
}

export default Dashboardadmin
