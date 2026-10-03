import { useEffect, useId, useState, type FormEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isTranscript, type Transcript } from './transcriptApi'
import { type Course } from './transcriptApi'
import { type Semester } from './transcriptApi'


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
      <h2 id={`${labelId}-heading`}>Transcript</h2>
      <form onSubmit={handleSubmit} className="transcript-form">
        <label htmlFor={`${labelId}-studentID`}>Student ID</label>
        <input
          id={`${labelId}-studentID`}
          type="text"
          value={studentID}
          onChange={(e) => setStudentID(e.target.value)}
          placeholder="Enter student ID"
        />
        <button type="submit" disabled={isLoading}>
          Load Transcript
        </button>
      </form>
      {inputError && <p className="field-error" role="alert">{inputError}</p>}
      <p className="status-label">{status}</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      {transcript && (
        <div className="transcript-details">
          <p><strong>Student:</strong> {transcript.firstName} {transcript.lastName}</p>
          <p><strong>Major:</strong> {transcript.major}</p>
          <p><strong>Institution:</strong> {transcript.institution}</p>
          <p><strong>Credits Attempted:</strong> {transcript.summary.creditsAttempted}</p>
          <p><strong>Credits Earned:</strong> {transcript.summary.creditsEarned}</p>
          <h3>Courses</h3>
          {transcript.semesters.map((semester: Semester) => (
            <div key={semester.term} className="semester">
              <h4>{semester.term} ({semester.creditsEarned}/{semester.creditsAttempted} credit hours)</h4>
              <ul>
                {semester.courses.map((course: Course) => (
                  <li key={course.courseCode}>
                    <strong>{course.courseTitle}</strong> ({course.creditHours} credit hours) - {course.grade}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default TranscriptCard
