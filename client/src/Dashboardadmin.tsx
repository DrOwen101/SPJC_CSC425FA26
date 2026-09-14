import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardadmin() {
  return (
    <>
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>University Administration Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#user-management">User Management </a>
          <a href="#course-management">Course Management </a>
          <a href="#reports">Reports </a>
          <a href="#admin-alerts">Alerts </a>
          <a href="#system-status">System Status </a>
        </nav>
      </header>

      <main id="admin-dashboard" className="dashboard-main">
        <section id="user-management" className="dashboard-card">
          <h2>User Management</h2>
          <p>Search for, update, and add/ remove users here</p>
        </section>

        <section id="course-management" className="dashboard-card">
          <h2>Course Management</h2>
          <p>Search for, update, and add/ remove courses here</p>
        </section>

        <section id="reports" className="dashboard-card">
          <h2>Reports</h2>
          <p>Search for and add reports here</p>
        </section>

        <section id="admin-alerts" className="dashboard-card">
          <h2>Admin Alerts</h2>
          <p>View admin alerts here</p>
        </section>

        <section id="system-status" className="dashboard-card">
          <h2>System Status</h2>
          <p>View system status and outages here.</p>
          <p>System is functional</p>
        </section>

        {/*company logo section*/}
        {<section id="right" className="dashboard-card "> 
        <div className="hero">
          <img src={SPJCLogo} className="base" width="170" height="179" alt="SPJC logo" />
        </div>
        <div>
          <p></p> {/*use for extra information!*/}
        </div>
        {/* <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button> */}
      </section>}
        
      </main>
    </div>
    </>
  )
}

export default Dashboardadmin
