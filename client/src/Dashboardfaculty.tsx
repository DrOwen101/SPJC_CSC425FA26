import { useEffect, useState } from 'react'
import {
  addTeachingScheduleEntry,
  deleteTeachingScheduleEntry,
  getCourseGrades,
  getCourseRoster,
  getFacultyCourses,
  getTeachingSchedule,
  saveCourseGrade,
  type CourseGrade,
  type FinalGrade,
  type FacultyCourse,
  type NewTeachingScheduleEntry,
  type RosterStudent,
  type ScheduleMeetingType,
  type TeachingScheduleEntry,
  type Weekday,
} from './facultyApi'

const weekdays: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function displayTime(value: string) {
  const [hours, minutes] = value.split(':')
  const hour = Number(hours)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${minutes} ${suffix}`
}

function isFinalGrade(value: string): value is FinalGrade {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'F'
}

function isWeekday(value: string): value is Weekday {
  return weekdays.some((day) => day === value)
}

// This role component supplies content; App.css supplies the shared layout.
function Dashboardfaculty() {
  const [courses, setCourses] = useState<FacultyCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<FacultyCourse | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState('')
  const [grades, setGrades] = useState<CourseGrade[]>([])
  const [gradesLoading, setGradesLoading] = useState(false)
  const [gradesError, setGradesError] = useState('')
  const [gradeSavingStudent, setGradeSavingStudent] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [schedule, setSchedule] = useState<TeachingScheduleEntry[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleType, setScheduleType] = useState<ScheduleMeetingType>('class')
  const [scheduleCourseId, setScheduleCourseId] = useState('')
  const [scheduleDay, setScheduleDay] = useState<Weekday>('Monday')
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd] = useState('10:00')
  const [scheduleLocation, setScheduleLocation] = useState('')

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

  useEffect(() => {
    if (courses.length > 0 && !scheduleCourseId) {
      setScheduleCourseId(String(courses[0].courseId))
    }
  }, [courses, scheduleCourseId])

  useEffect(() => {
    let active = true
    async function loadSchedule() {
      try {
        const result = await getTeachingSchedule()
        if (active) setSchedule(result)
      } catch (error) {
        if (active) {
          setScheduleError(error instanceof Error ? error.message : 'Unable to load the teaching schedule.')
        }
      } finally {
        if (active) setScheduleLoading(false)
      }
    }
    void loadSchedule()
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

  async function showGrades(course: FacultyCourse) {
    setSelectedCourse(course)
    setGrades([])
    setGradesError('')
    setGradeFeedback('')
    setGradesLoading(true)
    try {
      setGrades(await getCourseGrades(course.courseId))
    } catch (error) {
      setGradesError(error instanceof Error ? error.message : 'Unable to load grades.')
    } finally {
      setGradesLoading(false)
    }
  }

  async function submitGrade(student: CourseGrade) {
    if (!selectedCourse || !student.grade) return
    setGradeSavingStudent(student.studentID)
    setGradesError('')
    setGradeFeedback('')
    try {
      await saveCourseGrade(selectedCourse.courseId, student.studentID, student.grade)
      setGradeFeedback(`Grade saved for ${student.firstName} ${student.lastName}.`)
    } catch (error) {
      setGradesError(error instanceof Error ? error.message : 'Unable to save the grade.')
    } finally {
      setGradeSavingStudent('')
    }
  }

  async function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (scheduleType === 'class' && (!Number.isInteger(Number(scheduleCourseId)) || Number(scheduleCourseId) < 1)) {
      setScheduleError('Select an available course before adding a class meeting.')
      return
    }
    if (scheduleStart >= scheduleEnd) {
      setScheduleError('The end time must be later than the start time.')
      return
    }
    const location = scheduleLocation.trim()
    if (!location) {
      setScheduleError('Enter a room or location.')
      return
    }

    const entry: NewTeachingScheduleEntry = {
      meetingType: scheduleType,
      courseId: scheduleType === 'class' ? Number(scheduleCourseId) : null,
      dayOfWeek: scheduleDay,
      startTime: scheduleStart,
      endTime: scheduleEnd,
      location,
    }
    setScheduleSaving(true)
    setScheduleError('')
    try {
      await addTeachingScheduleEntry(entry)
      setSchedule(await getTeachingSchedule())
      setScheduleLocation('')
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Unable to save the schedule entry.')
    } finally {
      setScheduleSaving(false)
    }
  }

  async function removeScheduleEntry(entry: TeachingScheduleEntry) {
    setScheduleError('')
    try {
      await deleteTeachingScheduleEntry(entry.scheduleId)
      setSchedule((current) => current.filter(({ scheduleId }) => scheduleId !== entry.scheduleId))
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Unable to remove the schedule entry.')
    }
  }

  return (
    <main id="faculty-dashboard" className="dashboard" aria-labelledby="faculty-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your teaching workspace</p>
        <h1 id="faculty-title">Faculty Dashboard</h1>
        <p>Find course information, student rosters, and grading tasks in one place.</p>
        <p className="demo-note">Courses, rosters, grades, and teaching schedule load from the API. Alerts are not connected yet.</p>
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
                    <button
                      type="button"
                      onClick={() => void showGrades(course)}
                      disabled={gradesLoading}
                    >
                      {gradesLoading && selectedCourse?.courseId === course.courseId ? 'Loading grades…' : 'Manage grades'}
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
          <p className="status-label" role="status">
            {gradesLoading
              ? `Loading ${selectedCourse?.courseCode ?? ''} grades…`
              : selectedCourse
                ? `Final grades for ${selectedCourse.courseCode}, section ${selectedCourse.section}`
                : 'Choose Manage grades for a course.'}
          </p>
          {gradesError && <p className="field-error" role="alert">{gradesError}</p>}
          {gradeFeedback && <p className="field-success" role="status">{gradeFeedback}</p>}
          {selectedCourse && !gradesLoading && !gradesError && grades.length === 0 && <p>No enrolled students are available for grading.</p>}
          {grades.length > 0 && (
            <ul className="detail-list">
              {grades.map((student) => (
                <li key={student.studentID}>
                  <strong>{student.firstName} {student.lastName}</strong>
                  <div className="gpa-entry-row">
                    <label className="visually-hidden" htmlFor={`grade-${student.studentID}`}>
                      Final grade for {student.firstName} {student.lastName}
                    </label>
                    <select
                      id={`grade-${student.studentID}`}
                      value={student.grade ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        const grade: FinalGrade | null = isFinalGrade(value)
                          ? value
                          : null
                        setGrades((current) => current.map((item) => (
                          item.studentID === student.studentID ? { ...item, grade } : item
                        )))
                      }}
                    >
                      <option value="">Select grade</option>
                      {['A', 'B', 'C', 'D', 'F'].map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => void submitGrade(student)}
                      disabled={!student.grade || gradeSavingStudent === student.studentID}
                    >
                      {gradeSavingStudent === student.studentID ? 'Saving…' : 'Save grade'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section id="faculty-alerts" className="dashboard-card" aria-labelledby="faculty-alerts-heading" tabIndex={-1}>
          <h2 id="faculty-alerts-heading">Alerts</h2>
          <p className="status-label">Live alerts unavailable</p>
          <p>Teaching reminders, schedule changes, and department announcements will appear here when notifications are connected.</p>
        </section>
        <section id="teaching-schedule" className="dashboard-card" aria-labelledby="teaching-schedule-heading" tabIndex={-1}>
          <h2 id="teaching-schedule-heading">Teaching Schedule</h2>
          <p className="status-label" role="status">
            {scheduleLoading ? 'Loading schedule…' : `${schedule.length} schedule entr${schedule.length === 1 ? 'y' : 'ies'}`}
          </p>
          {scheduleError && <p className="field-error" role="alert">{scheduleError}</p>}
          {!scheduleLoading && !scheduleError && schedule.length === 0 && <p>No teaching schedule entries yet.</p>}
          {schedule.length > 0 && (
            <ul className="detail-list">
              {schedule.map((entry) => (
                <li key={entry.scheduleId}>
                  <strong>
                    {entry.meetingType === 'class'
                      ? `${entry.courseCode} section ${entry.section}`
                      : 'Office hours'}
                  </strong>
                  <br />
                  {entry.dayOfWeek}, {displayTime(entry.startTime)}–{displayTime(entry.endTime)} · {entry.location}
                  <div className="gpa-entry-row">
                    <button type="button" onClick={() => void removeScheduleEntry(entry)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form className="gpa-form" onSubmit={(event) => void submitSchedule(event)}>
            <h3>Add schedule entry</h3>
            <label htmlFor="schedule-type">Entry type</label>
            <select
              id="schedule-type"
              value={scheduleType}
              onChange={(event) => {
                const value = event.target.value
                if (value === 'class' || value === 'office_hours') setScheduleType(value)
              }}
            >
              <option value="class">Class meeting</option>
              <option value="office_hours">Office hours</option>
            </select>
            {scheduleType === 'class' && (
              <>
                <label htmlFor="schedule-course">Course</label>
                <select
                  id="schedule-course"
                  value={scheduleCourseId}
                  onChange={(event) => setScheduleCourseId(event.target.value)}
                  disabled={coursesLoading || courses.length === 0}
                  required
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseCode} section {course.section}
                    </option>
                  ))}
                </select>
                {coursesLoading && <p role="status">Loading available courses…</p>}
                {coursesError && <p className="field-error" role="alert">Courses could not be loaded. Try again later, or choose office hours.</p>}
                {!coursesLoading && !coursesError && courses.length === 0 && (
                  <p>No courses are available for class meetings. You can still add office hours.</p>
                )}
              </>
            )}
            <label htmlFor="schedule-day">Day</label>
            <select
              id="schedule-day"
              value={scheduleDay}
              onChange={(event) => {
                const value = event.target.value
                if (isWeekday(value)) setScheduleDay(value)
              }}
            >
              {weekdays.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <div className="schedule-time-fields">
              <div>
                <label htmlFor="schedule-start">Starts</label>
                <input id="schedule-start" type="time" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="schedule-end">Ends</label>
                <input id="schedule-end" type="time" min={scheduleStart} value={scheduleEnd} onChange={(event) => setScheduleEnd(event.target.value)} required />
              </div>
            </div>
            <label htmlFor="schedule-location">Room or location</label>
            <input id="schedule-location" value={scheduleLocation} onChange={(event) => setScheduleLocation(event.target.value)} required />
            <button type="submit" disabled={scheduleSaving || (scheduleType === 'class' && (coursesLoading || courses.length === 0))}>
              {scheduleSaving ? 'Saving schedule…' : 'Add to schedule'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Dashboardfaculty
