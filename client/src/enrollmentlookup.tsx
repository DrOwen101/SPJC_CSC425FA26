import React, { useEffect, useRef, useState } from 'react'
import type { FormEvent, JSX } from 'react'
import axios from 'axios'
import './EnrollmentLookup.css'

export interface Enrollment {
  studentId: string
  classId: string
  status: string
}

interface EnrollmentLookupProps {
  mode?: 'student' | 'faculty'
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

export default function EnrollmentLookup({ mode = 'student' }: EnrollmentLookupProps): JSX.Element {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string>('')

  const [studentIdInput, setStudentIdInput] = useState<string>('')
  const [classIdInput, setClassIdInput] = useState<string>('')
  const [statusInput, setStatusInput] = useState<string>('enrolled')
  const [classFilter, setClassFilter] = useState<string>('')
  const [formError, setFormError] = useState<string>('')

  const activeRequest = useRef<AbortController | null>(null)
  const isFaculty = mode === 'faculty'

  useEffect(() => {
    loadEnrollments()
    return () => activeRequest.current?.abort()
  }, [])

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
      setFetchError('Unable to load enrollment records. Please try again.')
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

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

      setStudentIdInput('')
      setClassIdInput('')
      setStatusInput('enrolled')
      await loadEnrollments()
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setFormError(error.response?.data?.message || 'Failed to add enrollment.')
      } else {
        setFormError('An unknown error occurred.')
      }
    }
  }

  async function handleStatusChange(studentId: string, classId: string, newStatus: string) {
    try {
      setFetchError('')
      await axios.patch(
        `${apiBaseUrl.replace(/\/$/, '')}/api/enrollments`,
        { studentId, classId, status: newStatus },
        { headers: { 'x-user-role': 'faculty' } }
      )
      setEnrollments((prev) =>
        prev.map((row) =>
          row.studentId === studentId && row.classId === classId
            ? { ...row, status: newStatus }
            : row
        )
      )
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setFetchError(error.response?.data?.message || 'Failed to update status.')
      }
    }
  }

  async function handleDeleteEnrollment(studentId: string, classId: string) {
    try {
      setFetchError('')
      await axios.delete(`${apiBaseUrl.replace(/\/$/, '')}/api/enrollments`, {
        data: { studentId, classId },
      })
      setEnrollments((prev) =>
        prev.filter((item) => !(item.studentId === studentId && item.classId === classId))
      )
    } catch {
      setFetchError('Failed to delete record.')
    }
  }

  const displayedEnrollments =
    isFaculty && classFilter.trim()
      ? enrollments.filter((row) =>
          String(row.classId).toLowerCase().includes(classFilter.trim().toLowerCase())
        )
      : enrollments

  return (
    <section
      id="enrollments-card"
      className="dashboard-card enrollment-lookup"
      aria-labelledby="enrollments-heading"
    >
      <h2 id="enrollments-heading">{isFaculty ? 'Class Roster Manager' : 'Enrollments'}</h2>
      <p id="enrollment-help">
        {isFaculty
          ? 'Filter class rosters by Course/Class ID and update student enrollment statuses.'
          : 'Manage active course registrations stored in the PostgreSQL database.'}
      </p>

      {isFaculty && (
        <div className="enrollment-form" style={{ marginBottom: '1rem' }}>
          <label htmlFor="faculty-class-filter">Filter Roster by Class ID</label>
          <input
            id="faculty-class-filter"
            type="text"
            placeholder="e.g. 101 or CSC425"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            autoComplete="off"
          />
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Showing <strong>{displayedEnrollments.length}</strong> of {enrollments.length} roster entries
          </p>
        </div>
      )}

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
              placeholder="e.g. 101"
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
              <option value="incomplete">Incomplete</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>

        <button type="submit" className="add-enrollment-btn">
          {isFaculty ? 'Add Student to Roster' : 'Add Enrollment'}
        </button>

        {formError && (
          <p className="field-error" role="alert">
            {formError}
          </p>
        )}
      </form>

      {fetchError && (
        <p className="field-error" role="alert">
          {fetchError}
        </p>
      )}

      <div className="enrollment-table-area">
        <h3>{isFaculty ? 'Active Class Roster' : 'Current Database Records'}</h3>
        {isLoading ? (
          <p role="status">Loading enrollment records from database...</p>
        ) : displayedEnrollments.length === 0 ? (
          <p role="status">No matching enrollments found.</p>
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
              {displayedEnrollments.map((row) => (
                <tr key={`${row.studentId}-${row.classId}`}>
                  <td>{row.studentId}</td>
                  <td>{row.classId}</td>
                  <td>
                    {isFaculty ? (
                      <select
                        aria-label={`Change status for student ${row.studentId}`}
                        value={row.status.toLowerCase()}
                        onChange={(e) =>
                          handleStatusChange(row.studentId, row.classId, e.target.value)
                        }
                      >
                        <option value="enrolled">enrolled</option>
                        <option value="incomplete">incomplete</option>
                        <option value="completed">completed</option>
                        <option value="dropped">dropped</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteEnrollment(row.studentId, row.classId)}
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