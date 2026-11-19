import { useEffect, useId, useState } from 'react'
import { facultyError, getRoster, type RosterRow, type Section } from './facultyApi'

type Props = { section: Section | null; refreshKey: number }

// Shows only the students enrolled
export default function ClassRoster({ section, refreshKey }: Props) {
    const labelId = useId()
    const [roster, setRoster] = useState<RosterRow[]>([])
    const [filter, setFilter] = useState('')
    const [error, setError] = useState('')
    const sectionId = section?.id

    useEffect(() => {
        setError('')
        if (sectionId === undefined) { setRoster([]); return }
        let active = true
        getRoster(sectionId)
            .then((rows) => { if (active) setRoster(rows) })
            .catch((requestError) => { if (active) { setRoster([]); setError(facultyError(requestError)) } })
        return () => { active = false }
    }, [sectionId, refreshKey])

    const needle = filter.trim().toLowerCase()
    const shown = roster.filter((row) => `${row.firstName} ${row.lastName}`.toLowerCase().includes(needle))

    return (
        <section id="class-rosters" className="dashboard-card faculty-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
            <h2 id={`${labelId}-heading`}>Class roster{section ? `: ${section.courseCode}-${section.sectionNumber}` : ''}</h2>
            {!section && <p>Select a section in Teaching assignments to see its roster.</p>}
            {error && <p role="alert" className="field-error">{error}</p>}
            {section && !error && (
                <>
                    <label htmlFor={`${labelId}-filter`}>Filter by name</label>
                    <input id={`${labelId}-filter`} value={filter} onChange={(event) => setFilter(event.target.value)} />
                    <div className="faculty-table-scroll">
                        <table>
                            <caption>{shown.length} of {roster.length} enrolled students</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Student</th><th scope="col">Major</th>
                                    <th scope="col">Final grade</th><th scope="col">Absences</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((row) => (
                                    <tr key={row.enrollmentId}>
                                        <td>{row.firstName} {row.lastName}<br /><small>{row.email}</small></td>
                                        <td>{row.majorName}</td>
                                        <td>{row.finalGrade ?? 'Not posted'}</td>
                                        <td>{row.absences}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}