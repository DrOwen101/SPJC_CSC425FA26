import { useEffect, useState } from 'react'
import WeatherCard from './WeatherCard'
import StudentLookup from './StudentLookup'
import TranscriptCard from './TranscriptCard'
import CrudCard from './CrudCard'
import { apiError, dashboardApi, gradePoints, grades, options, readRecords, type DashboardRecord, type Field } from './dashboardApi'

const studentFields: Field[] = [
  { name: 'studentID', label: 'Student ID (four digits)', required: true, maxLength: 4, immutable: true },
  { name: 'firstName', label: 'First name', required: true, maxLength: 80 },
  { name: 'lastName', label: 'Last name', required: true, maxLength: 80 },
  { name: 'major', label: 'Major', required: true, maxLength: 120 },
]
const courseFields: Field[] = [
  { name: 'courseCode', label: 'Course code', required: true, maxLength: 20 },
  { name: 'courseTitle', label: 'Course title', required: true, maxLength: 160 },
  { name: 'creditHours', label: 'Credit hours', type: 'number', required: true, min: 1, max: 12 },
]
const gradeField: Field = { name: 'grade', label: 'Grade', type: 'select', options: options(grades), required: true }
const alertFields: Field[] = [
  { name: 'message', label: 'Message', required: true, maxLength: 500 },
  { name: 'dueDate', label: 'Due date', type: 'date' },
  { name: 'isRead', label: 'Read', type: 'checkbox' },
]

// Selecting a student remounts their cards, clearing old drafts and cancelling reads.
function StudentModules({ studentID, courses, revision, onChange }: {
  studentID: string; courses: DashboardRecord[]; revision: number; onChange: () => void
}) {
  const [enrollments, setEnrollments] = useState<DashboardRecord[]>([])
  const [error, setError] = useState('')
  const endpoint = `/api/students/${studentID}`
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    dashboardApi.get<unknown>(`${endpoint}/enrollments`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setEnrollments(readRecords(data))
    }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(apiError(failure)) })
    return () => controller.abort()
  }, [endpoint, revision])
  const enrollmentFields: Field[] = [
    { name: 'courseID', label: 'Course', type: 'select', required: true, options: courses.map((c) => ({ value: String(c.id), label: `${c.courseCode} — ${c.courseTitle}` })) },
    { name: 'term', label: 'Term', required: true, maxLength: 60 },
    { name: 'status', label: 'Status', type: 'select', required: true, options: options(['upcoming', 'completed']) },
    { ...gradeField, required: false },
    { name: 'meetingTime', label: 'Meeting time', maxLength: 120 },
    { name: 'location', label: 'Location', maxLength: 120 },
  ]
  const attendanceFields: Field[] = [
    { name: 'enrollmentID', label: 'Registration', type: 'select', required: true, options: enrollments.map((e) => ({ value: String(e.id), label: `${e.courseCode} — ${e.term}` })) },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'status', label: 'Attendance status', type: 'select', required: true, options: options(['present', 'absent', 'late', 'excused']) },
  ]
  return <>
    <CrudCard id="gpa" title="GPA" description="Saved practice grades · equal weight per grade. These do not change your transcript."
      endpoint={`${endpoint}/gpa-entries`} fields={[gradeField]} revision={revision} onChange={onChange}
      recordLabel={(r) => `${r.grade} · ${gradePoints[String(r.grade)].toFixed(1)} points`}
      summary={(records) => <p className="metric">{records.length ? (records.reduce((sum, r) => sum + gradePoints[String(r.grade)], 0) / records.length).toFixed(2) : '--'}</p>} />
    <CrudCard id="attendance" title="Attendance" description="Record attendance for a course registration. Late counts as attended; excused dates are excluded."
      endpoint={`${endpoint}/attendance`} fields={attendanceFields} revision={revision} onChange={onChange}
      recordLabel={(r) => `${r.courseCode} · ${r.term} · ${r.date} · ${r.status}`}
      summary={(records) => {
        const counted = records.filter((r) => r.status !== 'excused')
        return <p className="metric">{counted.length ? `${Math.round(counted.filter((r) => r.status !== 'absent').length / counted.length * 100)}%` : '--'}</p>
      }} />
    {error && <p role="alert" className="field-error">Registration options: {error} <button type="button" onClick={onChange}>Retry</button></p>}
    <TranscriptCard id="transcript" selectedStudentID={studentID} revision={revision} />
    <CrudCard id="alerts" title="Alerts" description="Manage academic reminders and mark notices as read."
      endpoint={`${endpoint}/alerts`} fields={alertFields} revision={revision} onChange={onChange}
      recordLabel={(r) => `${r.isRead ? 'Read' : 'Unread'} · ${r.message}${r.dueDate ? ` · Due ${r.dueDate}` : ''}`} />
    <CrudCard id="courses" title="Upcoming Courses" description="Manage registrations, meeting times, and locations. Set a course to completed and choose a final grade to include it in the transcript."
      endpoint={`${endpoint}/enrollments`} fields={enrollmentFields} revision={revision} onChange={onChange}
      deleteHelp="Its attendance records will also be deleted. A completed course will be removed from the transcript."
      summary={(records) => <p>{records.filter((r) => r.status === 'upcoming').length} upcoming course(s)</p>}
      recordLabel={(r) => `${r.courseCode} · ${r.courseTitle} · ${r.term} · ${r.status}${r.grade ? ` · ${r.grade}` : ''}${r.meetingTime ? ` · ${r.meetingTime}` : ''}${r.location ? ` · ${r.location}` : ''}`} />
  </>
}

