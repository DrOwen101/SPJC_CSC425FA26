import SPJCLogo from './assets/SPJCLogo.jpg'
function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <img src={SPJCLogo} alt="SPJC Logo" style={{ width: '100px', height: 'auto' }} />
        <p style={{textAlign: 'center', fontSize: '2em', fontWeight: 'bold'}}>University Faculty Portal</p>

        <nav style={{ textAlign: 'center', fontSize: '1.7em', fontWeight: 'bold', lineHeight: '3', textDecoration: 'none', color: 'blue' }}aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses</a>
          <br />
          <a href="#class-rosters">Class Rosters</a>
          <br />
          <a href="#grading">Grading</a>
          <br />
          <a href="#faculty-alerts">Alerts</a>
          <br />
          <a href="#teaching-schedule">Teaching Schedule</a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        
      </main>
    </>
  )
}

export default Dashboardfaculty
