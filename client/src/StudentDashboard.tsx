import {useState} from "react"
import WeatherCard from './WeatherCard'

// This role component supplies content; App.css supplies the shared layout.
// Keep these examples separate from live records until a data source is connected.
function StudentDashboard() {

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
  const [grades, setGrades] = useState([]);
  const [gradeInput, setGradeInput] = useState("");
  const [gpa, setGpa] = useState(null);

  // Add grade
  const addGrade = () => {
    const cleaned = gradeInput.trim().toUpperCase();

    if (gradePoints[cleaned] !== undefined) {
      setGrades([...grades, cleaned]);
      setGradeInput("");
    } else {
      alert("Please enter a valid letter grade.");
    }
  };

  // Calculate GPA
  const calculateGPA = () => {
    if (grades.length === 0) return;

    const total = grades.reduce((sum, g) => sum + gradePoints[g], 0);
    const avg = total / grades.length;

    setGpa(avg.toFixed(2));
  };

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
        <WeatherCard />
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>

          <input
            type="text"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            placeholder="Enter a letter grade (A, B+, C-, etc.)"
            className="grade-input"
          />

          <button onClick={addGrade}>Add Grade</button>

          {/* Grade List */}
          <ul id="grade-list">
            {grades.map((g, index) => (
              <li key={index}>
                {g} = {gradePoints[g]} points
              </li>
            ))}
          </ul>

          <button onClick={calculateGPA} className="calculate-button">
            Calculate GPA
          </button>

          <p>
            GPA: <span id="gpa-value">{gpa ?? "--"}</span>
          </p>
          
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

export default StudentDashboard