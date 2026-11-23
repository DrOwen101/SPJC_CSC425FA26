import { useEffect, useId, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isStudentsResponse, normalizeName } from './studentLookupApi'
import { isTranscript, type Transcript } from './transcriptApi'

const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
}

function TranscriptCardFV({ id, apiBaseUrl = defaultApiBaseUrl }: TranscriptCardProps) {
  const labelId = useId()
  const [searchText, setSearchText] = useState('1001')
  const [request, setRequest] = useState({ query: '1001' })
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

    async function getTranscript() {
      try {
        let studentID = request.query
        if (!/^\d{4}$/.test(request.query)) {
          const studentsResponse = await axios.get<unknown>(
            `${apiBaseUrl.replace(/\/$/, '')}/api/students`,
            { signal: controller.signal, timeout: 15000 },
          )
          if (controller.signal.aborted) return
          if (!isStudentsResponse(studentsResponse.data)) {
            throw new Error('The student service returned unexpected data. Please try again.')
          }

          const matches = studentsResponse.data.students.filter((student) =>
            normalizeName(`${student.firstName} ${student.lastName}`) === normalizeName(request.query),
          )
          if (matches.length === 0) {
            throw new Error(`No mock student was found with name “${request.query}”.`)
          }
          if (matches.length > 1) {
            throw new Error(`More than one student matches “${request.query}”. Search by student ID instead.`)
          }
          studentID = matches[0].studentID
        }

        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${encodeURIComponent(studentID)}`,
          { signal: controller.signal, timeout: 15000 },
        )
        if (controller.signal.aborted) return
        if (!isTranscript(response.data) || response.data.studentID !== studentID) {
          throw new Error('The transcript service returned an unexpected response. Please try again.')
        }
        setResult({ transcript: response.data, isLoading: false, error: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return
        let message = 'Unable to load the transcript. Please try again.'
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (requestError.code === 'ECONNABORTED') {
            message = 'The transcript request timed out. Please try again.'
          } else if (status === 404) {
            message = `No mock student was found with student ID ${request.query}.`
          } else if (status) {
            message = `The transcript request failed (HTTP ${status}). Please try again.`
          } else {
            message = 'Unable to reach the transcript service. Check your connection and try again.'
          }
        } else if (requestError instanceof Error) {
          message = requestError.message
        }
        setResult({ transcript: null, isLoading: false, error: message })
      }
    }

    void getTranscript()
    return () => controller.abort()
  }, [apiBaseUrl, request])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const query = searchText.trim()
    if (!query) {
      setInputError('Enter a four-digit student ID or a student’s full name.')
      return
    }
    if (/^\d+$/.test(query) && !/^\d{4}$/.test(query)) {
      setInputError('Student IDs must contain exactly four digits.')
      return
    }
    if (!/^\d{4}$/.test(query) && query.split(/\s+/).length < 2) {
      setInputError('Enter a student’s full name, such as Avery Morgan.')
      return
    }

    setInputError('')
    setSearchText(query)
    setRequest({ query })
  }

  let status = 'No transcript loaded.'
  if (isLoading) status = `Loading transcript for ${request.query}…`
  else if (transcript) status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>Transcript</h2>
      <p>Search fictional student records by student ID or full name.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-search`}>Student ID or full name</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-search`}
            name="studentSearch"
            type="text"
            autoComplete="off"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Loading…' : 'Load transcript'}</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Enter a four-digit ID or a full name, such as Avery Morgan.</p>
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
            {transcript.isMockData && <p className="transcript-card-help">Mock transcript · Not an official academic record</p>}
          </header>

          {transcript.semesters.map((semester) => (
            <div className="transcript-card-semester" key={semester.term}>
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

export default TranscriptCardFV
