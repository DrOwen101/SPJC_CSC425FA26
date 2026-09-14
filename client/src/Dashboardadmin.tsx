function DashboardAdmin() {
  return (
    <main id="admin-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
          <li><a href="#admin-settings">System Settings</a></li>
          <li><a href="#user-management">User Management</a></li>
          <li><a href="#course-management">Course Management</a></li>
          <li><a href="#attendance-concerns">Attendance Concerns</a></li>
          <li><a href="#financial-summaries">Financial Summaries</a></li>
          <li><a href="#enrollment-trends">Enrollment trends</a></li>
          <li><a href="#success-indicator">Student Success Indicators</a></li>
          <li></li><a href="#admin-alerts">Alerts</a>
        </ul>
        </nav>
      </header>

      <div className="dashboard-grid">
        <section id="admin-settings" className="dashboard-card" aria-labelledby="admin-settings" tabIndex={-1}>
          <h2>System Settings</h2>
          <p>You can adjust the settings here.</p>
        </section>

        <section id="user-management" className="dashboard-card" aria-labelledby="user-management" tabIndex={-1}>
          <h2>User Management</h2>
          <p>You can create and manage users(students and faculty) here.</p>
        </section>

        <section id="course-management" className="dashboard-card" aria-labelledby="course-management" tabIndex={-1}>
          <h2>Course Management</h2>
          <p>You can create new courses and sections here. You can also assign instructors and view class rosters here.</p>
        </section>

        <section id="attendance-concerns" className="dashboard-card" aria-labelledby="attendance-concerns" tabIndex={-1}>
          <h2>Attendance Concerns</h2>
          <p>This is where students with attendance concerns show up.</p>
        </section>

        <section id="financial-summaries" className="dashboard-card" aria-labelledby="financial-summaries" tabIndex={-1}>
          <h2>Financial Summaries</h2>
          <p>Studetn financial summaries can be seen here.</p>
        </section>

        <section id="enrollment-trends" className="dashboard-card" aria-labelledby="enrollment-trends" tabIndex={-1}>
          <h2>Enrollment trends</h2>
          <p>Trends in enrollment can be seen here.</p>
        </section>

        <section id="success-indicators" className="dashboard-card" aria-labelledby="success-indicators" tabIndex={-1}>
          <h2>Student Success Indicators</h2>
          <p>Indicators that students are succeeding will pop up here.</p>
        </section>

        <section id="admin-alerts" className="dashboard-card" aria-labelledby="admin-alerts" tabIndex={-1}>
          <h2>Alerts</h2>
          <p>Any system alerts can be seen here.</p>
        </section>
      </div>
    </main>
  )
}

export default DashboardAdmin