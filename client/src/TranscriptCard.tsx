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
  const [studentID, setStudentID] = useState('')
  const [request, setRequest] = useState({ studentID: '' })
  const [result, setResult] = useState({
    transcript: null as Transcript | null, isLoading: false, error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    if (!request.studentID) return
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
    <p>Explore fictional student records.</p>

    <form className="transcript-card-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={`${labelId}-student`}>Student ID</label>

      <div className="transcript-card-controls">
        <input
          id={`${labelId}-student`}
          name="studentID"
          type="text"
          value={studentID}
          onChange={(event) => setStudentID(event.target.value)}
          placeholder="1001"
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          aria-describedby={inputError ? `${labelId}-help ${labelId}-error` : `${labelId}-help`}
          aria-invalid={inputError ? true : undefined}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Transcript'}
        </button>
      </div>

      <p id={`${labelId}-help`} className="transcript-card-help">
        Available mock student IDs: 1001-1005.
      </p>

      {inputError && (
        <p id={`${labelId}-error`} className="transcript-card-error" role="alert">{inputError}</p>
      )}
    </form>

    {error && (
      <p className="transcript-card-error" role="alert">{error}</p>
    )}

    <p className="transcript-card-status" role="status" aria-live="polite">{status}</p>
    
    {transcript && (
      <div className="transcript-card-record">
        <h3>{transcript.firstName} {transcript.lastName}</h3>
        <p>{transcript.institution}</p>
        <p>Student ID: {transcript.studentID} • {transcript.major}</p>

        {transcript.isMockData && (
          <p>Mock transcript • Not an official academic record</p>
        )}

        {transcript.semesters.map((semester) => (
          <div className="transcript-card-semester" key={semester.term}>
            <h3>{semester.term}</h3>

            <div className="transcript-card-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Title</th>
                    <th>Credits</th>
                    <th>Grade</th>
                  </tr>
                </thead>

                <tbody>
                  {semester.courses.map((course) => (
                    <tr key={course.courseCode}>
                      <td>{course.courseCode}</td>
                      <td>{course.courseTitle}</td>
                      <td>{course.creditHours}</td>
                      <td>{course.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="transcript-card-term-summary">
              Term GPA: {semester.gpa.toFixed(2)} • Credits attempted:{' '}
              {semester.creditsAttempted} • Credits earned:{' '}
              {semester.creditsEarned}
            </p>
          </div>
        ))}

        <dl className="transcript-card-summary">
          <div>
            <dt>Cumulative GPA</dt>
            <dd>{transcript.summary.cumulativeGPA.toFixed(2)}</dd>
          </div>

          <div>
            <dt>Credits attempted</dt>
            <dd>{transcript.summary.creditsAttempted}</dd>
          </div>

          <div>
            <dt>Credits earned</dt>
            <dd>{transcript.summary.creditsEarned}</dd>
          </div>
        </dl>

        <p className="transcript-card-help">
          GPA is weighted by credit hours on a 4.0 scale.
          F grades count toward attempted credits but earn no credits.
        </p>
      </div>
    )}
    </section>
  )
}

export default TranscriptCard