export default function Dashboardstudent() {
  const [students, setStudents] = useState<DashboardRecord[]>([])
  const [courses, setCourses] = useState<DashboardRecord[]>([])
  const [selectedID, setSelectedID] = useState('1001')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = () => setRevision((value) => value + 1)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    Promise.all([
      dashboardApi.get<unknown>('/api/students', { signal: controller.signal }),
      dashboardApi.get<unknown>('/api/courses', { signal: controller.signal }),
    ]).then(([studentResponse, courseResponse]) => {
      if (controller.signal.aborted) return
      const next = readRecords(studentResponse.data, 'students')
      setStudents(next)
      setCourses(readRecords(courseResponse.data))
      setSelectedID((current) => next.some((s) => s.studentID === current) ? current : String(next[0]?.studentID ?? ''))
    }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(apiError(failure)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [revision])

  return <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
    <header className="dashboard-header">
      <p className="eyebrow">Your academic overview</p>
      <h1 id="student-title">Student Dashboard</h1>
      <p>Review your progress and manage fictional classroom records.</p>
    </header>
    <nav className="dashboard-nav" aria-label="Student sections"><ul>
      <li><a href="#gpa">GPA</a></li><li><a href="#attendance">Attendance</a></li>
      <li><a href="#student-lookup">Student lookup</a></li><li><a href="#transcript">Transcript</a></li>
      <li><a href="#alerts">Alerts</a></li><li><a href="#courses">Upcoming Courses</a></li>
    </ul></nav>
    <div className="dashboard-student-picker">
      <label htmlFor="dashboard-student">Student for dashboard modules</label>
      <select id="dashboard-student" value={selectedID} disabled={loading || students.length === 0} onChange={(event) => setSelectedID(event.target.value)}>
        {students.length === 0 && <option value="">No students available</option>}
        {students.map((s) => <option key={String(s.studentID)} value={String(s.studentID)}>{s.studentID} — {s.firstName} {s.lastName}</option>)}
      </select>
      <button type="button" onClick={refresh} disabled={loading}>Refresh dashboard</button>
      {loading && <p role="status">Loading dashboard…</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
    <div className="dashboard-grid">
      <StudentLookup key={`lookup-${revision}`} onSelectStudent={setSelectedID} />
      <WeatherCard />
      {selectedID && students.some((s) => s.studentID === selectedID) && <StudentModules key={selectedID} studentID={selectedID} courses={courses} revision={revision} onChange={refresh} />}
      <CrudCard id="student-records" title="Student records" description="Create or update student profiles. Student IDs stay fixed after creation."
        endpoint="/api/students" envelope="students" fields={studentFields} revision={revision} onChange={refresh}
        deleteHelp="All of this student's registrations, attendance, alerts, and practice grades will also be deleted."
        recordLabel={(r) => `${r.studentID} · ${r.firstName} ${r.lastName} · ${r.major}`} />
      <CrudCard id="course-catalog" title="Course catalog" description="Manage courses available for registration. Course edits also update their transcript entries."
        endpoint="/api/courses" fields={courseFields} revision={revision} onChange={refresh}
        deleteHelp="Courses with registrations cannot be deleted. Remove those registrations first."
        recordLabel={(r) => `${r.courseCode} · ${r.courseTitle} · ${r.creditHours} credits`} />
    </div>
  </main>
}
