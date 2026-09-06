import SPJCLogo from './assets/SPJCLogo.jpg'

function AdminDashboard() {
  return (
    <>
      <header>
        <section aria-label="SPJC branding">
          <img src={SPJCLogo} width="100" alt="SPJC logo" />
        </section>

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
        <article id="user-management">
          <h2>User Management</h2>
          <p>Manage student and faculty accounts.</p>
        </article>

        <section id="course-management">
          <h2>Course Management</h2>
          <p>Manage available courses.</p>
        </section>

        <article id="reports">
          <h2>Reports</h2>
          <p>View system reports.</p>
        </article>

        <article id="admin-alerts">
          <h2>Alerts</h2>
          <p>View administrative alerts.</p>
        </article>

        <article id="system-status">
          <h2>System Status</h2>
          <p>Check the application status.</p>
        </article>
      </main>
    </>
  )
}

export default AdminDashboard