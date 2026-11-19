import { useEffect, useId, useState } from 'react'
import {
    STATUSES, facultyError, getAttendance, saveAttendance,
    type AttendanceRow, type AttendanceStatus, type Section,
} from './facultyApi'

const ABSENCE_LIMIT = 3

type Props = { section: Section | null; refreshKey: number; onSaved: () => void }

export default function AttendanceTracker({ section, refreshKey, onSaved }: Props) {
    const labelId = useId()
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD, local time
    const [rows, setRows] = useState<AttendanceRow[]>([])
    const [draft, setDraft] = useState<Record<number, AttendanceStatus | ''>>({})
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const sectionId = section?.id

    useEffect(() => {
        setError('')
        if (sectionId === undefined || !date) { setRows([]); return }
        let active = true
        getAttendance(sectionId, date)
            .then((data) => {
                if (!active) return
                setRows(data)
                setDraft(Object.fromEntries(data.map((row) => [row.enrollmentId, row.status ?? ''])))
            })
            .catch((requestError) => { if (active) { setRows([]); setError(facultyError(requestError)) } })
        return () => { active = false }
    }, [sectionId, date, refreshKey])

    async function handleSave() {
        if (sectionId === undefined) return
        const records = rows
            .filter((row) => draft[row.enrollmentId])
            .map((row) => ({ enrollmentId: row.enrollmentId, status: draft[row.enrollmentId] as AttendanceStatus }))
        if (records.length === 0) { setError('Mark at least one student before saving.'); return }
        setSaving(true)
        setError('')
        setMessage('')
        try {
            await saveAttendance(sectionId, date, records)
            setMessage(`Saved attendance for ${records.length} students on ${date}.`)
            onSaved() // reloads from the database
        } catch (requestError) {
            setError(facultyError(requestError))
        } finally {
            setSaving(false)
        }
    }

    function markAllPresent() {
        setDraft(Object.fromEntries(rows.map((row) => [row.enrollmentId, 'present' as const])))
    }

    const flagged = rows.filter((row) => row.absences >= ABSENCE_LIMIT)

    return (
        <section id="faculty-alerts" className="dashboard-card faculty-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
            <h2 id={`${labelId}-heading`}>Attendance and alerts{section ? `: ${section.courseCode}-${section.sectionNumber}` : ''}</h2>
            {!section && <p>Select a section in Teaching assignments to record attendance.</p>}
            <p role="status">{message}</p>
            {error && <p role="alert" className="field-error">{error}</p>}
            {section && !error && (
                <>
                    <div className="faculty-form-row">
                        <div>
                            <label htmlFor={`${labelId}-date`}>Class date</label>
                            <input id={`${labelId}-date`} type="date" required value={date}
                                onChange={(event) => setDate(event.target.value)} />
                        </div>
                        <button type="button" onClick={markAllPresent}>Mark all present</button>
                        <button type="button" disabled={saving} onClick={handleSave}>Save attendance</button>
                    </div>

                    <h3>Excessive absences ({ABSENCE_LIMIT} or more)</h3>
                    {flagged.length === 0
                        ? <p>No students have reached {ABSENCE_LIMIT} absences.</p>
                        : (
                            <ul className="faculty-flag">
                                {flagged.map((row) => (
                                    <li key={row.studentId}>{row.firstName} {row.lastName}: {row.absences} absences</li>
                                ))}
                            </ul>
                        )}

                    <div className="faculty-table-scroll">
                        <table>
                            <caption>Attendance for {date}</caption>
                            <thead>
                                <tr><th scope="col">Student</th><th scope="col">Status</th><th scope="col">Total absences</th></tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.enrollmentId}>
                                        <td>{row.firstName} {row.lastName}</td>
                                        <td>
                                            <select aria-label={`Attendance for ${row.firstName} ${row.lastName}`}
                                                value={draft[row.enrollmentId] ?? ''}
                                                onChange={(event) => setDraft({ ...draft, [row.enrollmentId]: event.target.value as AttendanceStatus | '' })}>
                                                <option value="">Not recorded</option>
                                                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                            </select>
                                        </td>
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