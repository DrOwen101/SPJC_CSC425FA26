import SPJCLogo from './assets/SPJCLogo.jpg'

function Dashboardfaculty() {
  return (
    <>
      <header>
        <div className="dashboard-title">
          <h1>Faculty Dashboard</h1>
          <img className="dashboard-logo" src={SPJCLogo} alt="SPJC logo" />
        </div>
        <p>University Faculty Portal</p>

        <nav
          aria-label="Faculty navigation"
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
        >
          <a href="#my-courses">My Courses</a>
          <a href="#todays-classes">Today's Classes</a>
          <a href="#attendance-overview">Attendance Overview</a>
          <a href="#grade-management">Grade Management</a>
          <a href="#alerts">Alerts</a>
        </nav>
      </header>

      <main>
        <article id="my-courses">
          <h2>My Courses</h2>
          <p>CSC 425 - Web Apps and Services.</p>
          <p>Section 01 | 24 Students</p>
          <nav
            aria-label="Course actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#roster">View Roster</a>
            <a href="#attendance">Attendance</a>
            <a href="#grades">Grades</a>
          </nav>
        </article>

        <article id="todays-classes">
          <h2>Today's Classes</h2>
          <p>CSC 425 | TIME | LOCATION</p>
          <p>24 Students</p>
          <nav
            aria-label="Today's class actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#takeattendance">Take Attendance</a>
          </nav>
        </article>

        <article id="attendance-overview">
          <h2>Attendance Overview</h2>
          <p>3 students have excessive absences.</p>
          <nav
            aria-label="Attendance actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#viewattendance">View Attendance Records</a>
          </nav>
        </article>

        <article id="grade-management">
          <h2>Grade Management</h2>
          <p>3 grades pending</p>
          <p>No new academic alerts.</p>
          <nav
            aria-label="Grade management actions"
            style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <a href="#viewgrades">View Grade Summary</a>
            <a href="#submitgrades">Enter Grades</a>
          </nav>
        </article>

        <article id="alerts">
          <h2>Alerts</h2>
          <p>3 students have excessive absences.</p>
          <p>3 grades need to be entered.</p>
        </article>
      </main>
    </>
  )
}

export default Dashboardfaculty
