import { useEffect, useState, type FormEvent, type JSX } from 'react'
import axios from 'axios'

interface SubmittedGrade {
  gradeId: number
  studentId: string
  classId: string
  letterGrade: string
  feedback: string
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

function GradeEntryCard({ id = 'grade-entry-card' }: { id?: string }): JSX.Element {
  const [grades, setGrades] = useState<SubmittedGrade[]>([])
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [letterGrade, setLetterGrade] = useState('A')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get<SubmittedGrade[]>(`${apiBaseUrl.replace(/\/$/, '')}/api/faculty/grades`, {
        headers: { 'x-user-role': 'faculty' },
      })
      .then((res) => setGrades(res.data))
      .catch(() => setError('Unable to load submitted grades.'))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!studentId.trim() || !classId.trim()) {
      setError('Student ID and Class ID are required.')
      return
    }
    setError('')

    try {
      const res = await axios.post<SubmittedGrade>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/faculty/grades`,
        { studentId, classId, letterGrade, feedback },
        { headers: { 'x-user-role': 'faculty' } }
      )
      setGrades([res.data, ...grades])
      setStudentId('')
      setClassId('')
      setFeedback('')
    } catch {
      setError('Failed to submit grade.')
    }
  }

  return (
    <section id={id} className="dashboard-card" aria-labelledby="grade-entry-heading">
      <h2 id="grade-entry-heading">Grade Entry &amp; Feedback</h2>
      <p>Submit official course grades and instructor feedback to PostgreSQL.</p>

      <form className="gpa-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="grade-student-id">Student ID &amp; Class ID</label>
        <div className="gpa-entry-row">
          <input
            id="grade-student-id"
            type="text"
            placeholder="Student ID (1001)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Class ID (CSC425)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <select value={letterGrade} onChange={(e) => setLetterGrade(e.target.value)}>
            {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <label htmlFor="grade-feedback">Feedback (optional)</label>
        <div className="gpa-entry-row">
          <input
            id="grade-feedback"
            type="text"
            placeholder="e.g., Strong final project implementation"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button type="submit">Submit Grade</button>
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}
      </form>

      <div className="grade-list-area">
        <h3>Recent Submissions</h3>
        {grades.length === 0 ? (
          <p>No grades submitted yet.</p>
        ) : (
          <ol className="grade-list">
            {grades.map((g) => (
              <li key={g.gradeId}>
                <span>
                  <strong>{g.studentId}</strong> ({g.classId}) {g.feedback ? `— ${g.feedback}` : ''}
                </span>
                <span><strong>{g.letterGrade}</strong></span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default GradeEntryCard