function Dashboardstudent() {
  return (
  
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>University Student Portal</p>
      </header>
        <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#balance">Account Balance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#resources">Resources</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>
    
      <div className="dashboard-grid">
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <p className="metric">GPA: </p> 
          <p className="metric" id="gpaData">N/A</p>
          <p> Enter a letter grade.</p>
          <input id= "gradeText" type= "text"></input>
          <button>Add Grade</button>
          <p>Accepted grades: A+,A,A-,B+,B,B-,C+,C,C-,D+,D,D-,F</p>
          <p id="gradeList">No grades listed.</p>
        </section>

        <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Attendance</h2>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
        </section>

        <section id="balance" className="dashboard-card" aria-labelledby="courses-heading" tabIndex={-1}>
          <h2 id="courses-heading">Account Balance</h2>
          <p className="metric">$100</p>
          <p>Your account balacne overview is shown. You can see your bill, make a payment, and such under this tab.</p>
        </section>

        <section id="transcript" className="dashboard-card" aria-labelledby="transcript-heading" tabIndex={-1}>
          <h2 id="transcript-heading">Transcript</h2>
          <p className="status-label">Not connected</p>
          <p>Completed courses, credit hours, and final grades will appear here when academic records are connected.</p>
        </section>

        <section id="alerts" className="dashboard-card" aria-labelledby="alerts-heading" tabIndex={-1}>
          <h2 id="alerts-heading">Alerts</h2>
          <p className="status-label">Sample status: no new academic alerts</p>
          <p>Check here for academic reminders and notices. Live alerts are not connected.</p>
        </section>

        <section id="resources" className="dashboard-card" aria-labelledby="courses-heading" tabIndex={-1}>
          <h2 id="courses-heading">University Resources</h2>
          <p className="status-label">Not connected</p>
          <p>Tutoring schedules, mental health resources, and other resources can be found here.</p>
        </section>

        <section id="courses" className="dashboard-card" aria-labelledby="courses-heading" tabIndex={-1}>
          <h2 id="courses-heading">Upcoming Courses</h2>
          <p className="status-label">Not connected</p>
          <p>Your registered courses, meeting times, and locations will appear here when registration data is connected.</p>
        </section>
      </div>
    </main>
    
  )
}

export default Dashboardstudent