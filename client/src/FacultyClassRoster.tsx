import { useEffect, useState } from 'react'
import { facultyApi } from './facultyApi'

type FacultyCourse = {
  sectionId: string
  courseCode: string
  term: string
  sectionName: string
}

type RosterStudent = {
  studentID: string
  firstName: string
  lastName: string
  major: string
}

function FacultyClassRoster() {
  const [courses, setCourses] = useState<FacultyCourse[]>([])
  const [sectionId, setSectionId] = useState('')
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [message, setMessage] = useState('Loading courses…')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await facultyApi.get<{ courses: FacultyCourse[] }>('/api/faculty/courses')
        setCourses(response.data.courses)
        if (response.data.courses.length > 0) {
          setSectionId(response.data.courses[0].sectionId)
        } else {
          setMessage('No course sections are assigned to the demo faculty account.')
        }
      } catch {
        setMessage('Could not load faculty courses. Check that the server and database are running.')
      }
    }
    void loadCourses()
  }, [])

  useEffect(() => {
    if (!sectionId) return

    async function loadRoster() {
      setIsLoading(true)
      setStudents([])
      setMessage('')
      try {
        const response = await facultyApi.get<{ students: RosterStudent[] }>(
          `/api/faculty/courses/${sectionId}/roster`,
        )
        setStudents(response.data.students)
        setMessage(
          response.data.students.length === 0
            ? 'No students are enrolled in this section.'
            : '',
        )
      } catch {
        setMessage('Could not load this class roster.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadRoster()
  }, [sectionId])

  return (
    <section id="class-rosters" className="dashboard-card faculty-feature" aria-labelledby="class-rosters-heading" tabIndex={-1}>
      <h2 id="class-rosters-heading">Class roster</h2>
      <p>Choose one of the demo faculty course sections to see its students.</p>
      <label htmlFor="roster-course">Course section</label>
      <select id="roster-course" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={courses.length === 0}>
        {courses.map((course) => (
          <option key={course.sectionId} value={course.sectionId}>
            {course.courseCode} · {course.term} · Section {course.sectionName}
          </option>
        ))}
      </select>
      {isLoading && <p role="status">Loading roster…</p>}
      {message && <p role="status">{message}</p>}
      {students.length > 0 && (
        <div className="faculty-table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Student ID</th><th scope="col">Name</th><th scope="col">Major</th></tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentID}>
                  <td>{student.studentID}</td>
                  <td>{student.firstName} {student.lastName}</td>
                  <td>{student.major}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default FacultyClassRoster
