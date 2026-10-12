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
      <h2 id={`${labelId}-heading`}>Transcript</h2>
      <p>Explore fictional student records for this classroom exercise.</p>

      <form className="transcript-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="id-entry">Student ID</label>
        <div className="transcript-card-controls">
          <input
            // Data Points
            id={`${labelId}-student-id`}
            name="studentID"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder='1001'
            // Change event logic
            value={studentID}
            onChange={(event) => {
              setStudentID(event.target.value)
              setInputError('')
            }}
            // Error Handling Logic
            aria-describedby={inputError ? `${labelId}-help ${labelId}-input-error` : `${labelId}-help`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit">Load transcript</button>
        </div>
        <p id={`${labelId}-help`} className={`transcript-card-help`}>Available mock student IDs: 1001-1005.</p>
        {inputError && <p id={`${labelId}-input-error`} className={`transcript-card-error`} role="alert">{inputError}</p>}
        <p id="transcript-status" className={`transcript-card-status`}>{status}</p>
      </form>
      <div className='transcript-card-record'>
        {/* Question mark prevents code from crashing if the transcript variable is null or undefined */}
        <h2 id='transcript-name'>{transcript?.firstName} {transcript?.lastName}</h2>
        <p id='transcript-name'>{transcript?.institution}</p>
        <p id='transcript-name'>Student ID: {transcript?.studentID} &middot; {transcript?.major}</p>
        <p id='disclaimer' className='transcript-card-status'>Mock transcript - Not an official academic record</p>
        <table>
          <caption id='semester-info'>{transcript?.semesters[0].term}</caption>
          <thead>
            <tr>
              <th>Course</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tr>
            <th>{transcript?.semesters[0].courses[0].courseCode}</th>
            <td>{transcript?.semesters[0].courses[0].courseTitle}</td>
            <td>{transcript?.semesters[0].courses[0].creditHours}</td>
            <td>{transcript?.semesters[0].courses[0].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[0].courses[1].courseCode}</th>
            <td>{transcript?.semesters[0].courses[1].courseTitle}</td>
            <td>{transcript?.semesters[0].courses[1].creditHours}</td>
            <td>{transcript?.semesters[0].courses[1].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[0].courses[2].courseCode}</th>
            <td>{transcript?.semesters[0].courses[2].courseTitle}</td>
            <td>{transcript?.semesters[0].courses[2].creditHours}</td>
            <td>{transcript?.semesters[0].courses[2].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[0].courses[3].courseCode}</th>
            <td>{transcript?.semesters[0].courses[3].courseTitle}</td>
            <td>{transcript?.semesters[0].courses[3].creditHours}</td>
            <td>{transcript?.semesters[0].courses[3].grade}</td>
          </tr>
        </table>
        <p id='transcript-card-term-summary' className='transcript-card-term-summary'>Term GPA: <b>{transcript?.semesters[0].gpa}</b> &middot; Credits attempted: {transcript?.semesters[0].creditsAttempted} &middot; Credits earned: {transcript?.semesters[0].creditsEarned}</p>
        <table>
          <caption id='semester-info'>{transcript?.semesters[1].term}</caption>
          <thead>
            <tr>
              <th>Course</th>
              <th>Title</th>
              <th>Credits</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tr>
            <th>{transcript?.semesters[1].courses[0].courseCode}</th>
            <td>{transcript?.semesters[1].courses[0].courseTitle}</td>
            <td>{transcript?.semesters[1].courses[0].creditHours}</td>
            <td>{transcript?.semesters[1].courses[0].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[1].courses[1].courseCode}</th>
            <td>{transcript?.semesters[1].courses[1].courseTitle}</td>
            <td>{transcript?.semesters[1].courses[1].creditHours}</td>
            <td>{transcript?.semesters[1].courses[1].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[1].courses[2].courseCode}</th>
            <td>{transcript?.semesters[1].courses[2].courseTitle}</td>
            <td>{transcript?.semesters[1].courses[2].creditHours}</td>
            <td>{transcript?.semesters[1].courses[2].grade}</td>
          </tr>
          <tr>
            <th>{transcript?.semesters[1].courses[3].courseCode}</th>
            <td>{transcript?.semesters[1].courses[3].courseTitle}</td>
            <td>{transcript?.semesters[1].courses[3].creditHours}</td>
            <td>{transcript?.semesters[1].courses[3].grade}</td>
          </tr>
        </table>
        <p id='transcript-card-term-summary' className='transcript-card-term-summary'>Term GPA: <b>{transcript?.semesters[1].gpa}</b> &middot; Credits attempted: {transcript?.semesters[1].creditsAttempted} &middot; Credits earned: {transcript?.semesters[1].creditsEarned}</p>
        <div id='transcript-card-summary' className='transcript-card-summary'>
          <dl>
            <dt>Cumulative GPA</dt>
            <dd>{transcript?.summary.cumulativeGPA}</dd>
          </dl>
          <dl>
            <dt>Credits attempted</dt>
            <dd>{transcript?.summary.creditsAttempted}</dd>
          </dl>
          <dl>
            <dt>Credits earned</dt>
            <dd>{transcript?.summary.creditsEarned}</dd>
          </dl>
        </div>
        <p className='transcript-card-term-summary'>GPA is weighted by credit hours on a 4.0 scale. F grades count toward attempted credits but earn no credits.</p>
      </div>
    </section>
  )
}

export default TranscriptCard
