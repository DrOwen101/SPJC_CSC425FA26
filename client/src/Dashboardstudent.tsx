// This role component supplies content; App.css supplies the shared layout.

import { useState } from "react"

// Keep these examples separate from live records until a data source is connected.
function Dashboardstudent() {
  const [gpa, setGpa] = useState("")
  const gradePoints = {
    "A+": 4.0,
    "A": 4.0,
    "A-": 3.7,
    "B+": 3.3,
    "B": 3.0,
    "B-": 2.7,
    "C+": 2.3,
    "C": 2.0,
    "C-": 1.7,
    "D+": 1.3,
    "D": 1.0,
    "D-": 0.7,
    "F": 0.0
  };


  let grades = [];

  function addGrade() {
    let grade = document.getElementById("grade-entry").value;
    
    grade = grade.trim().toUpperCase();

    // Check if the grade is valid
    if (gradePoints[grade] !== undefined) {

        // Add the grade to the array
        grades.push(grade);

        // Display the grades
        displayGrades();

        // Clear the input box
        document.getElementById("grade-entry").value = "";

    } else {

        alert("Please enter a valid letter grade.");
    }

  }

  function displayGrades() {

    let output = "";

    // Traditional FOR loop
    for (let i = 0; i < grades.length; i++) {

        output += "<li>" +
                  grades[i] +
                  " = " +
                  gradePoints[grades[i]] +
                  " points</li>";
    }

    // Put the output into the HTML
    document.getElementById("grade-list").innerHTML = output;
  }

  function calculateGPA() {

    let totalPoints = 0;

    // Add the points for each grade
    for (let i = 0; i < grades.length; i++) {

        totalPoints = totalPoints + gradePoints[grades[i]];
    }

    // Calculate the average
    let gpa = totalPoints / grades.length;

    // Display the GPA
    document.getElementById("gpa-value").textContent = gpa.toFixed(2);
}



  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
        <p className="demo-note">Course project preview. GPA and attendance are sample values; other records are not connected.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
            <li><a href="#gpa">GPA</a></li>
            <li><a href="#attendance">Attendance</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <input type="text" id="grade-entry"/>
          <button onClick={addGrade}>Add Grade</button>
          <ul id="grade-list"></ul>
          <button onClick={calculateGPA}>Calculate GPA</button>
          <p>GPA: <span id="gpa-value">--</span></p>
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
