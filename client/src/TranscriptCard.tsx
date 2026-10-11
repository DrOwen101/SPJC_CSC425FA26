
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

type CourseForGPA = {
  grade: string
  creditHours: number
}

const gradePoints: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
}

// Calculate GPA using credit-weighted grade points.
function calculateGPA(courses: CourseForGPA[]): number {
  const totalCredits = courses.reduce(
    (sum, course) => sum + course.creditHours,
    0,
  )

  if (totalCredits === 0) return 0

  const totalQualityPoints = courses.reduce(
    (sum, course) =>
      sum +
      (gradePoints[course.grade.toUpperCase()] ?? 0) *
        course.creditHours,
    0,
  )

  return totalQualityPoints / totalCredits
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
        error:
          'The transcript request timed out. Please try again.',
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

        let error =
          'Unable to load the transcript. Please try again.'

        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status

          if (status === 404) {
            error = `No mock student was found with student ID ${request.studentID}. Try 1001–1005.`
          } else if (status) {
            error = `The transcript request failed (HTTP ${status}). Please try again.`
          } else {
            error =
              'Unable to reach the transcript service. Check your connection and try again.'
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
      setInputError(
        'Enter a four-digit student ID, such as 1001.',
      )
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
    status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`
  }

  // Calculate cumulative GPA across all fetched semesters.
  const allCourses = transcript
    ? transcript.semesters.flatMap(
        (semester) => semester.courses,
      )
    : []

  const cumulativeGPA = calculateGPA(allCourses)

  return (
    <section
      id={id}
      className="transcript-card"
      aria-labelledby={`${labelId}-heading`}
      tabIndex={-1}
    >
      <h2 id={`${labelId}-heading`}>
        Student Transcript
      </h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor={`${labelId}-student-id`}>
          Student ID
        </label>

        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-id`}
            type="text"
            value={studentID}
            onChange={(event) =>
              setStudentID(event.target.value)
            }
            placeholder="1001"
            maxLength={4}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Loading…'
              : 'Load Transcript'}
          </button>
        </div>

        <p className="transcript-card-help">
          Enter a student ID from 1001–1005.
        </p>

        {inputError && (
          <p
            className="transcript-card-error"
            role="alert"
          >
            {inputError}
          </p>
        )}
      </form>

      <p
        className="transcript-card-status"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>

      {error && (
        <p
          className="transcript-card-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {transcript && (
        <div className="transcript-card-record">
          <h3>
            {transcript.firstName}{' '}
            {transcript.lastName}
          </h3>

          <p>
            <strong>Student ID:</strong>{' '}
            {transcript.studentID}
            <br />

            <strong>Major:</strong>{' '}
            {transcript.major}
            <br />

            <strong>Institution:</strong>{' '}
            {transcript.institution}
          </p>

          {transcript.semesters.map((semester) => {
            const semesterGPA = calculateGPA(
              semester.courses,
            )

            return (
              <section
                className="transcript-card-semester"
                key={semester.term}
              >
                <h3>{semester.term}</h3>

                <div className="transcript-card-table-scroll">
                  <table>
                    <caption>
                      {semester.term} Courses
                    </caption>

                    <thead>
                      <tr>
                        <th scope="col">Course</th>
                        <th scope="col">Title</th>
                        <th scope="col">Credits</th>
                        <th scope="col">Grade</th>
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
                  Credits Attempted:{' '}
                  {semester.creditsAttempted}
                  {' · '}
                  Credits Earned:{' '}
                  {semester.creditsEarned}
                  {' · '}
                  Semester GPA:{' '}
                  {semesterGPA.toFixed(2)}
                </p>
              </section>
            )
          })}

          <dl className="transcript-card-summary">
            <div>
              <dt>Credits Attempted</dt>
              <dd>
                {transcript.summary.creditsAttempted}
              </dd>
            </div>

            <div>
              <dt>Credits Earned</dt>
              <dd>
                {transcript.summary.creditsEarned}
              </dd>
            </div>

            <div>
              <dt>Cumulative GPA</dt>
              <dd>
                {cumulativeGPA.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}

export default TranscriptCard
