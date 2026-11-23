import { useState } from 'react'
import SectionPicker from './SectionPicker'
import { useRoster } from './useRoster'
import { averageGpa, gradePoints, letterGrades } from './gradeScale'
import type { Section } from './facultyApi'

type SectionGpaSummaryProps = { sections: Section[]; refreshKey: number }

// Lab 12 repurposed module (from the student GPA card): the same 4.0 scale and
// averaging, but the grades come from the database for a whole section instead
// of being typed in by one student, and it also shows the grade spread and
// how many grades are still missing.
function SectionGpaSummary({ sections, refreshKey }: SectionGpaSummaryProps) {
  const [sectionId, setSectionId] = useState<number | null>(null)
  const { roster, loading, error } = useRoster(sectionId, refreshKey)

  const posted = roster.map((entry) => entry.finalGrade).filter((grade): grade is string => grade !== null)
  const gpa = averageGpa(posted)
  const counts = letterGrades
    .map((grade) => ({ grade, count: posted.filter((value) => value === grade).length }))
    .filter((row) => row.count > 0)

  return (
    <section id="section-gpa" className="dashboard-card faculty-card" aria-labelledby="section-gpa-heading" tabIndex={-1}>
      <h2 id="section-gpa-heading">Section GPA Summary</h2>
      <div className="faculty-form">
        <SectionPicker id="gpa-section" sections={sections} value={sectionId} onChange={setSectionId} />
      </div>
      {loading && <p role="status">Loading grades…</p>}
      {error && <p className="faculty-error" role="alert">{error}</p>}
      {sectionId !== null && !loading && !error && (
        <>
          <p className="metric" aria-live="polite">{gpa === null ? '--' : gpa.toFixed(2)}</p>
          <p>Class average of posted grades · equal weight per grade</p>
          <p>{posted.length} of {roster.length} grades posted{roster.length > posted.length ? ` · ${roster.length - posted.length} still missing` : ''}</p>
          {counts.length > 0 && (
            <ol className="grade-list">
              {counts.map((row) => (
                <li key={row.grade}>
                  <span>{row.grade} ({gradePoints[row.grade].toFixed(1)} points)</span>
                  <span>{row.count} {row.count === 1 ? 'student' : 'students'}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}

export default SectionGpaSummary
