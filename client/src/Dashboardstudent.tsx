import { useState } from "react";
import StudentGPACal from "./StudentGPACal";

function Dashboardstudent() {
  const [showGPACalculator, setShowGPACalculator] = useState(false);

   if (showGPACalculator) {
    return (
      <StudentGPACal onBack={() => setShowGPACalculator(false)} />
    );
  }
  return (
    <>
      <header>
        <h1>Student Dashboard</h1>
        <p>University Student Portal</p>

        <nav aria-label="Student navigation">
          <a href="#gpa">GPA</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
        </nav>
      </header>

      <main id="student-dashboard">
        <section id="gpa">
          <h2>GPA</h2>
          <p id="gpa-value">Current GPA: 3.75</p>
          <p id="gpa-letter-grade">View your GPA history and trends.</p>
         <button onClick={() => setShowGPACalculator(true)}>
          Use the GPA calculator to estimate your future GPA.
        </button>
        </section>
        <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Attendance</h2>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
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
