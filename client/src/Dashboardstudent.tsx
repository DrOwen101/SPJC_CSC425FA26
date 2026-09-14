import SPJCLogo from './assets/SPJCLogo.jpg'


function Dashboardstudent() {
  return (
    <>
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1> 
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <a href="#gpa">GPA | </a>
          <a href="#attendance">Attendance | </a>
          <a href="#transcript">Transcript | </a>
          <a href="#alerts">Alerts | </a>
          <a href="#courses">Upcoming Courses | </a>
        </nav>
      </header>

      <main id="student-dashboard" className="dashboard-main">
        <section id="gpa" className="dashboard-card">
          <h2>GPA</h2>
          <p>Current GPA: 3.75</p>
        </section>

        <section id="attendance" className="dashboard-card">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </section>

        <section id="transcript" className="dashboard-card">
          <h2>Transcript</h2>
          <p>View your completed courses and grades.</p>
        </section>

        <section id="alerts" className="dashboard-card">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="courses" className="dashboard-card">
          <h2>Upcoming Courses</h2>
          <p>View your upcoming and registered courses.</p>
        </section>

        {/*company logo section*/}
        {<section id="right" className="dashboard-card"> 
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

export default Dashboardstudent
