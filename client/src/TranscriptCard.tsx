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

interface Semester {
  term?: string
  //courses?: courses[]
}
//type courses = {

//}

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
      <p>Please enter a valid student ID to view their transcript</p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>
        <div className="transcript-card-controls">
          <input
          id={`${labelId}-student-id`}
          name='studentID'
          type='text'
          value={studentID}
          onChange={(event) => setStudentID(event.target.value)}
          />
          <button className = "transcript-card-controls button" type="submit">Search Transcript</button>
        </div>
        <div className='transcript-card table'>
          <p className='transcript-card label'>
            {isLoading? 'Loading Transcript...' :  `Students name: ${transcript?.firstName} ${transcript?.lastName}`}
          </p>
          <p className='transcript-card-record'>
            {isLoading === false? `Major: ${transcript?.major} at ${transcript?.institution}` : ``}
          </p>
          {isLoading === false && transcript?.semesters.map((semester, index) => (
            <h3 className='transcript-card-summary' key = {index}>
              <span>{"Term: " + semester.term}</span>
              {semester.courses.map((course, i) => (
                <p key={i}>
                  <span>{"Course " + (i+1) + ": " + course.courseCode}</span>
                  <span>{"Name: " + course.courseTitle}</span>
                  <span>{"Credit hours: " + course.creditHours}</span>
                  <span>{"grade: " + course.grade}</span>
                </p>
              ))}
              <span>{"Credits attempted: " + semester.creditsAttempted}</span>
              <span>{"Credits earned: " + semester.creditsEarned}</span>
              <span>{"GPA: " + semester.gpa}</span>
            </h3>
          ))}
          <p className='transcript-card-record'>
            {isLoading === false? `Credits attempted: ${transcript?.summary.creditsAttempted}` : ``}
          </p>
          <p>
            {isLoading === false? `Credits earned: ${transcript?.summary.creditsEarned}` : ``}
          </p>
          <p>
            {isLoading === false? `Cumulative GPA: ${transcript?.summary.cumulativeGPA}` : ``}
          </p>
        </div>
      </form>
    </section>
  )
}

export default TranscriptCard
