// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function Dashboardadmin() {
  return (
    <main id="admin-dashboard" className="dashboard" aria-labelledby="admin-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your administration workspace</p>
        <h1 id="admin-title">Admin Dashboard</h1>
        <p>Find campus management information and review operational updates.</p>
        <p className="demo-note">Course project preview. Live records and management actions are not connected yet.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Admin sections">
        <ul>
            <li><a href="#user-management">User Management</a></li>
            <li><a href="#course-management">Course Management</a></li>
            <li><a href="#reports">Reports</a></li>
            <li><a href="#admin-alerts">Alerts</a></li>
            <li><a href="#system-status">System Status</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="user-management" className="dashboard-card" aria-labelledby="user-management-heading" tabIndex={-1}>
          <h2 id="user-management-heading">User Management</h2>
          <p className="status-label">Not connected</p>
          <p>Account information will appear here when user management is connected.</p>
          <ul className="detail-list">
            <li>Student, faculty, and administrator accounts</li>
            <li>Account status and assigned roles</li>
          </ul>
        </section>
        <section id="course-management" className="dashboard-card" aria-labelledby="course-management-heading" tabIndex={-1}>
          <h2 id="course-management-heading">Course Management</h2>
          <p className="status-label">Not connected</p>
          <p>Course offerings and section details will appear here.</p>
          <ul className="detail-list">
            <li>Course catalog and term availability</li>
            <li>Faculty assignments and enrollment capacity</li>
          </ul>
        </section>
        <section id="reports" className="dashboard-card" aria-labelledby="reports-heading" tabIndex={-1}>
          <h2 id="reports-heading">Reports</h2>
          <p className="status-label">Reports unavailable</p>
          <p>Campus summaries will appear here when reporting data is connected.</p>
          <ul className="detail-list">
            <li>Enrollment by course and term</li>
            <li>Attendance and academic outcomes</li>
          </ul>
        </section>
        <section id="admin-alerts" className="dashboard-card" aria-labelledby="admin-alerts-heading" tabIndex={-1}>
          <h2 id="admin-alerts-heading">Alerts</h2>
          <p className="status-label">Live alerts unavailable</p>
          <p>Administrative requests, important deadlines, and campus announcements will appear here when notifications are connected.</p>
        </section>
        <section id="system-status" className="dashboard-card" aria-labelledby="system-status-heading" tabIndex={-1}>
          <h2 id="system-status-heading">System Status</h2>
          <p className="status-label">Status unknown · monitoring not connected</p>
          <p>Service availability and maintenance notices will appear here. This page does not currently check system health.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboardadmin
