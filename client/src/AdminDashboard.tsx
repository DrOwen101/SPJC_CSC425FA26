import SPJCLogo from './assets/SPJCLogo.jpg'

function AdminDashboard() {
  return (
    <div id="admin-dashboard" className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            src={SPJCLogo}
            className="dashboard-logo"
            width="80"
            alt="SPJC logo"
          />

          <div>
            <h1>Admin Dashboard</h1>
            <p className="dashboard-subtitle">
              University Administration Portal
            </p>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Admin navigation">
          <a href="#user-management">User Management</a>
          <a href="#course-management">Course Management</a>
          <a href="#reports">Reports</a>
          <a href="#admin-alerts">Alerts</a>
          <a href="#system-status">System Status</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2>Administration Overview</h2>

          <div className="dashboard-grid">
            <article id="user-management" className="dashboard-card">
              <h3>User Management</h3>
              <p>Manage student and faculty accounts.</p>
            </article>

            <article id="course-management" className="dashboard-card">
              <h3>Course Management</h3>
              <p>Manage available courses.</p>
            </article>

            <article id="reports" className="dashboard-card">
              <h3>Reports</h3>
              <p>View system reports.</p>
            </article>

            <article id="admin-alerts" className="dashboard-card">
              <h3>Alerts</h3>
              <p>View administrative alerts.</p>
            </article>

            <article id="system-status" className="dashboard-card">
              <h3>System Status</h3>
              <p className="status-online">All systems operational</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminDashboard