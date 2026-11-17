
import { useEffect, useState } from 'react'
import axios from 'axios'

type FacultySection = {
  id: number
  course_id: number
  semester: string
  section_code: string
}

type RosterStudent = {
  student_id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
}

const API_URL = 'http://localhost:3000/api/faculty'

function FacultyRoster() {
  const [sections, setSections] = useState<FacultySection[]>([])
  const [selectedSection, setSelectedSection] = useState('')
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load only sections assigned to the logged-in faculty member.
  useEffect(() => {
    async function loadSections() {
      try {
        const response = await axios.get<{ sections: FacultySection[] }>(
          `${API_URL}/sections`,
          { withCredentials: true }
        )

        setSections(response.data.sections)
      } catch {
        setError('Unable to load faculty sections. Please log in.')
      }
    }

    loadSections()
  }, [])

  // Load the students enrolled in the selected section.
  useEffect(() => {
    if (!selectedSection) {
      setStudents([])
      return
    }

    const controller = new AbortController()

    async function loadRoster() {
      setLoading(true)
      setError('')
      setStudents([])

      try {
        const response = await axios.get<{ students: RosterStudent[] }>(
          `${API_URL}/sections/${selectedSection}/students`,
          {
            withCredentials: true,
            signal: controller.signal,
          }
        )

        setStudents(response.data.students)
      } catch (error) {
        if (!axios.isCancel(error)) {
          setError('Unable to load the class roster.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadRoster()

    return () => controller.abort()
  }, [selectedSection])

  return (
    <section
      id="class-rosters"
      className="dashboard-card student-records"
      aria-labelledby="class-rosters-heading"
    >
      <h2 id="class-rosters-heading">Class Roster</h2>
      <p>View students enrolled in your assigned sections.</p>

      <label htmlFor="faculty-section">Select a section</label>
      <select
        id="faculty-section"
        value={selectedSection}
        onChange={(event) => setSelectedSection(event.target.value)}
      >
        <option value="">Choose a section</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            Course #{section.course_id} - Section {section.section_code} ({section.semester})
          </option>
        ))}
      </select>

      {error && <p className="field-error" role="alert">{error}</p>}
      {loading && <p role="status">Loading roster...</p>}

      {!loading && selectedSection && !error && (
        <>
          <h3>Enrolled Students ({students.length})</h3>

          {students.length === 0 ? (
            <p>No students enrolled in this section.</p>
          ) : (
            <div className="student-records-table-wrapper">
              <table className="student-records-table">
                <thead>
                  <tr>
                    <th scope="col">Student ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.student_id}</td>
                      <td>{student.first_name} {student.last_name}</td>
                      <td>{student.email}</td>
                      <td>{student.is_active ? 'Active' : 'Inactive'}</td>
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

export default FacultyRoster
