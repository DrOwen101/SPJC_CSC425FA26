import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isTranscript, type Transcript } from './transcriptApi'
import { normalizeName } from './studentLookupApi'

// By default, connect to the API on the same computer as the frontend.
// For a separately hosted API, set VITE_API_BASE_URL or pass apiBaseUrl.
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || ''

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
}

// The async Axios request is below; transcriptApi.ts contains only data types and validation.
function TranscriptCard({ id, apiBaseUrl = defaultApiBaseUrl }: TranscriptCardProps) {
  const labelId = useId()
  const [studentName, setStudentName] = useState('')
  const [requestedName, setRequestedName] = useState('')
  const [result, setResult] = useState({
    transcript: null as Transcript | null, isLoading: false, error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => () => activeRequest.current?.abort(), [])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    activeRequest.current?.abort()
    const name = studentName.trim()
    setRequestedName(name)
    setInputError('')
    setResult({ transcript: null, isLoading: false, error: '' })
    if (!name) {
      setInputError('Enter the student’s first and last name before searching.')
      return
    }
    const controller = new AbortController()
    activeRequest.current = controller
    setResult({ transcript: null, isLoading: true, error: '' })
    try {
      const response = await axios.get<unknown>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts`,
        { params: { name }, signal: controller.signal, timeout: 15000 },
      )
      if (controller.signal.aborted) return
      const transcript = response.data
      if (!isTranscript(transcript)
        || normalizeName(`${transcript.firstName} ${transcript.lastName}`) !== normalizeName(name)) {
        throw new Error('The transcript service returned an unexpected response. Please try again.')
      }
      setResult({ transcript, isLoading: false, error: '' })
    } catch (requestError) {
      if (controller.signal.aborted) return
      let error = 'Unable to load the transcript. Please try again.'
      if (axios.isAxiosError(requestError)) {
        const message: unknown = requestError.response?.data?.message
        if (typeof message === 'string') error = message
        else if (requestError.code === 'ECONNABORTED') error = 'The transcript request timed out. Please try again.'
        else error = 'Unable to reach the transcript service. Check your connection and try again.'
      } else if (requestError instanceof Error) {
        error = requestError.message
      }
      setResult({ transcript: null, isLoading: false, error })
    }
  }

  let status = 'No transcript loaded.'
  if (isLoading) status = `Loading transcript for ${requestedName}…`
  else if (transcript) status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>Transcript</h2>
      <p>Search saved transcripts by the student’s first and last name.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-name`}>Student First Last Name</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-name`}
            name="studentName"
            type="text"
            autoComplete="off"
            value={studentName}
            onChange={(event) => {
              setStudentName(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit">Search</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Enter both first and last name. Capitalization does not matter.</p>
        {inputError && <p id={`${labelId}-input-error`} className="transcript-card-error" role="alert">{inputError}</p>}
      </form>

      <p className="transcript-card-status" role="status">{status}</p>
      {error && <p className="transcript-card-error" role="alert">{error}</p>}

      {transcript && (
        <div className="transcript-card-record">
          <header>
            <h3>{transcript.firstName} {transcript.lastName}</h3>
            <p>{transcript.institution}</p>
            <p>Student ID: {transcript.studentID} · {transcript.major}</p>
            {transcript.isMockData && <p className="transcript-card-help">Contains sample transcript data · Not an official academic record</p>}
          </header>

          {transcript.semesters.map((semester) => (
            <div className="transcript-card-semester" key={semester.term}>
              {/* A caption names each table; column headers describe its cells.
                  The focusable wrapper allows keyboard scrolling on phones. */}
              <div className="transcript-card-table-scroll" role="region" aria-label={`${semester.term} courses`} tabIndex={0}>
                <table>
                  <caption>{semester.term}</caption>
                  <thead><tr><th scope="col">Course</th><th scope="col">Title</th><th scope="col">Credits</th><th scope="col">Grade</th></tr></thead>
                  <tbody>
                    {semester.courses.map((course) => (
                      <tr key={course.courseCode}>
                        <th scope="row">{course.courseCode}</th>
                        <td>{course.courseTitle}</td>
                        <td>{course.creditHours}</td>
                        <td>{course.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="transcript-card-term-summary">Term GPA: <strong>{semester.gpa.toFixed(2)}</strong> · Credits attempted: {semester.creditsAttempted} · Credits earned: {semester.creditsEarned}</p>
            </div>
          ))}

          <dl className="transcript-card-summary">
            <div><dt>Cumulative GPA</dt><dd>{transcript.summary.cumulativeGPA.toFixed(2)}</dd></div>
            <div><dt>Credits attempted</dt><dd>{transcript.summary.creditsAttempted}</dd></div>
            <div><dt>Credits earned</dt><dd>{transcript.summary.creditsEarned}</dd></div>
          </dl>
          <p className="transcript-card-help">GPA is weighted by credit hours on a 4.0 scale. F grades count toward attempted credits but earn no credits.</p>
        </div>
      )}
    </section>
  )
}

export default TranscriptCard
