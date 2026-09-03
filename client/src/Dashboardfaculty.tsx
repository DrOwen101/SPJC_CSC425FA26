import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardfaculty() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <a href="#faculty-courses">Courses | </a>
          <a href="#class-rosters">Class Rosters | </a>
          <a href="#grading">Grading | </a>
          <a href="#faculty-alerts">Alerts | </a>
          <a href="#teaching-schedule">Teaching Schedule | </a>
        </nav>
      </header>

      <main id="faculty-dashboard">
        {/* <section id="gpa">
          <h2>GPA</h2>
          <p>Current GPA: 3.75</p>
        </section> */}

        <section id="faculty-courses">
          <h2>Faculty Courses</h2>
          <p>View your courses here</p>
        </section>

        <section id="class-rosters">
          <h2>Class Rosters</h2>
          <p>View class student rosters here</p>
        </section>

        <section id="grading">
          <h2>Grading</h2>
          <p>View and input student grades here</p>
        </section>

        <section id="faculty-alerts">
          <h2>Faculty Alerts</h2>
          <p>All administrative alerts to faculty shown here</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>View and input student course alerts here</p>
        </section>

        <section id="teaching-schedule">
          <h2>Teaching Schedule</h2>
          <p>View course teaching schedule here</p>
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

export default Dashboardfaculty
