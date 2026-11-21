/** Two new faculty tools plus a student-GPA-inspired section summary. */
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { gradePoints, letterFromPercent } from './gradeMath'

const API = 'http://localhost:3000/api/faculty'
const credentials = { withCredentials: true }
type Props = { sectionId: number | null }
type AttendanceRow = {
  student_id: number; first_name: string; last_name: string; status: string | null
}
type Assessment = { id: number; assessment_name: string; max_points: number }
type ScoreRow = {
  student_id: number; first_name: string; last_name: string; score: number | null
}
type SummaryRow = {
  student_id: number; first_name: string; last_name: string
  graded_count: number; current_percentage: number | null
}

export function FacultyAttendance({ sectionId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [draft, setDraft] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRows([])
    setDraft({})
    setMessage('')
    setError('')
    if (sectionId === null) return
    const controller = new AbortController()
    axios.get<{ attendance: AttendanceRow[] }>(
      `${API}/sections/${sectionId}/attendance`,
      { ...credentials, params: { date }, signal: controller.signal },
    ).then(({ data }) => {
      if (!controller.signal.aborted) setRows(data.attendance)
    }).catch((err) => {
      if (!axios.isCancel(err)) setError('Unable to load attendance for this date.')
    })
    return () => controller.abort()
  }, [sectionId, date])

  async function saveAttendance() {
    if (sectionId === null) return
    const entries = rows.map((row) => ({
      studentId: row.student_id,
      status: draft[row.student_id] ?? row.status ?? '',
    })).filter((entry) => entry.status !== '')
    if (!entries.length) {
      setMessage('Select at least one attendance status before saving.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const results = await Promise.allSettled(entries.map((entry) =>
        axios.put(`${API}/sections/${sectionId}/attendance`,
          { ...entry, date }, credentials),
      ))
      const failed: Record<number, string> = {}
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failed[entries[index].studentId] = entries[index].status
        }
      })
      setDraft(failed) // Failed selections stay editable; successful ones use saved values.
      const count = results.length - Object.keys(failed).length
      setMessage(`Saved ${count} of ${entries.length} attendance entries.` +
        (Object.keys(failed).length ? ' Failed selections were kept for correction.' : ''))
      const refreshed = await axios.get<{ attendance: AttendanceRow[] }>(
        `${API}/sections/${sectionId}/attendance`, { ...credentials, params: { date } },
      )
      setRows(refreshed.data.attendance)
    } catch {
      setError('Unable to refresh attendance after saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="attendance-entry" className="dashboard-card student-records"
      aria-labelledby="attendance-heading" tabIndex={-1}>
      <h2 id="attendance-heading">Attendance Entry</h2>
      <label htmlFor="attendance-date">Class date</label>{' '}
      <input id="attendance-date" type="date" value={date} disabled={saving}
        onChange={(event) => setDate(event.target.value)} />
      {sectionId === null ? <p>Select an assigned section above.</p> : (
        <>
          {error && <p className="field-error" role="alert">{error}</p>}
          {rows.length === 0 && !error && <p>No students enrolled or loading attendance.</p>}
          {rows.length > 0 && (
            <div className="student-records-table-wrapper">
              <table className="student-records-table">
                <thead><tr><th>Student</th><th>Attendance</th></tr></thead>
                <tbody>{rows.map((row) => (
                  <tr key={row.student_id}>
                    <td>{row.first_name} {row.last_name}</td>
                    <td>
                      <select aria-label={`Attendance for ${row.first_name} ${row.last_name}`}
                        disabled={saving}
                        value={draft[row.student_id] ?? row.status ?? ''}
                        onChange={(event) => setDraft({ ...draft, [row.student_id]: event.target.value })}>
                        <option value="">Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <button type="button" onClick={saveAttendance}
            disabled={saving || rows.length === 0}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
          {message && <p role="status">{message}</p>}
        </>
      )}
    </section>
  )
}

export function FacultyGrades({ sectionId, onSaved }: Props & { onSaved: () => void }) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assessmentId, setAssessmentId] = useState<number | null>(null)
  const [assessmentName, setAssessmentName] = useState('')
  const [maxInput, setMaxInput] = useState('100')
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [draft, setDraft] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selected = assessments.find((a) => a.id === assessmentId)

  useEffect(() => {
    setAssessments([])
    setAssessmentId(null)
    setRows([])
    setDraft({})
    setMessage('')
    setError('')
    if (sectionId === null) return
    const controller = new AbortController()
    axios.get<{ assessments: Assessment[] }>(
      `${API}/sections/${sectionId}/assessments`,
      { ...credentials, signal: controller.signal },
    ).then(({ data }) => {
      if (controller.signal.aborted) return
      setAssessments(data.assessments)
      setAssessmentId(data.assessments[0]?.id ?? null)
    }).catch((err) => {
      if (!axios.isCancel(err)) setError('Unable to load assessments.')
    })
    return () => controller.abort()
  }, [sectionId])

  useEffect(() => {
    setRows([])
    setDraft({})
    if (sectionId === null || assessmentId === null) return
    const controller = new AbortController()
    axios.get<{ scores: ScoreRow[] }>(
      `${API}/sections/${sectionId}/assessments/${assessmentId}/scores`,
      { ...credentials, signal: controller.signal },
    ).then(({ data }) => {
      if (!controller.signal.aborted) setRows(data.scores)
    }).catch((err) => {
      if (!axios.isCancel(err)) setError('Unable to load saved scores.')
    })
    return () => controller.abort()
  }, [sectionId, assessmentId])

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sectionId === null) return
    const maxPoints = Number(maxInput)
    if (!assessmentName.trim() || !Number.isFinite(maxPoints) || maxPoints <= 0) {
      setError('Enter an assessment name and a positive maximum point value.')
      return
    }
    setError('')
    try {
      const { data } = await axios.post<{ assessment: Assessment }>(
        `${API}/sections/${sectionId}/assessments`,
        { name: assessmentName.trim(), maxPoints }, credentials,
      )
      setAssessments((previous) => [...previous, data.assessment])
      setAssessmentId(data.assessment.id)
      setAssessmentName('')
      setMessage('Assessment created. Enter the roster scores below.')
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 409
        ? 'An assessment with that name already exists.'
        : 'Unable to create assessment.')
    }
  }

  function enteredValue(row: ScoreRow) {
    return draft[row.student_id] ?? (row.score === null ? '' : String(row.score))
  }

  function invalidScore(value: string): boolean {
    if (value.trim() === '') return false
    const score = Number(value)
    return !Number.isFinite(score) || score < 0 || score > (selected?.max_points ?? 0)
  }

  async function saveScores() {
    if (sectionId === null || assessmentId === null || !selected) return
    const entries = rows.map((row) => ({
      studentId: row.student_id,
      raw: enteredValue(row),
    })).filter((entry) => entry.raw.trim() !== '')
    if (!entries.length) {
      setError('Enter at least one score before saving.')
      return
    }
    if (entries.some((entry) => invalidScore(entry.raw))) {
      setError(`Scores must be between 0 and ${selected.max_points}. Correct highlighted fields.`)
      return
    }
    setError('')
    setSaving(true)
    try {
      const results = await Promise.allSettled(entries.map(({ studentId, raw }) =>
        axios.put(`${API}/sections/${sectionId}/grades`,
          { studentId, assessmentId, score: Number(raw) }, credentials),
      ))
      const failed: Record<number, string> = {}
      results.forEach((result, index) => {
        if (result.status === 'rejected') failed[entries[index].studentId] = entries[index].raw
      })
      setDraft(failed)
      const saved = results.length - Object.keys(failed).length
      setMessage(`Saved ${saved} of ${entries.length} scores.` +
        (Object.keys(failed).length ? ' Failed scores were kept for correction.' : ''))
      if (saved > 0) onSaved()
      const refreshed = await axios.get<{ scores: ScoreRow[] }>(
        `${API}/sections/${sectionId}/assessments/${assessmentId}/scores`, credentials,
      )
      setRows(refreshed.data.scores)
    } catch {
      setError('Unable to refresh saved scores.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="grading" className="dashboard-card student-records"
      aria-labelledby="grading-heading" tabIndex={-1}>
      <h2 id="grading-heading">Grade Entry</h2>
      {sectionId === null ? <p>Select an assigned section above.</p> : (
        <>
          <h3>Create Assessment</h3>
          <form onSubmit={createAssessment}>
            <label htmlFor="assessment-name">Name</label>{' '}
            <input id="assessment-name" value={assessmentName} required maxLength={150}
              onChange={(event) => setAssessmentName(event.target.value)} />{' '}
            <label htmlFor="assessment-max">Maximum points</label>{' '}
            <input id="assessment-max" type="number" min="0.01" step="0.01" required
              value={maxInput} onChange={(event) => setMaxInput(event.target.value)} />{' '}
            <button type="submit">Add Assessment</button>
          </form>

          <h3>Enter Scores</h3>
          <label htmlFor="grade-assessment">Assessment</label>{' '}
          <select id="grade-assessment" value={assessmentId ?? ''}
            onChange={(event) => setAssessmentId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Choose an assessment</option>
            {assessments.map((a) => (
              <option value={a.id} key={a.id}>
                {a.assessment_name} ({a.max_points} points)
              </option>
            ))}
          </select>
          {selected && rows.length > 0 && (
            <div className="student-records-table-wrapper">
              <table className="student-records-table">
                <thead><tr><th>Student</th><th>Score / {selected.max_points}</th></tr></thead>
                <tbody>{rows.map((row) => {
                  const value = enteredValue(row)
                  const invalid = invalidScore(value)
                  return (
                    <tr key={row.student_id}>
                      <td>{row.first_name} {row.last_name}</td>
                      <td>
                        <input aria-label={`Score for ${row.first_name} ${row.last_name}`}
                          type="number" min="0" max={selected.max_points} step="0.01"
                          disabled={saving} value={value} aria-invalid={invalid}
                          style={invalid ? { border: '2px solid #b91c1c' } : undefined}
                          onChange={(event) => setDraft({ ...draft, [row.student_id]: event.target.value })} />
                        {invalid && <span className="field-error"> Invalid score</span>}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
          {selected && rows.length === 0 && <p>No students enrolled or loading scores.</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button type="button" onClick={saveScores}
            disabled={saving || !selected || rows.length === 0}>
            {saving ? 'Saving...' : 'Save Scores'}
          </button>
        </>
      )}
    </section>
  )
}

export function FacultySummary({ sectionId, refreshKey }: Props & { refreshKey: number }) {
  const [rows, setRows] = useState<SummaryRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    setRows([])
    setError('')
    if (sectionId === null) return
    const controller = new AbortController()
    axios.get<{ summary: SummaryRow[] }>(
      `${API}/sections/${sectionId}/summary`,
      { ...credentials, signal: controller.signal },
    ).then(({ data }) => {
      if (!controller.signal.aborted) setRows(data.summary)
    }).catch((err) => {
      if (!axios.isCancel(err)) setError('Unable to load the grade summary.')
    })
    return () => controller.abort()
  }, [sectionId, refreshKey])

  return (
    <section id="grade-summary" className="dashboard-card student-records"
      aria-labelledby="summary-heading" tabIndex={-1}>
      <h2 id="summary-heading">Section Grade Summary</h2>
      <p>Current percentages use earned / possible points on graded assessments.</p>
      <p>The letter and 4.0 equivalents reuse the Student GPA scale for demonstration;
        they are not an official course grade or GPA.</p>
      {sectionId === null ? <p>Select an assigned section above.</p> : (
        <>
          {error && <p className="field-error" role="alert">{error}</p>}
          {!error && rows.length === 0 && <p>No enrolled students or loading summary.</p>}
          {rows.length > 0 && (
            <div className="student-records-table-wrapper">
              <table className="student-records-table">
                <thead><tr><th>Student</th><th>Graded items</th><th>Current %</th><th>Letter</th><th>4.0 equivalent</th></tr></thead>
                <tbody>{rows.map((row) => {
                  const percent = row.current_percentage
                  const letter = percent === null ? null : letterFromPercent(percent)
                  return (
                    <tr key={row.student_id}>
                      <td>{row.first_name} {row.last_name}</td>
                      <td>{row.graded_count}</td>
                      <td>{percent === null ? 'Not graded' : `${percent.toFixed(2)}%`}</td>
                      <td>{letter ?? '—'}</td>
                      <td>{letter === null ? '—' : gradePoints[letter].toFixed(2)}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
