import { useEffect, useId, useState, type FormEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isTranscript, type Transcript } from './transcriptApi'

const defaultApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
}

function TranscriptCard({
  id,
  apiBaseUrl = defaultApiBaseUrl,
}: TranscriptCardProps) {
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

    setResult({
      transcript: null,
      isLoading: true,
      error: '',
    })

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
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${request.studentID}`,
          { signal: controller.signal },
        )

        if (controller.signal.aborted) return

        const transcript = response.data

        if (
          !isTranscript(transcript) ||
          transcript.studentID !== request.studentID
        ) {
          throw new Error(
            'The transcript service returned an unexpected response. Please try again.',
          )
        }

        setResult({
          transcript,
          isLoading: false,
          error: '',
        })
      } catch (requestError) {
        if (controller.signal.aborted) return

        let error = 'Unable to load the transcript. Please try again.'

        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status

          if (status === 404) {
            error =
              `No mock student was found with student ID ${request.studentID}. ` +
              'Try 1001–1005.'
          } else if (status) {
            error =
              `The transcript request failed (HTTP ${status}). ` +
              'Please try again.'
          } else {
            error =
              'Unable to reach the transcript service. ' +
              'Check your connection and try again.'
          }
        } else if (requestError instanceof Error) {
          error = requestError.message
        }

        setResult({
          transcript: null,
          isLoading: false,
          error,
        })
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void getTranscript()

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
    setRequest({ studentID: nextStudentID })
  }

  let status = 'No transcript loaded.'

  if (isLoading) {
    status = `Loading transcript for ${request.studentID}…`
  } else if (transcript) {
    status =
      `Transcript loaded for ${transcript.firstName} ` +
      `${transcript.lastName}.`
  }

  return (
    <section
      id={id}
      className="transcript-card"
      aria-labelledby={`${labelId}-heading`}
      tabIndex={-1}
    >
      <h2 id={`${labelId}-heading`}>Student Transcript</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>

        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-id`}
            type="text"
            inputMode="numeric"
            value={studentID}
            onChange={(event) => {
              setStudentID(event.target.value)
              setInputError('')
            }}
            aria-invalid={Boolean(inputError)}
            aria-describedby={
              inputError
                ? `${labelId}-help ${labelId}-input-error`
                : `${labelId}-help`
            }
            disabled={isLoading}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load Transcript'}
          </button>
        </div>

        <p id={`${labelId}-help`} className="transcript-card-help">
          Enter a four-digit student ID. Try mock student IDs 1001–1005.
        </p>

        {inputError && (
          <p
            id={`${labelId}-input-error`}
            className="transcript-card-error"
            role="alert"
          >
            {inputError}
          </p>
        )}
      </form>

      <p className="transcript-card-status" role="status">
        {status}
      </p>

      {error && (
        <p className="transcript-card-error" role="alert">
          {error}
        </p>
      )}

      {transcript && (
        <div className="transcript-card-record">
          <h3>
            {transcript.firstName} {transcript.lastName}
          </h3>

          <p>
            <strong>Student ID:</strong> {transcript.studentID}
            <br />
            <strong>Major:</strong> {transcript.major}
            <br />
            <strong>Institution:</strong> {transcript.institution}
          </p>

          {transcript.isMockData && (
            <p className="transcript-card-help">
              This is mock transcript data for the lab.
            </p>
          )}

          {transcript.semesters.length === 0 && (
            <p>No semester records are available for this student.</p>
          )}

          {transcript.semesters.map((semester, semesterIndex) => (
            <section
              key={`${semester.term}-${semesterIndex}`}
              className="transcript-card-semester"
              aria-labelledby={`${labelId}-term-${semesterIndex}`}
            >
              <h3 id={`${labelId}-term-${semesterIndex}`}>
                {semester.term}
              </h3>

              {semester.courses.length > 0 ? (
                <div
                  className="transcript-card-table-scroll"
                  role="region"
                  aria-labelledby={`${labelId}-term-${semesterIndex}`}
                  tabIndex={0}
                >
                  <table>
                    <caption>{semester.term} Courses</caption>

                    <thead>
                      <tr>
                        <th scope="col">Course Code</th>
                        <th scope="col">Course Title</th>
                        <th scope="col">Credit Hours</th>
                        <th scope="col">Grade</th>
                      </tr>
                    </thead>

                    <tbody>
                      {semester.courses.map((course, courseIndex) => (
                        <tr key={`${course.courseCode}-${courseIndex}`}>
                          <th scope="row">{course.courseCode}</th>
                          <td>{course.courseTitle}</td>
                          <td>{course.creditHours}</td>
                          <td>{course.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No courses are available for this semester.</p>
              )}

              <p className="transcript-card-term-summary">
                <strong>Credits Attempted:</strong>{' '}
                {semester.creditsAttempted}
                {' | '}
                <strong>Credits Earned:</strong>{' '}
                {semester.creditsEarned}
                {' | '}
                <strong>Term GPA:</strong> {semester.gpa.toFixed(2)}
              </p>
            </section>
          ))}

          <h3>Cumulative Summary</h3>

          <dl className="transcript-card-summary">
            <div>
              <dt>Credits Attempted</dt>
              <dd>{transcript.summary.creditsAttempted}</dd>
            </div>

            <div>
              <dt>Credits Earned</dt>
              <dd>{transcript.summary.creditsEarned}</dd>
            </div>

            <div>
              <dt>Cumulative GPA</dt>
              <dd>{transcript.summary.cumulativeGPA.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}

export default TranscriptCard