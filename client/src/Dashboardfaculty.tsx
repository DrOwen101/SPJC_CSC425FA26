import AllRecords from './AllRecords';
import StudentLookup from './StudentLookup';
import StudentRecords from './StudentRecordsFaculty';
import FacultyCourses from './FacultyCourses';
import Grading from './Grading'
// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function Dashboardfaculty() {
  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
            <li><a href="#student-records">Student Records</a></li>
            <li><a href="#faculty-alerts">Student Transcripts</a></li>
            <li><a href="#faculty-courses">Courses</a></li>
            <li><a href="#grading">Assignment Management</a></li>
            {/*
            For future implementation
            <li><a href="#teaching-schedule">Teaching Schedule</a></li>
            <li><a href="#class-rosters">Class Rosters</a></li>
            <li><a href="#faculty-courses">Student Records</a></li>*/}
            
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        
        <StudentRecords/>
        <StudentLookup/>
        <FacultyCourses/>
        <Grading/>
        
      </div>
    </main>
  )
}

export default Dashboardfaculty
