import { useEffect, useState } from 'react'
import RecordTable from './RecordTable'
import { facultyError, type FacultyApi, type Grade, type Section } from './facultyApi'

export default function FacultyGradeSummary({ api, sections }: { api: FacultyApi; sections: Section[] }) {
  const [section, setSection] = useState(sections[0]?.id ?? '')
  return (
    <section id="grading" className="transcript-card faculty-card" aria-labelledby="grading-heading" tabIndex={-1}>
      <h2 id="grading-heading">Section grade summary</h2>
      <p>Review each enrolled student’s points and current percentage for one section.</p>
      <div className="faculty-controls">
        <label>Grade summary section
          <select value={section} onChange={(event) => setSection(event.target.value)} disabled={!sections.length}>
            {sections.length === 0 && <option value="">No assigned sections</option>}
            {sections.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
          </select>
        </label>
      </div>
      {section && <SectionGrades key={section} api={api} section={section} />}
    </section>
  )
}

function SectionGrades({ api, section }: { api: FacultyApi; section: string }) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api.grades(section, controller.signal)
      .then(({ grades }) => { if (!controller.signal.aborted) setGrades(grades) })
      .catch((error) => { if (!controller.signal.aborted) setError(facultyError(error)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [api, retry, section])

  if (loading) return <p role="status">Loading grades…</p>
  if (error) return (
    <>
      <p className="field-error" role="alert">{error}</p>
      <button type="button" onClick={() => { setLoading(true); setRetry(retry + 1); setError('') }}>Try again</button>
    </>
  )
  if (!grades.length) return <p role="status">No students are enrolled in this section.</p>
  return (
    <RecordTable caption={`Current grades for ${section}`} regionLabel="Section grades"
      columns={['ID', 'Student', 'Graded items', 'Points', 'Current grade']}>
      {grades.map((grade) => (
        <tr key={grade.studentId}>
          <td>{grade.studentId}</td><th scope="row">{grade.fullName}</th><td>{grade.gradedItems}</td>
          <td>{grade.possible === null ? '—' : `${grade.earned} / ${grade.possible}`}</td>
          <td>{grade.percentage === null ? 'Not graded yet' : `${grade.percentage.toFixed(1)}%`}</td>
        </tr>
      ))}
    </RecordTable>
  )
}
