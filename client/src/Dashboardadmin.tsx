import SPJCLogo from './assets/SPJCLogo.jpg'
function Dashboardadmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <img src={SPJCLogo} alt="SPJC Logo" style={{ width: '100px', height: 'auto' }} />
        <p style={{ textAlign: 'center', fontSize: '2em', fontWeight: 'bold'}}>University Administration Portal</p>
          <nav style={{ textAlign: 'center', fontSize: '1.7em', fontWeight: 'bold', lineHeight: '3', textDecoration: 'none', color: 'blue' }} aria-label="Admin navigation">
          <a href="#user-management">User Management</a>
          <br/>
          <a href="#course-management">Course Management</a>
          <br/>
          <a href="#reports">Reports</a>
          <br/>
          <a href="#admin-alerts">Alerts</a>
          <br/><a href="#system-status">System Status</a>
        </nav>
      </header>

      <main id="admin-dashboard">
        
      </main>
    </>
  )
}

export default Dashboardadmin
