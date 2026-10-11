import { useEffect, useId, useState, type FormEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isTranscript, type Transcript } from './transcriptApi'

// Use the local API unless a different API address is provided.
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
}

function TranscriptCard({ id, apiBaseUrl = defaultApiBaseUrl }: TranscriptCardProps) {
  const labelId = useId()
  const [studentID, setStudentID] = useState('1001')
  const [request, setRequest] = useState({ studentID: '1001' })
  const [result, setResult] = useState({
    transcript: null as Transcript | null,
    isLoading: true,
    error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setResult({ transcript: null, isLoading: true, error: '' })

    const timeout = window.setTimeout(() => {
      controller.abort()
      setResult({
        transcript: null,
        isLoading: false,
        error: 'The transcript request timed out. Please try again.',
      })
    }, 15000)

    async function getTranscript() {
      try {
        // The route should return one student object, not the entire students array.
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${request.studentID}`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return

        const transcript = response.data
        if (!isTranscript(transcript) || transcript.studentID !== request.studentID) {
          throw new Error('The transcript service returned an unexpected response. Please try again.')
        }
        setResult({ transcript, isLoading: false, error: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return

        let error = 'Unable to load the transcript. Please try again.'
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (status === 404) {
            error = `No mock student was found with student ID ${request.studentID}. Try 1001–1005.`
          } else if (status) {
            error = `The transcript request failed (HTTP ${status}). Please try again.`
          } else {
            error = 'Unable to reach the transcript service. Check your connection and try again.'
          }
        } else if (requestError instanceof Error) {
          error = requestError.message
        }
        setResult({ transcript: null, isLoading: false, error })
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void getTranscript()

    // Cancel the old request when this effect runs again or the component unmounts.
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [apiBaseUrl, request])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const nextStudentID = studentID.trim()
    if (!/^\d{4}$/.test(nextStudentID)) {
      setInputError('Enter a four-digit student ID, such as 1001.')
      return
    }

    setInputError('')
    setStudentID(nextStudentID)
    // A new object allows the same ID to be requested again after an error.
    setRequest({ studentID: nextStudentID })
  }

  let status = 'No transcript loaded.'
  if (isLoading) status = `Loading transcript for ${request.studentID}…`
  else if (transcript) status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`
  else if (error) status = 'Transcript could not be loaded.'

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>Transcript</h2>
      <p>Explore fictional student records for this classroom exercise.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>
        <div className="transcript-card-controls">
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
            aria-describedby={inputError
              ? `${labelId}-help ${labelId}-input-error`
              : `${labelId}-help`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load Transcript'}
          </button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">
          Enter a four-digit student ID. Mock students: 1001–1005.
        </p>
        {inputError && (
          <p id={`${labelId}-input-error`} className="transcript-card-error" role="alert">
            {inputError}
          </p>
        )}
      </form>

      <p className="transcript-card-status" role="status">{status}</p>
      {error && <p className="transcript-card-error" role="alert">{error}</p>}

      {transcript && (
        <div className="transcript-card-content">
          <div className="transcript-card-student">
            <h3>{transcript.firstName} {transcript.lastName}</h3>
            <p>{transcript.institution}</p>
            <p><strong>Student ID:</strong> {transcript.studentID}</p>
            <p><strong>Major:</strong> {transcript.major}</p>
            {transcript.isMockData && <p>Mock transcript for classroom use.</p>}
          </div>

          {/* Create one section for each semester in this student's transcript. */}
          {transcript.semesters.length === 0 ? (
            <p>No semesters are available for this student.</p>
          ) : (
            transcript.semesters.map((semester) => (
              <section className="transcript-card-semester" key={semester.term}>
                <h4>{semester.term}</h4>
                <div className="transcript-card-table-wrapper">
                  <table>
                    <caption>{semester.term} courses</caption>
                    <thead>
                      <tr>
                        <th scope="col">Course</th>
                        <th scope="col">Course Title</th>
                        <th scope="col">Credits</th>
                        <th scope="col">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Create one table row for each course in this semester. */}
                      {semester.courses.length === 0 ? (
                        <tr><td colSpan={4}>No courses recorded for this term.</td></tr>
                      ) : (
                        semester.courses.map((course) => (
                          <tr key={course.courseCode}>
                            <th scope="row">{course.courseCode}</th>
                            <td>{course.courseTitle}</td>
                            <td>{course.creditHours}</td>
                            <td>{course.grade}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="transcript-card-term-summary">
                  <strong>Term credits attempted:</strong> {semester.creditsAttempted}
                  {' | '}<strong>Term credits earned:</strong> {semester.creditsEarned}
                  {' | '}<strong>Term GPA:</strong> {semester.gpa.toFixed(2)}
                </p>
              </section>
            ))
          )}

          <section className="transcript-card-summary">
            <h3>Cumulative Summary</h3>
            <p><strong>Credits attempted:</strong> {transcript.summary.creditsAttempted}</p>
            <p><strong>Credits earned:</strong> {transcript.summary.creditsEarned}</p>
            <p><strong>Cumulative GPA:</strong> {transcript.summary.cumulativeGPA.toFixed(2)}</p>
          </section>
        </div>
      )}
    </section>
  )
}

export default TranscriptCard

