import { useEffect, useId, useState, type FormEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isTranscript, type Transcript } from './transcriptApi'

// By default, connect to the API on the same computer as the frontend.
// For a separately hosted API, set VITE_API_BASE_URL or pass apiBaseUrl.
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
}

// The async Axios request is below; transcriptApi.ts contains only data types and validation.
function TranscriptCard({ id, apiBaseUrl = defaultApiBaseUrl }: TranscriptCardProps) {
  const labelId = useId()
  const [studentID, setStudentID] = useState('1001')
  const [request, setRequest] = useState({ studentID: '1001' })
  const [result, setResult] = useState({
    transcript: null as Transcript | null, isLoading: true, error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setResult({ transcript: null, isLoading: true, error: '' })

    const timeout = window.setTimeout(() => {
      controller.abort()
      setResult({ transcript: null, isLoading: false, error: 'The transcript request timed out. Please try again.' })
    }, 15000)

    async function getTranscript() {
      try {
        // Call the Express GET /api/transcripts/:studentID route in the server folder.
        // await waits for the response; Axios puts the parsed JSON in response.data.
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
        // Axios rejects HTTP errors (such as 404) as well as network failures.
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (status === 404) error = `No mock student was found with student ID ${request.studentID}. Try 1001–1005.`
          else if (status) error = `The transcript request failed (HTTP ${status}). Please try again.`
          else error = 'Unable to reach the transcript service. Check your connection and try again.'
        } else if (requestError instanceof Error) {
          error = requestError.message
        }
        setResult({ transcript: null, isLoading: false, error })
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void getTranscript()

    // Cancel when leaving the dashboard or starting another request, so an
    // older response cannot overwrite the currently requested student's data.
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
    // A new request object also lets the same ID be loaded again after an error.
    setRequest({ studentID: nextStudentID })
  }

  let status = 'No transcript loaded.'
  if (isLoading) status = `Loading transcript for ${request.studentID}…`
  else if (transcript) status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>




      <h2 id={`${labelId}-heading`}>Student Transcript</h2>

      <form onSubmit={handleSubmit} aria-describedby={`${labelId}-status`}>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>
        <input id={`${labelId}-student-id`} type="text" inputMode="numeric" value={studentID} onChange={e => setStudentID(e.target.value)} aria-invalid={Boolean(inputError)} aria-describedby={inputError ? `${labelId}-input-error` : undefined} />
        <button type="submit" disabled={isLoading}>Load Transcript</button>
      </form>

      {inputError && <p id={`${labelId}-input-error`} role="alert">{inputError}</p>}
      <p id={`${labelId}-status`} role="status" aria-live="polite">{status}</p>
      {error && <p role="alert" className="transcript-error">{error}</p>}

      {transcript && (
        <div className="transcript-content">
          <h3>{transcript.firstName} {transcript.lastName}</h3>
          <p><strong>Student ID:</strong> {transcript.studentID} | <strong>Major:</strong> {transcript.major}</p>
          <p><strong>Institution:</strong> {transcript.institution}</p>
          {transcript.isMockData && <p>This transcript contains mock data.</p>}

          {transcript.semesters.map((semester, i) => (
            <section key={`${semester.term}-${i}`} className="transcript-semester" aria-labelledby={`${labelId}-semester-${i}`}>
              <h4 id={`${labelId}-semester-${i}`}>{semester.term}</h4>
              <table>
                <caption>Courses for {semester.term}</caption>
                <thead><tr><th scope="col">Course Code</th><th scope="col">Course Title</th><th scope="col">Credits</th><th scope="col">Grade</th></tr></thead>
                <tbody>
                  {semester.courses.map((course, j) => (
                    <tr key={`${course.courseCode}-${j}`}>
                      <td>{course.courseCode}</td><td>{course.courseTitle}</td><td>{course.creditHours}</td><td>{course.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p><strong>Credits Attempted:</strong> {semester.creditsAttempted} | <strong>Credits Earned:</strong> {semester.creditsEarned} | <strong>Term GPA:</strong> {semester.gpa.toFixed(2)}</p>
            </section>
          ))}

          <section className="transcript-summary" aria-labelledby={`${labelId}-summary`}>
            <h4 id={`${labelId}-summary`}>Cumulative Summary</h4>
            <p><strong>Credits Attempted:</strong> {transcript.summary.creditsAttempted} | <strong>Credits Earned:</strong> {transcript.summary.creditsEarned}</p>
            <p><strong>Cumulative GPA:</strong> {transcript.summary.cumulativeGPA.toFixed(2)}</p>
          </section>
        </div>
      )}
    
    
    
    </section>
  )
}

export default TranscriptCard
