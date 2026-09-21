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

        <section id="attendance">
          <h2>Attendance</h2>
          <p>Current attendance: 94%</p>
        </section>

        <section id="transcript">
          <h2>Transcript</h2>
          <p>View your completed courses and grades.</p>
        </section>

        <section id="alerts">
          <h2>Alerts</h2>
          <p>No new academic alerts.</p>
        </section>

        <section id="courses">
          <h2>Upcoming Courses</h2>
          <p>View your upcoming and registered courses.</p>
        </section>
      </main>
    </>
  )
}

export default Dashboardstudent
