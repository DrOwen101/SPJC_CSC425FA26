import { useEffect, useState } from 'react'
import axios from 'axios'
import { facultyApi } from './facultyApi'

type FacultyCourse = {
  sectionId: string
  courseCode: string
  term: string
  sectionName: string
}

type GradeRecord = {
  recordId: string
  studentID: string
  firstName: string
  lastName: string
  grade: string
}

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

function FacultyGradebook() {
  const [courses, setCourses] = useState<FacultyCourse[]>([])
  const [sectionId, setSectionId] = useState('')
  const [records, setRecords] = useState<GradeRecord[]>([])
  const [selectedGrades, setSelectedGrades] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('Loading courses…')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await facultyApi.get<{ courses: FacultyCourse[] }>('/api/faculty/courses')
        setCourses(response.data.courses)
        if (response.data.courses.length > 0) {
          setSectionId(response.data.courses[0].sectionId)
        } else {
          setMessage('No course sections are assigned to the faculty account.')
        }
      } catch {
        setMessage('Could not load faculty courses. Check that the server and database are running.')
      }
    }
    void loadCourses()
  }, [])

  useEffect(() => {
    if (!sectionId) return

    async function loadGrades() {
      setRecords([])
      setMessage('Loading grades…')
      try {
        const response = await facultyApi.get<{ records: GradeRecord[] }>(
          `/api/faculty/courses/${sectionId}/gradebook`,
        )
        setRecords(response.data.records)
        setSelectedGrades(Object.fromEntries(
          response.data.records.map((record) => [record.recordId, record.grade]),
        ))
        setMessage(
          response.data.records.length === 0
            ? 'No grade records were found for this section.'
            : '',
        )
      } catch {
        setMessage('Could not load this gradebook.')
      }
    }
    void loadGrades()
  }, [sectionId])

  async function saveGrade(record: GradeRecord) {
    setIsSaving(true)
    setMessage('')
    try {
      await facultyApi.put(
        `/api/faculty/courses/${sectionId}/records/${record.recordId}/grade`,
        { grade: selectedGrades[record.recordId] },
      )
      const response = await facultyApi.get<{ records: GradeRecord[] }>(
        `/api/faculty/courses/${sectionId}/gradebook`,
      )
      setRecords(response.data.records)
      setSelectedGrades(Object.fromEntries(
        response.data.records.map((item) => [item.recordId, item.grade]),
      ))
      setMessage(`Saved grade for ${record.firstName} ${record.lastName}.`)
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        setMessage(error.response?.data?.error || 'Could not save this grade.')
      } else {
        setMessage('Could not save this grade.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="grading" className="dashboard-card faculty-feature" aria-labelledby="grading-heading" tabIndex={-1}>
      <h2 id="grading-heading">Gradebook</h2>
      <p>Review and save a grade for a student in a demo faculty course.</p>
      <label htmlFor="gradebook-course">Course section</label>
      <select id="gradebook-course" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={courses.length === 0}>
        {courses.map((course) => (
          <option key={course.sectionId} value={course.sectionId}>
            {course.courseCode} · {course.term} · Section {course.sectionName}
          </option>
        ))}
      </select>
      {message && <p role="status">{message}</p>}
      {records.length > 0 && (
        <div className="faculty-table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Student</th><th scope="col">Grade</th><th scope="col">Save</th></tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.recordId}>
                  <td>{record.firstName} {record.lastName} ({record.studentID})</td>
                  <td>
                    <label className="visually-hidden" htmlFor={`grade-${record.recordId}`}>
                      Grade for {record.firstName} {record.lastName}
                    </label>
                    <select
                      id={`grade-${record.recordId}`}
                      value={selectedGrades[record.recordId] ?? record.grade}
                      onChange={(event) => setSelectedGrades({
                        ...selectedGrades,
                        [record.recordId]: event.target.value,
                      })}
                    >
                      {grades.map((grade) => <option key={grade}>{grade}</option>)}
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => void saveGrade(record)} disabled={isSaving}>
                      Save grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default FacultyGradebook
