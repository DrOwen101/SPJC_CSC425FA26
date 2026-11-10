import WeatherCard from './WeatherCard'
import StudentLookup from './StudentLookup'
//import TranscriptCard from './TranscriptCard' -> transitioned into StudentLookup
import GpaCalculator from './GpaCalculator'
import StudentRecords from './StudentRecords'
import AllRecords from './AllRecords'
// This role component supplies content; App.css supplies the shared layout.
// The lookup uses the dummy API; the other cards remain classroom examples.
function Dashboardstudent() {
  

  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
            <li><a href="#gpa">GPA</a></li>
            {/* <li><a href="#attendance">Attendance</a></li> */}
            <li><a href="#student-lookup">Student lookup</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        {/* StudentLookup contains the Lab 7 form, request, state, and result.
            The dashboard imports and places it like any other React component. */}
        <AllRecords />
        <StudentRecords/>
        <StudentLookup />
        <WeatherCard />
        <GpaCalculator/>
        
        {/* <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Attendance</h2>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
        </section> */}
        
      </div>
    </main>
  )
}

export default Dashboardstudent
