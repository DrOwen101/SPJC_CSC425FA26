import { useEffect, useId, useState } from 'react'
import { GRADES, facultyError, getRoster, saveGrade, type Grade, type RosterRow, type Section } from './facultyApi'

const POINTS: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 }

type Props = { section: Section | null; refreshKey: number; onSaved: () => void }

export default function GradeEntry({ section, refreshKey, onSaved }: Props) {
    const labelId = useId()
    const [roster, setRoster] = useState<RosterRow[]>([])
    const [draft, setDraft] = useState<Record<number, Grade | ''>>({})
    const [savingId, setSavingId] = useState<number | null>(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const sectionId = section?.id

    // The grades shown come from the database every time
    useEffect(() => {
        setError('')
        if (sectionId === undefined) { setRoster([]); return }
        let active = true
        getRoster(sectionId)
            .then((rows) => {
                if (!active) return
                setRoster(rows)
                setDraft(Object.fromEntries(rows.map((row) => [row.enrollmentId, row.finalGrade ?? ''])))
            })
            .catch((requestError) => { if (active) { setRoster([]); setError(facultyError(requestError)) } })
        return () => { active = false }
    }, [sectionId, refreshKey])

    async function handleSave(row: RosterRow) {
        setSavingId(row.enrollmentId)
        setError('')
        setMessage('')
        try {
            await saveGrade(row.enrollmentId, draft[row.enrollmentId] || null)
            setMessage(`Saved grade for ${row.firstName} ${row.lastName} (enrollment #${row.enrollmentId}).`)
            onSaved()
        } catch (requestError) {
            setError(facultyError(requestError))
        } finally {
            setSavingId(null)
        }
    }

    // Grade summary computed from the saved grades
    const graded = roster.filter((row) => row.finalGrade !== null)
    const classGpa = graded.length === 0
        ? null
        : graded.reduce((sum, row) => sum + POINTS[row.finalGrade as Grade], 0) / graded.length
    const counts = GRADES.map((grade) => `${grade}: ${graded.filter((row) => row.finalGrade === grade).length}`).join('   ')

    return (
        <section id="grading" className="dashboard-card faculty-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
            <h2 id={`${labelId}-heading`}>Grade entry{section ? `: ${section.courseCode}-${section.sectionNumber}` : ''}</h2>
            {!section && <p>Select a section in Teaching assignments to enter grades.</p>}
            <p role="status">{message}</p>
            {error && <p role="alert" className="field-error">{error}</p>}
            {section && !error && (
                <>
                    <p>
                        Graded {graded.length} of {roster.length} students. Class GPA:{' '}
                        <strong>{classGpa === null ? '--' : classGpa.toFixed(2)}</strong>. Distribution: {counts}
                    </p>
                    <div className="faculty-table-scroll">
                        <table>
                            <caption>Final grades for {roster.length} students</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Student</th><th scope="col">Saved grade</th>
                                    <th scope="col">New grade</th><th scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map((row) => {
                                    const chosen = draft[row.enrollmentId] ?? ''
                                    return (
                                        <tr key={row.enrollmentId}>
                                            <td>{row.firstName} {row.lastName}</td>
                                            <td>{row.finalGrade ?? 'Not posted'}</td>
                                            <td>
                                                <select aria-label={`Grade for ${row.firstName} ${row.lastName}`} value={chosen}
                                                    onChange={(event) => setDraft({ ...draft, [row.enrollmentId]: event.target.value as Grade | '' })}>
                                                    <option value="">No grade</option>
                                                    {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <button type="button" disabled={savingId !== null || chosen === (row.finalGrade ?? '')}
                                                    onClick={() => handleSave(row)}>Save</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    )
}