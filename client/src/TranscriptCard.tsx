import { useEffect, useId, useState, type FormEvent, type ReactElement } from 'react'
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
  const [request, setRequest] = useState<{ studentID: string } | null>(null)
  const [result, setResult] = useState({
    transcript: null as Transcript | null, isLoading: false, error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    // Nothing is requested until the user submits an ID.
    if (!request) return
    const requestedID = request.studentID
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
          `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${requestedID}`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        const transcript = response.data
        if (!isTranscript(transcript) || transcript.studentID !== requestedID) {
          throw new Error('The transcript service returned an unexpected response. Please try again.')
        }
        setResult({ transcript, isLoading: false, error: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return
        let error = 'Unable to load the transcript. Please try again.'
        // Axios rejects HTTP errors (such as 404) as well as network failures.
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (status === 404) error = `No mock student was found with student ID ${requestedID}. Try 1001–1005.`
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

  function handleReset() {
    // Setting request to null runs the effect cleanup, which aborts any in-flight request.
    setRequest(null)
    setResult({ transcript: null, isLoading: false, error: '' })
    setStudentID('')
    setInputError('')
  }

  let status = 'No transcript loaded.'
  if (isLoading) status = `Loading transcript for ${request?.studentID}…`
  else if (transcript) status = `Transcript loaded for ${transcript.firstName} ${transcript.lastName}.`

  // Outer loop: one table per semester on record. Inner loop: one row per course.
  const semesterTables: ReactElement[] = []
  let cumulativeGPA = 0.0
  let creditsAttempted = 0
  let creditsEarned = 0
  if (transcript) {
    for (let s = 0; s < transcript.semesters.length; s++) {
      const semester = transcript.semesters[s]

      const courseRows: ReactElement[] = []
      for (let c = 0; c < semester.courses.length; c++) {
        const course = semester.courses[c]
        courseRows.push(
          <tr key={course.courseCode}>
            <td>{course.courseCode}</td>
            <td>{course.courseTitle}</td>
            <td>{course.creditHours}</td>
            <td>{course.grade}</td>
          </tr>,
        )
      }

      semesterTables.push(
        <div className="transcript-card-table-scroll" key={semester.term}>
          <table>
            <caption>{semester.term}</caption>
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Title</th>
                <th scope="col">Credits</th>
                <th scope="col">Grade</th>
              </tr>
            </thead>
            <tbody>{courseRows}</tbody>
          </table>
          <p className="transcript-card-term-summary">
             Semester GPA: {semester.gpa.toFixed(2)} | Credits attempted:{semester.creditsAttempted} | Credits earned: {semester.creditsEarned} 
          </p>
        </div>,
      )
    }
  }

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <section className="transcript-card-top">
        <section>
          <h2 id={`${labelId}-heading`}>Transcript</h2>
          <p>Explore fictional student records for this exercise.</p>
        </section>  

        <form className="transcript-card-controls" onSubmit={handleSubmit}>
          <label htmlFor="student-id-input">Student ID:</label>
          <input
            id="student-id-input"
            type="text"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)}
          />
          <button type="submit">Load Transcript</button>
          {inputError && <p className="transcript-card-error">{inputError}</p>}
          <button className="transcript-card-clear" type="button" onClick={handleReset}>Clear</button>
        </form>

        <section className="transcript-card-controls">
          
        </section>

        <section id="info">
          <p>Available mock student IDs: 1001 - 1005</p>
          <p>{status}</p>
          {error && <p className="transcript-card-error">{error}</p>}
        </section>
      </section>

      {transcript && (
        <>
          <div className="transcript-card-record">
            <h3>{transcript.firstName} {transcript.lastName}</h3>
            <p>{transcript.institution}</p>
            <p>Student ID: {transcript.studentID} - Major: {transcript.major}</p>
            <p>Mock transcript - not an official record</p>
          </div>

          <section className="transcript-card-semester">
            <h3>Semester Records</h3>
            {semesterTables}
          </section>

          <section className="transcript-card-summary">
            <table>

              <thead>
                <tr>
                  <th scope="col">Cumulative GPA</th>
                  <th scope="col">Credits Attempted</th>
                  <th scope="col">Credits Earned</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{cumulativeGPA.toFixed(2)}</td>
                  <td>{creditsAttempted}</td>
                  <td>{creditsEarned}</td>
                </tr>
              </tbody>

            </table>
          </section>
        </>
      )}
    </section>
  )
}

export default TranscriptCard
