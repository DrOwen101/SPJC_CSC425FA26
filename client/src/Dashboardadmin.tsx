function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Administration Portal</p>

        <nav className="navbarDash" aria-label="Admin navigation">
          <a className="navbar-Dashlink" href="#user-management">User Management</a>
          <a className="navbar-Dashlink" href="#course-management">Course Management</a>
          <a className="navbar-Dashlink" href="#reports">Reports</a>
          <a className="navbar-Dashlink" href="#admin-alerts">Alerts</a>
          <a className="navbar-Dashlink" href="#system-status">System Status</a>
        </nav>
      </header>

      <main className="topicHeader" id="admin-dashboard">
        <section id="User Management">
          <h2>User Management</h2>
          <p>Manage and view user accounts.</p>
        </section>

        <section id="Course Management">
          <h2>Course Management</h2>
          <p>Manage and view course information.</p>
        </section>

        <section id="Reports">
          <h2>Reports</h2>
          <p>View and generate reports.</p>
        </section>

        <section id="alerts">
          <h2>System Alerts</h2>
          <p>Create or manage system alerts.</p>
        </section>

        <section id="System Status">
          <h2>System Status</h2>
          <p>View the current status of the system.</p>
        </section>
        
      </main>
    </>
  )
}

export default Dashboardadmin
