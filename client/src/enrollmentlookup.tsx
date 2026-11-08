import React, { useEffect, useRef, useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios'
import './EnrollmentLookup.css'

// Single enrollment record type from PostgreSQL backend
export interface Enrollment {
  studentId: string
  classId: string
  status: string
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

export default function EnrollmentLookup(): JSX.Element {
  // Collection & loading state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string>('')

  // Form input states
  const [studentIdInput, setStudentIdInput] = useState<string>('')
  const [classIdInput, setClassIdInput] = useState<string>('')
  const [statusInput, setStatusInput] = useState<string>('enrolled')
  const [formError, setFormError] = useState<string>('')

  // AbortController ref to cancel ongoing HTTP requests on unmount or re-fetch
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(() => {
    loadEnrollments()
    return () => activeRequest.current?.abort()
  }, [])

  // 1. Fetch all enrollments (GET /api/enrollments)
  async function loadEnrollments() {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller

    setIsLoading(true)
    setFetchError('')

    try {
      const response = await axios.get<Enrollment[]>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/enrollments`,
        { signal: controller.signal, timeout: 15000 }
      )
      if (controller.signal.aborted) return

      setEnrollments(response.data)
    } catch (error: unknown) {
      if (controller.signal.aborted) return

      let message = 'Unable to load enrollment records. Please try again.'
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          message = 'The server request timed out. Please try again.'
        } else if (error.response) {
          message = `Failed to fetch enrollments (HTTP ${error.response.status}).`
        } else {
          message = 'Unable to connect to Express backend API on port 3000.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      setFetchError(message)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  // 2. Add new enrollment (POST /api/enrollments)
  async function handleAddEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const studentId = studentIdInput.trim()
    const classId = classIdInput.trim()

    if (!studentId || !classId) {
      setFormError('Both Student ID and Class ID are required.')
      return
    }

    try {
      await axios.post(`${apiBaseUrl.replace(/\/$/, '')}/api/enrollments`, {
        studentId,
        classId,
        status: statusInput,
      })

      // Reset form inputs on success
      setStudentIdInput('')
      setClassIdInput('')
      setStatusInput('enrolled')

      // Refresh list from PostgreSQL
      await loadEnrollments()
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setFormError(error.response?.data?.message || 'Failed to add enrollment.')
      } else if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError('An unknown error occurred.')
      }
    }
  }

  // 3. Remove enrollment (DELETE /api/enrollments)
  async function handleDeleteEnrollment(studentId: string, classId: string) {
    try {
      setFetchError('')
      await axios.delete(`${apiBaseUrl.replace(/\/$/, '')}/api/enrollments`, {
        data: { studentId, classId },
      })

      // Optimistically filter out row from state
      setEnrollments((prev) =>
        prev.filter((item) => !(item.studentId === studentId && item.classId === classId))
      )
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setFetchError(error.response?.data?.message || 'Failed to delete record.')
      } else if (error instanceof Error) {
        setFetchError(error.message)
      } else {
        setFetchError('An unknown error occurred.')
      }
    }
  }

  return (
    <section
      id="enrollments-card"
      className="dashboard-card enrollment-lookup"
      aria-labelledby="enrollments-heading"
    >
      <h2 id="enrollments-heading">Enrollments</h2>
      <p id="enrollment-help">
        Manage active course registrations stored in the PostgreSQL database.
      </p>

      {/* Add Record Form */}
      <form onSubmit={handleAddEnrollment} noValidate className="enrollment-form">
        <div className="enrollment-form-grid">
          <div>
            <label htmlFor="student-id-input">Student ID</label>
            <input
              id="student-id-input"
              type="text"
              placeholder="e.g. 1001"
              value={studentIdInput}
              onChange={(e) => {
                setStudentIdInput(e.target.value)
                setFormError('')
              }}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="class-id-input">Class ID</label>
            <input
              id="class-id-input"
              type="text"
              placeholder="e.g. CSC425"
              value={classIdInput}
              onChange={(e) => {
                setClassIdInput(e.target.value)
                setFormError('')
              }}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="status-select">Status</label>
            <select
              id="status-select"
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
            >
              <option value="enrolled">Enrolled</option>
              <option value="incomplete">incomplete</option>
              <option value="completed">Completed</option>
              <option value="dropped">dropped</option>
            </select>
          </div>
        </div>

        <button type="submit" className="add-enrollment-btn">
          Add Enrollment
        </button>

        {formError && (
          <p className="field-error" role="alert">
            {formError}
          </p>
        )}
      </form>

      {/* System Error Notification */}
      {fetchError && (
        <p className="field-error" role="alert">
          {fetchError}
        </p>
      )}

      {/* Data Table */}
      <div className="enrollment-table-area">
        <h3>Current Database Records</h3>
        {isLoading ? (
          <p role="status">Loading enrollment records from database...</p>
        ) : enrollments.length === 0 ? (
          <p role="status">No active enrollments found in PostgreSQL database.</p>
        ) : (
          <table className="enrollment-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Class ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row) => (
                <tr key={`${row.studentId}-${row.classId}`}>
                  <td>{row.studentId}</td>
                  <td>{row.classId}</td>
                  <td>
                    <span className={`status-badge status-${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteEnrollment(row.studentId, row.classId)}
                      aria-label={`Remove student ${row.studentId} from ${row.classId}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}