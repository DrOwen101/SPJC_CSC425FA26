{/* Attendance card .tsx */}
import { useEffect, useId, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import './AttendanceCard.css'
import { isAttendance, type Attendance } from './attendanceApi'

// Connect the API on the same computer as the front end, similar to the transcript
// set VITE_API_BASE_URL or pass apiBaseUrl in order to run a separately hosted API 

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL
|| `${window.location.protocol}//${window.location.hostname}:3000`

type AttendanceCardProps = {
  id?: string
  apiBaseUrl?: string
}

// The async Axios request is below; attendance.ts contains only data types and validation.
function AttendanceCard({ id, apiBaseUrl = defaultBaseUrl }: AttendanceCardProps) {
  const labelId = useId()
  const [studentID, setStudentID] = useState('1001')
  const [request, setRequest] = useState({ studentID: '1001' })
  const [result, setResult] = useState({
    attendance: null as Attendance | null, isLoading: true, error: '',
  })
  const { attendance, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setResult({ attendance: null, isLoading: true, error: '' })

    const timeout = window.setTimeout(() => {
      controller.abort()
      setResult({ attendance: null, isLoading: false, error: 'The attendance request timed out. Please try again.' })
    }, 15000)

    async function getAttendance() {
      try {
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/attendance/${request.studentID}`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        const attendance = response.data
        if (!isAttendance(attendance) || attendance.studentId !== request.studentID) {
          throw new Error('The attendance service returned an unexpected response. Please try again.')
        }
        setResult({ attendance, isLoading: false, error: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return
        let error = 'Unable to load the attendance. Please try again.'
        // Axios rejects HTTP errors (such as 404) as well as network failures.
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (status === 404) error = `No mock student was found with student ID ${request.studentID}. Try 1001–1003.`
          else if (status) error = `The attendance record request failed (HTTP ${status}). Please try again.`
          else error = 'Unable to reach the attendance service. Check your connection and try again.'
        } else if (requestError instanceof Error) {
          error = requestError.message
        }
        setResult({ attendance: null, isLoading: false, error })
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void getAttendance()

    // Cancel when leaving the dashboard or starting another request, so an
    // older response cannot overwrite the currently requested student's data.
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [apiBaseUrl, request])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    const nextStudentID = studentID.trim()
    if (!/^\d{4}$/.test(nextStudentID)) {
      setInputError('Enter a four-digit student ID, such as 1001.')
      return
    }

    setInputError('')
    setStudentID(nextStudentID)
    // A new request object also lets the same ID be loaded again after an error.
    setRequest({ studentID: nextStudentID })
  }

  let status = 'No attendance loaded.'
  if (isLoading) status = `Loading attendance for ${request.studentID}…`
  else if (attendance) status = `attendance loaded for ${attendance.studentName}.`

  return (
    <section id={id} className="attendance-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
     {/* // ASSIGNMENT DELIVERABLE CODE FOR LAB 6 */}
      <h2 id={`${labelId}-heading`}>Attendance</h2>
      <p>Explore fictional student attendance records for this classroom exercise.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>
        <div className="attendance-card-controls">
          <input
            id={`${labelId}-student-id`}
            name="studentID"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={studentID}
            onChange={(event) => {
              setStudentID(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Loading…' : 'Load Attendance'}</button>
        </div>
        <p id={`${labelId}-help`} className="attendance-card-help">Available mock student IDs: 1001–1005.</p>
        {inputError && <p id={`${labelId}-input-error`} className="attendance-card-error" role="alert">{inputError}</p>}
      </form>

      <p className="attendance-card-status" role="status">{status}</p>
      {error && <p className="attendance-card-error" role="alert">{error}</p>}

      {attendance && (
        <div className="attendance-card-record">
          <header>
            <h3>{attendance.studentName}</h3>
            <p>Student ID: {attendance.studentId}</p>
            <p>Date: {attendance.date}</p>
            <p>{attendance.status}</p>
            <p className="attendance-card-help">Mock Attendance Record · Not an official academic record</p>
          </header>
        </div>
      )}
    </section>
  )
}

export default AttendanceCard
