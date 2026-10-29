import { useState } from 'react'
import AllStudents from './AllStudents'
import StudentRecords from './StudentRecords'
import StudentLookup from './StudentLookup'
import WeatherCard from './WeatherCard'
import GpaCalculator from './GpaCalculator'
import TranscriptCard from './TranscriptCard'

// The dashboard composes reusable modules and connects list selection/refresh.
function Dashboardstudent() {
  const [selection, setSelection] = useState<{ studentId: number; requestKey: number }>()
  const [studentsRevision, setStudentsRevision] = useState(0)

  function viewStudent(studentId: number) {
    // Incrementing requestKey also reloads a student who is selected again.
    setSelection((previous) => ({
      studentId,
      requestKey: (previous?.requestKey ?? 0) + 1,
    }))
  }

  function refreshStudents() {
    setStudentsRevision((revision) => revision + 1)
  }

  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
      </header>
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
          <li><a href="#all-students">All students</a></li>
          <li><a href="#student-records">Student records</a></li>
          <li><a href="#student-lookup">Student lookup</a></li>
          <li><a href="#weather">Weather</a></li>
          <li><a href="#gpa">GPA Calculator</a></li>
          <li><a href="#transcript">Transcript</a></li>
        </ul>
      </nav>
      <div className="dashboard-grid">
        <AllStudents id="all-students" refreshKey={studentsRevision}
          onSelect={viewStudent} />
        <StudentRecords id="student-records" selection={selection}
          onChange={refreshStudents} />
        <StudentLookup id="student-lookup" />
        <WeatherCard id="weather" />
        <GpaCalculator id="gpa" />
        <TranscriptCard id="transcript" />
      </div>
    </main>
  )
}

export default Dashboardstudent
