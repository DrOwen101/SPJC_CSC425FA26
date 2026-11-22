import EnrollmentLookup from './enrollmentlookup'
import TranscriptCard from './TranscriptCard'
import GradeEntryCard from './GradeEntryCard'
import TeachingScheduleCard from './TeachingScheduleCard'

function Dashboardfaculty() {
  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Manage class rosters, audit advisee transcripts, submit grades, and update your teaching schedule.</p>
      </header>

      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#enrollments-card">Class Rosters</a></li>
          <li><a href="#transcript">Advising &amp; Transcripts</a></li>
          <li><a href="#grade-entry-card">Grading</a></li>
          <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      <div className="dashboard-grid">
        <EnrollmentLookup mode="faculty" />
        <TranscriptCard id="transcript" mode="faculty" />
        <GradeEntryCard id="grade-entry-card" />
        <TeachingScheduleCard />
      </div>
    </main>
  )
}

export default Dashboardfaculty