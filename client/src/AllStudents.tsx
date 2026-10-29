import { useEffect, useId, useState } from 'react'
import { listStudentRecords, studentRecordsError, type StudentRecord } from './studentRecordsApi'

type AllStudentsProps = {
  id?: string
  refreshKey?: number
  onSelect?: (studentId: number) => void
}

// Works on its own. A parent can optionally connect View to a record editor
// and change refreshKey after saving or deleting a student elsewhere.
export default function AllStudents({ id, refreshKey = 0, onSelect }: AllStudentsProps) {
  const labelId = useId()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 5
  const lastPage = Math.max(0, Math.ceil(students.length / pageSize) - 1)
  const visiblePage = Math.min(page, lastPage)
  const visibleStudents = students.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize)

  useEffect(() => {
    const controller = new AbortController()
    setBusy(true)
    setError('')
    // Define an async function inside the effect so the effect can return cleanup.
    async function loadStudents() {
      try {
        const records = await listStudentRecords(controller.signal)
        if (controller.signal.aborted) return

        // Updating state tells React to display the returned students.
        setStudents(records)
      } catch (error) {
        if (controller.signal.aborted) return

        setStudents([])
        setError(studentRecordsError(error))
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false)
        }
      }
    }

    // Start the request. loadStudents handles any errors in its catch block.
    void loadStudents()

    // Cancel an old request when refreshing or leaving this component.
    return () => controller.abort()
  }, [refreshKey, refreshCount])

  let statusMessage = 'Student records loaded.'
  if (busy) {
    statusMessage = 'Loading student records…'
  } else if (error) {
    statusMessage = ''
  }

  return (
    <section id={id} className="dashboard-card all-students" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <details className="records-list" open>
        <summary><h2 id={`${labelId}-heading`}>All students ({students.length})</h2></summary>
        <div className="all-students-content">
          <button type="button" disabled={busy} onClick={() => setRefreshCount((count) => count + 1)}>Refresh list</button>
          <p role="status">{statusMessage}</p>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="records-table-scroll" role="region" aria-label="Saved student records" tabIndex={0}>
            <table>
              <caption>{students.length} saved student records</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Student</th>
                  <th scope="col">Major</th>
                  <th scope="col">Status</th>
                  {onSelect && <th scope="col">Action</th>}
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>
                      {student.firstName} {student.lastName}
                      <br />
                      <small>{student.email}</small>
                    </td>
                    <td>{student.majorName}</td>
                    <td>{student.isActive ? 'Active' : 'Inactive'}</td>
                    {onSelect && (
                      <td>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`View student ${student.id}`}
                          onClick={() => onSelect(student.id)}
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!busy && !error && students.length === 0 && <p>No student records found.</p>}
          </div>
          <nav className="records-actions" aria-label="Student records pages">
            <button type="button" disabled={busy || visiblePage === 0} onClick={() => setPage(visiblePage - 1)}>Previous</button>
            <span>Page {visiblePage + 1} of {lastPage + 1}</span>
            <button type="button" disabled={busy || visiblePage === lastPage} onClick={() => setPage(visiblePage + 1)}>Next</button>
          </nav>
        </div>
      </details>
    </section>
  )
}
