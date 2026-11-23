import { useState } from 'react'
import SectionPicker from './SectionPicker'
import { useRoster } from './useRoster'
import type { Section } from './facultyApi'

type ClassRosterProps = { sections: Section[]; refreshKey: number }

// Lab 12 new feature 1 (design: "Class Rosters"): the students enrolled in one
// of the signed-in faculty member's sections, loaded from the database.
function ClassRoster({ sections, refreshKey }: ClassRosterProps) {
  const [sectionId, setSectionId] = useState<number | null>(null)
  const { roster, loading, error } = useRoster(sectionId, refreshKey)

  return (
    <section id="class-rosters" className="dashboard-card faculty-card faculty-wide" aria-labelledby="class-rosters-heading" tabIndex={-1}>
      <h2 id="class-rosters-heading">Class Roster</h2>
      <div className="faculty-form">
        <SectionPicker id="roster-section" sections={sections} value={sectionId} onChange={setSectionId} />
      </div>
      {loading && <p role="status">Loading roster…</p>}
      {error && <p className="faculty-error" role="alert">{error}</p>}
      {sectionId !== null && !loading && !error && (
        roster.length === 0 ? <p>No students are enrolled in this section.</p> : (
          <div className="faculty-table-wrap">
            <table>
              <caption>{roster.length} students enrolled</caption>
              <thead>
                <tr><th scope="col">Student</th><th scope="col">Email</th><th scope="col">Major</th><th scope="col">Final grade</th></tr>
              </thead>
              <tbody>
                {roster.map((entry) => (
                  <tr key={entry.enrollmentId}>
                    <th scope="row">{entry.lastName}, {entry.firstName}</th>
                    <td>{entry.email}</td>
                    <td>{entry.majorName}</td>
                    <td>{entry.finalGrade ?? 'Not posted'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  )
}

export default ClassRoster
