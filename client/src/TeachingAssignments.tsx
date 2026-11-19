import { useEffect, useId, useState } from 'react'
import { facultyError, listSections, type Section } from './facultyApi'

type Props = { selectedId: number | null; onSelect: (section: Section) => void }

// Shows sections you teach.
export default function TeachingAssignments({ selectedId, onSelect }: Props) {
    const labelId = useId()
    const [sections, setSections] = useState<Section[]>([])
    const [busy, setBusy] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        listSections()
            .then((rows) => { if (active) setSections(rows) })
            .catch((requestError) => { if (active) setError(facultyError(requestError)) })
            .finally(() => { if (active) setBusy(false) })
        return () => { active = false }
    }, [])

    return (
        <section id="faculty-courses" className="dashboard-card faculty-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
            <h2 id={`${labelId}-heading`}>Teaching assignments</h2>
            <p>Sections you teach. Select one to load its roster, grades, and attendance.</p>
            <p role="status">{busy ? 'Loading your sections…' : ''}</p>
            {error && <p role="alert" className="field-error">{error}</p>}
            {!busy && !error && sections.length === 0 && <p>No sections are assigned to you.</p>}
            {sections.length > 0 && (
                <div className="faculty-table-scroll">
                    <table>
                        <caption>{sections.length} assigned sections</caption>
                        <thead>
                            <tr>
                                <th scope="col">Course</th><th scope="col">Title</th><th scope="col">Term</th>
                                <th scope="col">Section</th><th scope="col">Credits</th>
                                <th scope="col">Enrolled</th><th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((section) => (
                                <tr key={section.id}>
                                    <th scope="row">{section.courseCode}</th>
                                    <td>{section.courseTitle}</td>
                                    <td>{section.term}</td>
                                    <td>{section.sectionNumber}</td>
                                    <td>{section.creditHours}</td>
                                    <td>{section.enrolledCount}</td>
                                    <td>
                                        <button type="button" aria-pressed={section.id === selectedId} onClick={() => onSelect(section)}>
                                            {section.id === selectedId ? 'Selected' : 'Select'}
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