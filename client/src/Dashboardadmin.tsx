import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardadmin() {
  return (
    <>
      <header>
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

      <main id="admin-dashboard">
        <section id="user-management">
          <h2>User Management</h2>
          <p>Search for, update, and add/ remove users here</p>
        </section>

        <section id="course-management">
          <h2>Course Management</h2>
          <p>Search for, update, and add/ remove courses here</p>
        </section>

        <section id="reports">
          <h2>Reports</h2>
          <p>Search for and add reports here</p>
        </section>

        <section id="admin-alerts">
          <h2>Admin Alerts</h2>
          <p>View admin alerts here</p>
        </section>

        <section id="system-status">
          <h2>System Status</h2>
          <p>View system status and outages here.</p>
          <p>System is functional</p>
        </section>

        {/*company logo section*/}
        {<section id="right"> 
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
    </>
  )
}

export default Dashboardadmin
