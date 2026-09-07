function AdminDashboard() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav aria-label="Student navigation">
          <a href="#dashboards">Dashboards</a>
          <a href="#courses">Courses</a>
          <a href="#alerts">Alerts</a>
          <a href="#reports">Reports</a>
          <a href="#system-status">System Status</a>
        </nav>
      </header>

      <main>
        <section id="dashboards">
          <h2>Dashboards</h2>
          <p>View information such as enrollment trends, attendance concerns, student success indicators, and financial summaries.</p>
        </section>

        <section id="courses">
          <h2>Courses</h2>
          <p>View Courses List.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="reports">
          <h2>Reports</h2>
          <p>View Reports.</p>
        </section>

        <section id="system-status">
          <h2>System Status</h2>
          <p>System is up to date.</p>
        </section>
      </main>
    </>
  )
}

export default AdminDashboard