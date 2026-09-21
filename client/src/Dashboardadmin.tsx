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

      {/* Each subsection uses native details behavior for keyboard-accessible dropdowns. */}
      <div className="dashboard-grid">
        <details id="user-management" className="dashboard-card">
          <summary>User Management</summary>
          <p className="status-label">Not connected</p>
          <p>Account information will appear here when user management is connected.</p>
          <ul className="detail-list">
            <li>Student, faculty, and administrator accounts</li>
            <li>Account status and assigned roles</li>
          </ul>
        </details>
        <details id="course-management" className="dashboard-card">
          <summary>Course Management</summary>
          <p className="status-label">Not connected</p>
          <p>Course offerings and section details will appear here.</p>
          <ul className="detail-list">
            <li>Course catalog and term availability</li>
            <li>Faculty assignments and enrollment capacity</li>
          </ul>
        </details>
        <details id="reports" className="dashboard-card">
          <summary>Reports</summary>
          <p className="status-label">Reports unavailable</p>
          <p>Campus summaries will appear here when reporting data is connected.</p>
          <ul className="detail-list">
            <li>Enrollment by course and term</li>
            <li>Attendance and academic outcomes</li>
          </ul>
        </details>
        <details id="admin-alerts" className="dashboard-card">
          <summary>Alerts</summary>
          <p className="status-label">Live alerts unavailable</p>
          <p>Administrative requests, important deadlines, and campus announcements will appear here when notifications are connected.</p>
        </details>
        <details id="system-status" className="dashboard-card">
          <summary>System Status</summary>
          <p className="status-label">Status unknown · monitoring not connected</p>
          <p>Service availability and maintenance notices will appear here. This page does not currently check system health.</p>
        </details>
      </div>
    </main>
  )
}

export default Dashboardadmin
