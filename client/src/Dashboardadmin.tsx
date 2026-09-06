import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardadmin() {
  return (
    <>
      <header>
        
        <h1>Admin Dashboard</h1>

        <nav className="dashboard-nav" aria-label="Admin navigation">
          <a href="#course-management">Course Management</a>
          <a href="#users-and-role-management">Users & Role Management</a>
          <a href="#institutional-settings">Institutional Settings</a>
          <a href="#logs-and-reports">Logs & Reports</a>
          <a href="#admin-alerts">Alerts</a>
          <a href="#system-status">System Status</a>
        </nav>
      </header>

      <main id="admin-dashboard">
        <section>
          <article id="course-management">
            <h4>Course Management</h4>
            <p>Create courses, enroll students in courses, set instructors and TAs for courses, basically setting up a Discord server but a course</p>
          </article>
          <article id="users-and-role-management">
            <h4>Users & Role Management</h4>
            <p>Create, delete, and modify user metadata and permissions</p>
          </article>
          <article id="institutional-settings">
            <h4>Institutional Settings</h4>
            <p>Select global settings (defaults) institution-wide such as timezone, locale, course schedule, add/drop dates</p>
          </article>
          <article id="logs-and-reports">
            <h4>Logs & Reports</h4>
            <p>Access logs and overall statistics here</p>
          </article>
          <article id="admin-alerts">
            <h4>Alerts</h4>
            <p>View and manage system alerts</p>
          </article>
          <article id="system-status">
            <h4>System Status</h4>
            <p>View system status and health</p>
          </article>
        </section>
      </main>
    </>
  )
}

export default Dashboardadmin
