import { useEffect, useId, useState, type FormEvent, type SubmitEvent } from 'react'
import axios from 'axios'
import './TranscriptCard.css'
import { isTranscript, type Transcript } from './transcriptApi'

const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

interface AdvisingNote {
  noteId: number
  advisorName: string
  noteText: string
  createdAt: string
}

type TranscriptCardProps = {
  id?: string
  apiBaseUrl?: string
  mode?: 'student' | 'faculty'
}

function TranscriptCard({ id, apiBaseUrl = defaultApiBaseUrl, mode = 'student' }: TranscriptCardProps) {
  const labelId = useId()
  const isFaculty = mode === 'faculty'

  const [studentID, setStudentID] = useState('1001')
  const [request, setRequest] = useState({ studentID: '1001' })
  const [result, setResult] = useState({
    transcript: null as Transcript | null, isLoading: true, error: '',
  })
  const { transcript, isLoading, error } = result
  const [inputError, setInputError] = useState('')

  // Faculty Advising Notes State
  const [notes, setNotes] = useState<AdvisingNote[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setResult({ transcript: null, isLoading: true, error: '' })

    const timeout = window.setTimeout(() => {
      controller.abort()
      setResult({ transcript: null, isLoading: false, error: 'The transcript request timed out. Please try again.' })
    }, 15000)

    async function getTranscript() {
      try {
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${request.studentID}`,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        const data = response.data
        if (!isTranscript(data) || data.studentID !== request.studentID) {
          throw new Error('The transcript service returned an unexpected response.')
        }
        setResult({ transcript: data, isLoading: false, error: '' })

        if (isFaculty) {
          const notesRes = await axios.get<AdvisingNote[]>(
            `${apiBaseUrl.replace(/\/$/, '')}/api/advising-notes/${request.studentID}`,
            { headers: { 'x-user-role': 'faculty' }, signal: controller.signal }
          )
          if (!controller.signal.aborted) setNotes(notesRes.data)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return
        let errMessage = 'Unable to load the transcript. Please try again.'
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (status === 404) errMessage = `No mock student was found with student ID ${request.studentID}. Try 1001–1005.`
          else if (status) errMessage = `The transcript request failed (HTTP ${status}).`
        }
        setResult({ transcript: null, isLoading: false, error: errMessage })
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void getTranscript()
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [apiBaseUrl, request, isFaculty])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transcript || !noteInput.trim()) {
      setNoteError('Enter an advising note before saving.')
      return
    }
    setNoteError('')

    try {
      const res = await axios.post<AdvisingNote>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/advising-notes`,
        { studentId: transcript.studentID, noteText: noteInput },
        { headers: { 'x-user-role': 'faculty' } }
      )
      setNotes([res.data, ...notes])
      setNoteInput('')
    } catch {
      setNoteError('Failed to save advising note.')
    }
  }

  const flaggedCourses = transcript
    ? transcript.semesters.flatMap((s) =>
        s.courses.filter((c) => c.grade.startsWith('D') || c.grade === 'F')
      )
    : []

  return (
    <section id={id} className="transcript-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>{isFaculty ? 'Student Advising & Transcript Audit' : 'Transcript'}</h2>
      <p>
        {isFaculty
          ? 'Audit advisee academic standing, review deficient grades, and record advising notes.'
          : 'Explore fictional student records for this classroom exercise.'}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-student-id`}>Student ID</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-id`}
            name="studentID"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={studentID}
            onChange={(event) => {
              setStudentID(event.target.value)
              setInputError('')
            }}
          />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Loading…' : 'Load transcript'}</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Available mock student IDs: 1001–1005.</p>
        {inputError && <p className="transcript-card-error" role="alert">{inputError}</p>}
      </form>

      {error && <p className="transcript-card-error" role="alert">{error}</p>}

      {transcript && (
        <div className="transcript-card-record">
          <header>
            <h3>{transcript.firstName} {transcript.lastName}</h3>
            <p>{transcript.institution}</p>
            <p>Student ID: {transcript.studentID} · {transcript.major}</p>
          </header>

          {isFaculty && (
            <div className="advising-audit-box" style={{ padding: '0.75rem', margin: '0.75rem 0', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <strong>Academic Standing Audit:</strong>{' '}
              {transcript.summary.cumulativeGPA < 2.0
                ? 'Academic Warning (GPA below 2.00)'
                : 'Good Academic Standing'}
              {flaggedCourses.length > 0 && (
                <p style={{ margin: '0.35rem 0 0', color: '#b91c1c' }}>
                  Courses flagged for retake/review: {flaggedCourses.map((c) => `${c.courseCode} (${c.grade})`).join(', ')}
                </p>
              )}
            </div>
          )}

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
              <p className="transcript-card-term-summary">Term GPA: <strong>{semester.gpa.toFixed(2)}</strong> · Credits earned: {semester.creditsEarned}</p>
            </div>
          ))}

          <dl className="transcript-card-summary">
            <div><dt>Cumulative GPA</dt><dd>{transcript.summary.cumulativeGPA.toFixed(2)}</dd></div>
            <div><dt>Credits attempted</dt><dd>{transcript.summary.creditsAttempted}</dd></div>
            <div><dt>Credits earned</dt><dd>{transcript.summary.creditsEarned}</dd></div>
          </dl>

          {isFaculty && (
            <div className="advisor-notes-section" style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <h3>Advisor Notes</h3>
              <form onSubmit={handleAddNote}>
                <div className="transcript-card-controls">
                  <input
                    type="text"
                    placeholder="Add advising note for this student..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                  />
                  <button type="submit">Save Note</button>
                </div>
                {noteError && <p className="transcript-card-error" role="alert">{noteError}</p>}
              </form>
              {notes.length === 0 ? (
                <p className="transcript-card-help">No advising notes recorded yet.</p>
              ) : (
                <ul>
                  {notes.map((n) => (
                    <li key={n.noteId}>
                      <strong>{n.advisorName}:</strong> {n.noteText}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default TranscriptCard