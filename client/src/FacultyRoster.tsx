/** Student Records display pattern adapted for a faculty-only class roster. */
import { useEffect, useState } from 'react'
import axios from 'axios'

export type RosterStudent = {
  student_id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
}

type Props = { sectionId: number | null }
const API = 'http://localhost:3000/api/faculty'

function FacultyRoster({ sectionId }: Props) {
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setStudents([])
    setError('')
    if (sectionId === null) return
    const controller = new AbortController()
    setLoading(true)
    axios.get<{ students: RosterStudent[] }>(
      `${API}/sections/${sectionId}/students`,
      { withCredentials: true, signal: controller.signal },
    ).then(({ data }) => {
      if (!controller.signal.aborted) setStudents(data.students)
    }).catch((error) => {
      if (!axios.isCancel(error)) setError('Unable to load class roster.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [sectionId])

  return (
    <section id="class-rosters" className="dashboard-card student-records"
      aria-labelledby="class-rosters-heading" tabIndex={-1}>
      <h2 id="class-rosters-heading">Class Roster</h2>
      <p>Students enrolled in the selected faculty section.</p>
      {sectionId === null ? <p>Select an assigned section above.</p> : (
        <>
          {loading && <p role="status">Loading roster...</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
          {!loading && !error && (
            <>
              <h3>Enrolled Students ({students.length})</h3>
              {students.length === 0 ? <p>No students enrolled in this section.</p> : (
                <div className="student-records-table-wrapper">
                  <table className="student-records-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>{students.map((student) => (
                      <tr key={student.student_id}>
                        <td>{student.student_id}</td>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.email}</td>
                        <td>{student.is_active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
export default FacultyRoster
