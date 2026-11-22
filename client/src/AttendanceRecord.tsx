import { useEffect, useState, type SubmitEvent } from 'react'
import './AttendanceRecord.css'

type Student = {
  studentID: string
  firstName: string
  lastName: string
  major: string
}

type Course = {
  courseCode: string
  courseTitle: string
  creditHours: number
}

type AttendanceRecord = {
  studentID: string
  courseCode: string
  attendanceDate: string
  status: 'Present' | 'Absent' | 'Excused'
}

const attendanceStatuses = ['Present', 'Absent', 'Excused'] as const
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function AttendanceRecord() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [studentID, setStudentID] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(today)
  const [status, setStatus] = useState<(typeof attendanceStatuses)[number]>('Present')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Load the Students
  // Runs once after the component initially appears.
  useEffect(() => {
    const controller = new AbortController()

    async function loadStudents() {
      try {
        // This requests GET /api/students.
        const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/students`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Student request failed (HTTP ${response.status}).`)
        const data = await response.json() as { students: Student[] }
        if (!Array.isArray(data.students)) throw new Error('The student service returned unexpected data.')
        
        // This is where the component stores the array.
        setStudents(data.students)

        // This selects the first student.
        if (data.students.length > 0) setStudentID(data.students[0].studentID)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load students.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadStudents()
    return () => controller.abort()
  }, []) // This line is the dependency array. An empty array means this effect runs only once after the component initially appears.

  // Load the courses and records.
  useEffect(() => {
    if (!studentID) return
    const controller = new AbortController()
    setCourses([])
    setCourseCode('')
    setRecords([])
    setError('')

    async function loadStudentData() {
      try {
        const [coursesResponse, recordsResponse] = await Promise.all([
          fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/courses/${studentID}`, { signal: controller.signal }),
          fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/attendance?studentID=${studentID}`, { signal: controller.signal }),
        ])
        if (!coursesResponse.ok) throw new Error(`Course request failed (HTTP ${coursesResponse.status}).`)
        const courseData = await coursesResponse.json() as { courses: Course[] }
        // Where the returned courses get stored.
        setCourses(Array.isArray(courseData.courses) ? courseData.courses : [])
        if (courseData.courses?.length) setCourseCode(courseData.courses[0].courseCode)

        if (!recordsResponse.ok) {
          if (recordsResponse.status === 503) {
            setError('The database is unavailable. Configure server/.env and start PostgreSQL.')
          } else {
            throw new Error(`Attendance request failed (HTTP ${recordsResponse.status}).`)
          }
        } else {
          const recordData = await recordsResponse.json() as { records: AttendanceRecord[] }
          // Where the returned attendance records get stored.
          setRecords(Array.isArray(recordData.records) ? recordData.records : [])
        }
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'Unable to load attendance data.')
      }
    }

    void loadStudentData()
    return () => controller.abort()
  }, [studentID]) // The dependency array has studentID, so this effect runs
  // after the component initially appears and whenever studentID changes.

  // The actual function for saving attendance.
  async function saveAttendance(event: SubmitEvent<HTMLFormElement>) {
    // Stops the browser from refreshing the page when the form is submitted.
    event.preventDefault()
    setMessage('')
    setError('')
    // The component validates the necessary values.
    if (!studentID || !courseCode || !attendanceDate) {
      setError('Select a student and course, and enter a date.')
      return
    }

    try { // Try to send data from client to server. This is what a POST request is.
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentID, courseCode, attendanceDate, status }), // JSON Stringify converts the JavaScript into JSON that the server can read.
      })
      const data = await response.json() as { record?: AttendanceRecord; message?: string }
      if (!response.ok) throw new Error(data.message || `Attendance request failed (HTTP ${response.status}).`)
      setMessage(`Saved ${status.toLowerCase()} attendance for ${courseCode}.`)

      if (data.record) { // Immediately updates the table after saving.
        setRecords((current) => [
          data.record!,
          ...current.filter((record) =>
            !(record.courseCode === data.record?.courseCode && record.attendanceDate === data.record.attendanceDate),
          ),
        ].sort((left, right) => right.attendanceDate.localeCompare(left.attendanceDate)))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save attendance.')
    }
  }

  const selectedStudent = students.find((student) => student.studentID === studentID)

  // Controlled Form inputs.
  return (
    <section id="class-rosters" className="dashboard-card attendance-record" aria-labelledby="attendance-heading" tabIndex={-1}>
      <h2 id="attendance-heading">Class Rosters &amp; Attendance</h2>
      <p>Record and update attendance for a student and course.</p>

      {isLoading ? (
        <p role="status">Loading students…</p>
      ) : (
        // The dropdown is controlled by the value and onChange in the <select>.
        <form className="attendance-form" onSubmit={saveAttendance}>
          <label htmlFor="attendance-student">Student</label>
          <select id="attendance-student" value={studentID} onChange={(event) => setStudentID(event.target.value)}>
            // Students are displayued with map.
            {students.map((student) => (
              //  Helps identify the student in the dropdown and sets the value to the studentID.
              <option key={student.studentID} value={student.studentID}>
                {student.firstName} {student.lastName} ({student.studentID})
              </option>
            ))}
          </select>

          <label htmlFor="attendance-course">Course</label>
          <select id="attendance-course" value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
            {courses.map((course) => (
              <option key={course.courseCode} value={course.courseCode}>
                {course.courseCode} — {course.courseTitle}
              </option>
            ))}
          </select>

          <label htmlFor="attendance-date">Date</label>
          <input
            id="attendance-date"
            type="date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
          />

          <label htmlFor="attendance-status">Status</label>
          <select id="attendance-status" value={status} onChange={(event) => setStatus(event.target.value as (typeof attendanceStatuses)[number])}>
            {attendanceStatuses.map((attendanceStatus) => (
              <option key={attendanceStatus} value={attendanceStatus}>{attendanceStatus}</option>
            ))}
          </select>

          <button type="submit" disabled={!studentID || !courseCode}>Save attendance</button>
        </form>
      )}

      
      {message && <p className="attendance-success" role="status">{message}</p>}
      {error && <p className="attendance-error" role="alert">{error}</p>}
  
      {selectedStudent && (
        <>
          <h3>Saved records for {selectedStudent.firstName} {selectedStudent.lastName}</h3>
          {records.length === 0 ? (
            <p>No attendance records saved for this student.</p>
          ) : (
            // Where the table is rendered. Loops through and makes each saved record a row.
            <div className="attendance-table-scroll" role="region" aria-label="Saved attendance records" tabIndex={0}>
              <table className="attendance-table">
                <thead>
                  <tr><th scope="col">Course</th><th scope="col">Date</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={`${record.courseCode}-${record.attendanceDate}`}>
                      <th scope="row">{record.courseCode}</th>
                      <td>{record.attendanceDate}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default AttendanceRecord