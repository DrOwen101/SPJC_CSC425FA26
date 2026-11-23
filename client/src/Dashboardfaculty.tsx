import { useEffect, useState } from 'react'
import {
  getCourseRoster,
  getFacultyCourses,
  type FacultyCourse,
  type RosterStudent,
} from './facultyApi'

// This role component supplies content; App.css supplies the shared layout.
function Dashboardfaculty() {
  const [courses, setCourses] = useState<FacultyCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<FacultyCourse | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState('')

  useEffect(() => {
    let active = true

    async function loadCourses() {
      try {
        const result = await getFacultyCourses()
        if (active) setCourses(result)
      } catch (error) {
        if (active) {
          setCoursesError(error instanceof Error ? error.message : 'Unable to load courses.')
        }
      } finally {
        if (active) setCoursesLoading(false)
      }
    }

    void loadCourses()
    return () => {
      active = false
    }
  }, [])

  async function showRoster(course: FacultyCourse) {
    setSelectedCourse(course)
    setRoster([])
    setRosterError('')
    setRosterLoading(true)

    try {
      setRoster(await getCourseRoster(course.courseId))
    } catch (error) {
      setRosterError(error instanceof Error ? error.message : 'Unable to load the roster.')
    } finally {
      setRosterLoading(false)
    }
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
        <p className="demo-note">Courses and rosters load from the demo API. Grading, alerts, and schedule features are not connected yet.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Faculty sections">
        <ul>
            <li><a href="#faculty-courses">Courses</a></li>
            <li><a href="#class-rosters">Class Rosters</a></li>
            <li><a href="#grading">Grading</a></li>
            <li><a href="#faculty-alerts">Alerts</a></li>
            <li><a href="#teaching-schedule">Teaching Schedule</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        <section id="faculty-courses" className="dashboard-card" aria-labelledby="faculty-courses-heading" tabIndex={-1}>
          <h2 id="faculty-courses-heading">Courses</h2>
          <p className="status-label" role="status">
            {coursesLoading ? 'Loading courses…' : coursesError ? 'Could not load courses' : `${courses.length} course${courses.length === 1 ? '' : 's'} loaded`}
          </p>
          {coursesError && <p className="field-error" role="alert">{coursesError}</p>}
          {!coursesLoading && !coursesError && courses.length === 0 && <p>No courses are available.</p>}
          {courses.length > 0 && (
            <ul className="detail-list">
              {courses.map((course) => (
                <li key={course.courseId}>
                  <p><strong>{course.courseCode}: {course.courseTitle}</strong></p>
                  <p>Section {course.section} · {course.term}</p>
                  <div className="gpa-entry-row">
                    <button
                      type="button"
                      onClick={() => void showRoster(course)}
                      disabled={rosterLoading}
                    >
                      {rosterLoading && selectedCourse?.courseId === course.courseId ? 'Loading roster…' : 'View roster'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section id="class-rosters" className="dashboard-card" aria-labelledby="class-rosters-heading" tabIndex={-1}>
          <h2 id="class-rosters-heading">Class Rosters</h2>
          <p className="status-label" role="status">
            {rosterLoading
              ? `Loading ${selectedCourse?.courseCode ?? ''} roster…`
              : selectedCourse
                ? `Roster for ${selectedCourse.courseCode}, section ${selectedCourse.section}`
                : 'Choose View roster for a course.'}
          </p>
          {rosterError && <p className="field-error" role="alert">{rosterError}</p>}
          {selectedCourse && !rosterLoading && !rosterError && roster.length === 0 && <p>No students are enrolled in this course.</p>}
          {roster.length > 0 && (
            <ul className="detail-list">
              {roster.map((student) => (
                <li key={student.studentID}>
                  <strong>{student.firstName} {student.lastName}</strong>
                  <br />
                  Student ID: {student.studentID} · Major: {student.major}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section id="grading" className="dashboard-card" aria-labelledby="grading-heading" tabIndex={-1}>
          <h2 id="grading-heading">Grading</h2>
          <p className="status-label">Not connected</p>
          <p>Assignments awaiting review and grade submission deadlines will appear here.</p>
          <ul className="detail-list">
            <li>Submissions to review</li>
            <li>Grades and student feedback</li>
          </ul>
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
