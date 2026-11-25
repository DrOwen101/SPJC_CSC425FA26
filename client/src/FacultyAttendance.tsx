import { useEffect, useState, type SubmitEvent } from 'react'
import AttendanceTable from './AttendanceTable'
import { facultyError, type AttendanceRow, type AttendanceStatus, type FacultyApi, type Section } from './facultyApi'

const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

function today() {
  const date = new Date()
  const localDate = new Date(date.valueOf() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

export default function FacultyAttendance({ api, sections }: { api: FacultyApi; sections: Section[] }) {
  const [section, setSection] = useState(sections[0]?.id ?? '')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  return (
    <section id="faculty-attendance" className="dashboard-card faculty-card" aria-labelledby="faculty-attendance-heading" tabIndex={-1}>
      <h2 id="faculty-attendance-heading">Record attendance</h2>
      <p>Choose a section and meeting date to enter or review attendance.</p>
      <div className="faculty-controls">
        <label>Attendance section
          <select value={section} onChange={(event) => setSection(event.target.value)} disabled={saving || !sections.length}>
            {sections.length === 0 && <option value="">No assigned sections</option>}
            {sections.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
          </select>
        </label>
        <label>Meeting date
          <input type="date" value={date} min="2000-01-01" max="2099-12-31" disabled={saving}
            onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      {section && date && <AttendanceRoster key={`${section}:${date}`} api={api} section={section}
        date={date} saving={saving} setSaving={setSaving} />}
    </section>
  )
}

function AttendanceRoster({ api, section, date, saving, setSaving }: {
  api: FacultyApi; section: string; date: string; saving: boolean; setSaving: (saving: boolean) => void
}) {
  const [roster, setRoster] = useState<AttendanceRow[] | null>(null)
  const [edits, setEdits] = useState<Record<number, AttendanceStatus>>({})
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.attendance(section, date, controller.signal)
      .then(({ roster }) => { if (!controller.signal.aborted) setRoster(roster) })
      .catch((error) => { if (!controller.signal.aborted) setError(facultyError(error)) })
    return () => controller.abort()
  }, [api, date, reload, section])

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const entries = Object.entries(edits).map(([studentId, status]) => ({ studentId: Number(studentId), status }))
    if (entries.length === 0 || saving) return
    setSaving(true)
    setError('')
    setStatus('')
    try {
      const { saved } = await api.saveAttendance(section, date, entries)
      const { roster } = await api.attendance(section, date)
      setRoster(roster)
      setEdits({})
      setStatus(`Saved and reloaded attendance for ${saved} ${saved === 1 ? 'student' : 'students'} on ${date}.`)
    } catch (error) {
      setError(facultyError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {!roster && !error && <p role="status">Loading roster…</p>}
      {roster?.length === 0 && <p role="status">This section has no students on its roster.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!roster && error && <button type="button" onClick={() => { setError(''); setReload(reload + 1) }}>Try again</button>}
      {!!roster?.length && (
        <form onSubmit={save}>
          <AttendanceTable rows={roster} caption={`Roster for ${section} on ${date}`} columns={['Status']} regionLabel="Attendance roster"
            renderDetails={(student) => (
              <td>
                <select aria-label={`Attendance for ${student.fullName}`} disabled={saving}
                    value={edits[student.studentId] ?? student.status ?? ''}
                  onChange={(event) => {
                    const nextStatus = event.target.value as AttendanceStatus | ''
                    const nextEdits = { ...edits }
                    if (!nextStatus || nextStatus === student.status) delete nextEdits[student.studentId]
                    else nextEdits[student.studentId] = nextStatus
                    setEdits(nextEdits)
                    setStatus('')
                  }}>
                  {student.status === null && <option value="">Unmarked</option>}
                  {statuses.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </td>
            )}
          />
          <button type="submit" disabled={saving || !Object.keys(edits).length}>
            {saving ? 'Saving…' : 'Save attendance'}
          </button>
        </form>
      )}
      {status && <p className="status-label" role="status">{status}</p>}
    </>
  )
}
