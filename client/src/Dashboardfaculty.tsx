import { useEffect, useState } from 'react'
import './FacultyDashboard.css'
import { errorMessage, getAuthToken } from './apiClient'
import { currentUser, listMySections, type Section, type SignedInUser } from './facultyApi'
import FacultySignIn from './FacultySignIn'
import ClassRoster from './ClassRoster'
import GradePosting from './GradePosting'
import SectionGpaSummary from './SectionGpaSummary'
import RosterLookup from './RosterLookup'

// This role component supplies content; App.css supplies the shared layout.
// Lab 12: the four faculty cards only render for a signed-in faculty account.
// That is the interface check. The server checks again on every request.
function Dashboardfaculty() {
  const [user, setUser] = useState<SignedInUser | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [error, setError] = useState('')
  // Changes after a grade is saved so every card reloads the stored values.
  const [refreshKey, setRefreshKey] = useState(0)

  // After a page refresh, check whether the saved sign-in token still works.
  useEffect(() => {
    if (!getAuthToken()) return
    currentUser().then(setUser).catch(() => setUser(null))
  }, [])

  // Load only this faculty member's sections once a faculty account signs in.
  useEffect(() => {
    if (user?.role !== 'faculty') {
      setSections([])
      return
    }
    setError('')
    listMySections().then(setSections).catch((requestError) => setError(errorMessage(requestError)))
  }, [user, refreshKey])

  const isFaculty = user?.role === 'faculty'

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
        <p className="demo-note">Course project. All people and records are fictional.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
          <li><a href="#faculty-sign-in">Sign in</a></li>
          <li><a href="#class-rosters">Class Roster</a></li>
          <li><a href="#grading">Grading</a></li>
          <li><a href="#section-gpa">Section GPA</a></li>
          <li><a href="#roster-lookup">Roster Lookup</a></li>
          <li><a href="#faculty-courses">Courses</a></li>
          <li><a href="#faculty-alerts">Alerts</a></li>
          <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      <div className="dashboard-grid">
        <FacultySignIn user={user} onChange={setUser} />

        {user && !isFaculty && (
          <p className="faculty-error faculty-wide" role="alert">
            You are signed in with a {user.role} account. Faculty features need a faculty account.
          </p>
        )}
        {error && <p className="faculty-error faculty-wide" role="alert">{error}</p>}

        {isFaculty && (
          <>
            <ClassRoster sections={sections} refreshKey={refreshKey} />
            <GradePosting sections={sections} refreshKey={refreshKey} onSaved={() => setRefreshKey((key) => key + 1)} />
            <SectionGpaSummary sections={sections} refreshKey={refreshKey} />
            <RosterLookup />
          </>
        )}

        <section id="faculty-courses" className="dashboard-card" aria-labelledby="faculty-courses-heading" tabIndex={-1}>
          <h2 id="faculty-courses-heading">Courses</h2>
          {isFaculty && sections.length > 0 ? (
            <ul className="detail-list">
              {sections.map((section) => (
                <li key={section.id}>
                  {section.courseCode}-{section.sectionNumber} {section.title} · {section.studentCount} students · {section.gradedCount} graded
                </li>
              ))}
            </ul>
          ) : (
            <p>Sign in with a faculty account to see your assigned sections.</p>
          )}
        </section>
        <section id="faculty-alerts" className="dashboard-card" aria-labelledby="faculty-alerts-heading" tabIndex={-1}>
          <h2 id="faculty-alerts-heading">Alerts</h2>
          <p className="status-label">Live alerts unavailable</p>
          <p>Teaching reminders, schedule changes, and department announcements will appear here when notifications are connected.</p>
        </section>
        <section id="teaching-schedule" className="dashboard-card" aria-labelledby="teaching-schedule-heading" tabIndex={-1}>
          <h2 id="teaching-schedule-heading">Teaching Schedule</h2>
          <p className="status-label">Not connected</p>
          <p>Class meetings and office hours will appear here.</p>
          <ul className="detail-list">
            <li>Day, time, and room or online location</li>
            <li>Office hours and student appointments</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

export default Dashboardfaculty
