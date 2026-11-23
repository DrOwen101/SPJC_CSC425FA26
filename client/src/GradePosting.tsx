import { useState } from 'react'
import SectionPicker from './SectionPicker'
import { useRoster } from './useRoster'
import { errorMessage } from './apiClient'
import { letterGrades } from './gradeScale'
import { postFinalGrade, type RosterEntry, type Section } from './facultyApi'

type GradePostingProps = { sections: Section[]; refreshKey: number; onSaved: () => void }

// Lab 12 new feature 2 (design: "Grading"): post, change, or clear a final
// grade for a student in one of your sections. Saved to the database.
function GradePosting({ sections, refreshKey, onSaved }: GradePostingProps) {
  const [sectionId, setSectionId] = useState<number | null>(null)
  const { roster, setRoster, loading, error } = useRoster(sectionId, refreshKey)
  const [choices, setChoices] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  function chosen(entry: RosterEntry) {
    return choices[entry.enrollmentId] ?? entry.finalGrade ?? ''
  }

  async function save(entry: RosterEntry) {
    if (sectionId === null) return
    const grade = chosen(entry) || null
    setSavingId(entry.enrollmentId)
    setMessage('')
    setSaveError('')
    try {
      const saved = await postFinalGrade(sectionId, entry.enrollmentId, grade)
      // Show what the server stored, not what was selected in the form.
      setRoster(roster.map((row) => (row.enrollmentId === saved.enrollmentId ? { ...row, ...saved } : row)))
      setChoices((previous) => {
        const next = { ...previous }
        delete next[entry.enrollmentId]
        return next
      })
      setMessage(saved.finalGrade
        ? `Saved. ${entry.firstName} ${entry.lastName} now has ${saved.finalGrade} in the database.`
        : `Cleared. ${entry.firstName} ${entry.lastName} has no posted grade.`)
      onSaved()
    } catch (requestError) {
      setSaveError(errorMessage(requestError))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section id="grading" className="dashboard-card faculty-card faculty-wide" aria-labelledby="grading-heading" tabIndex={-1}>
      <h2 id="grading-heading">Post Final Grades</h2>
      <div className="faculty-form">
        <SectionPicker id="grading-section" sections={sections} value={sectionId}
          onChange={(id) => { setSectionId(id); setChoices({}); setMessage(''); setSaveError('') }} />
      </div>
      {loading && <p role="status">Loading students…</p>}
      {error && <p className="faculty-error" role="alert">{error}</p>}
      {message && <p className="faculty-status" role="status">{message}</p>}
      {saveError && <p className="faculty-error" role="alert">{saveError}</p>}
      {sectionId !== null && !loading && !error && roster.length > 0 && (
        <div className="faculty-table-wrap">
          <table>
            <caption>Choose a grade and select Save for each student</caption>
            <thead>
              <tr><th scope="col">Student</th><th scope="col">Saved grade</th><th scope="col">New grade</th><th scope="col">Action</th></tr>
            </thead>
            <tbody>
              {roster.map((entry) => (
                <tr key={entry.enrollmentId}>
                  <th scope="row">{entry.lastName}, {entry.firstName}</th>
                  <td>{entry.finalGrade ?? 'Not posted'}</td>
                  <td>
                    <label className="visually-hidden" htmlFor={`grade-${entry.enrollmentId}`}>
                      New grade for {entry.firstName} {entry.lastName}
                    </label>
                    <select id={`grade-${entry.enrollmentId}`} value={chosen(entry)}
                      onChange={(event) => setChoices({ ...choices, [entry.enrollmentId]: event.target.value })}>
                      <option value="">Not posted</option>
                      {letterGrades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => save(entry)}
                      disabled={savingId !== null || chosen(entry) === (entry.finalGrade ?? '')}>
                      {savingId === entry.enrollmentId ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default GradePosting
