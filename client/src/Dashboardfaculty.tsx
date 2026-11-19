import { useState } from 'react'
import FacultyLogin from './FacultyLogin'
import TeachingAssignments from './TeachingAssignments'
import ClassRoster from './ClassRoster'
import GradeEntry from './GradeEntry'
import AttendanceTracker from './AttendanceTracker'
import { facultyLogout, type FacultyProfile, type Section } from './facultyApi'

function Dashboardfaculty() {
  const [faculty, setFaculty] = useState<FacultyProfile | null>(null)
  const [section, setSection] = useState<Section | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((key) => key + 1)

  async function signOut() {
    await facultyLogout()
    setFaculty(null)
    setSection(null)
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Manage your sections, rosters, grades, and attendance.</p>
        {faculty && (
          <p>Signed in as {faculty.firstName} {faculty.lastName}.{' '}
            <button type="button" onClick={signOut}>Sign out</button></p>
        )}
        <p className="demo-note">Course project preview. Fictional faculty, students, and sections.</p>
      </header>

      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#faculty-courses">Teaching Assignments</a></li>
          <li><a href="#class-rosters">Class Roster</a></li>
          <li><a href="#grading">Grading</a></li>
          <li><a href="#faculty-alerts">Attendance &amp; Alerts</a></li>
          <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      <div className="dashboard-grid">
        {!faculty && <FacultyLogin onSignedIn={setFaculty} />}
        {faculty && (
          <>
            <TeachingAssignments selectedId={section?.id ?? null} onSelect={setSection} />
            <ClassRoster section={section} refreshKey={refreshKey} />
            <GradeEntry section={section} refreshKey={refreshKey} onSaved={refresh} />
            <AttendanceTracker section={section} refreshKey={refreshKey} onSaved={refresh} />
          </>
        )}
        <section id="teaching-schedule" className="dashboard-card" aria-labelledby="teaching-schedule-heading" tabIndex={-1}>
          <h2 id="teaching-schedule-heading">Teaching Schedule</h2>
          <p className="status-label">Not connected</p>
          <p>Meeting times and locations will appear here when scheduling data is connected.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboardfaculty