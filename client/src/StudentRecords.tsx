import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from 'react'
import { dashboardApi, requestError, type Major, type RequestEntry, type SavedStudent, type StudentInput } from './dashboardApi'
import './StudentRecords.css'

const emptyForm: StudentInput = { firstName: '', lastName: '', email: '', majorId: 0, enrollmentYear: 2026, isActive: true }

export default function StudentRecords() {
  const [majors, setMajors] = useState<Major[]>([])
  const [students, setStudents] = useState<SavedStudent[]>([])
  const [form, setForm] = useState<StudentInput>(emptyForm)
  const [saved, setSaved] = useState<SavedStudent | null>(null)
  const [lookupId, setLookupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<RequestEntry[]>([])
  const record = useCallback((entry: RequestEntry) => setRequests((entries) => [...entries.slice(-19), entry]), [])
  const api = useMemo(() => dashboardApi(record), [record])

  useEffect(() => {
    let active = true
    Promise.all([api.majors(), api.list()]).then(([majorData, studentData]) => {
      if (!active) return
      setMajors(majorData.majors)
      setStudents(studentData.students)
      setForm((current) => ({ ...current, majorId: majorData.majors[0]?.id || 0 }))
    }).catch((reason: unknown) => { if (active) setError(requestError(reason)) })
    return () => { active = false }
  }, [api])

  function showStudent(student: SavedStudent) {
    setSaved(student)
    setForm({ firstName: student.firstName, lastName: student.lastName, email: student.email,
      majorId: student.majorId, enrollmentYear: student.enrollmentYear, isActive: student.isActive })
    setLookupId(String(student.id))
  }
  async function retrieve(id: number) {
    setBusy(true); setError(''); setMessage('')
    setSaved(null)
    try {
      showStudent((await api.get(id)).student)
      setMessage(`Retrieved student ${id} from the database.`)
    } catch (reason) {
      setForm({ ...emptyForm, majorId: majors[0]?.id || 0 })
      setError(requestError(reason))
    } finally { setBusy(false) }
  }
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    let writtenId: number | null = null
    try {
      const result = saved ? await api.update(saved.id, form) : await api.create(form)
      writtenId = result.student.id
      setLookupId(String(writtenId))
      // Preserve the identity if this follow-up GET fails; don't accidentally create a duplicate.
      setSaved(result.student)
      showStudent((await api.get(writtenId)).student)
      setMessage(`Saved and retrieved student ${writtenId} from the database.`)
      setStudents((await api.list()).students)
    } catch (reason) {
      setError(`${writtenId ? `Write returned student ${writtenId}, but refresh failed. Retrieve that ID before retrying. ` : ''}${requestError(reason)}`)
    } finally { setBusy(false) }
  }
  async function remove() {
    if (!saved) return
    const id = saved.id
    setBusy(true); setError(''); setMessage('')
    try {
      await api.remove(id)
      setSaved(null)
      setForm({ ...emptyForm, majorId: majors[0]?.id || 0 })
      setMessage(`Deleted student ${id}. Retrieve ID ${id} to verify it is not found.`)
      setStudents((await api.list()).students)
    } catch (reason) { setError(requestError(reason)) }
    finally { setBusy(false) }
  }
  function newRecord() {
    setSaved(null); setForm({ ...emptyForm, majorId: majors[0]?.id || 0 }); setMessage(''); setError('')
  }

  return (
    <section id="student-records" className="dashboard-card student-records" aria-labelledby="records-title" tabIndex={-1}>
      <p className="eyebrow">Lab 10 · PostgreSQL</p>
      <h2 id="records-title">Student records</h2>
      <p>Manage fictional students and their majors. Every save is followed by a fresh database retrieval.</p>
      <form className="record-lookup" onSubmit={(event) => { event.preventDefault(); void retrieve(Number(lookupId)) }}>
        <label htmlFor="record-id">Retrieve student by database ID</label>
        <div className="record-actions">
          <input id="record-id" type="number" min="1" max="2147483647" step="1" required value={lookupId} onChange={(event) => setLookupId(event.target.value)} />
          <button disabled={busy} type="submit">Retrieve record</button>
          <button disabled={busy} type="button" onClick={newRecord}>New student</button>
        </div>
      </form>
      <form onSubmit={(event) => void save(event)}>
        <h3>{saved ? `Edit student ${saved.id}` : 'Create a student'}</h3>
        <fieldset disabled={busy} className="record-fields">
          <legend>Student information</legend>
          <label>First name<input required maxLength={80} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
          <label>Last name<input required maxLength={80} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
          <label>Email<input required type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Major<select required value={form.majorId || ''} onChange={(event) => setForm({ ...form, majorId: Number(event.target.value) })}>
            <option value="" disabled>Select a major</option>
            {majors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
          </select></label>
          <label>Enrollment year<input required type="number" min="1900" max="2100" step="1" value={form.enrollmentYear} onChange={(event) => setForm({ ...form, enrollmentYear: Number(event.target.value) })} /></label>
          <label className="record-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active student</label>
        </fieldset>
        <div className="record-actions">
          <button disabled={busy || !majors.length} type="submit">{saved ? 'Save changes' : 'Create student'}</button>
          <button className="record-delete" disabled={busy || !saved} type="button" onClick={() => void remove()}>Delete student {saved?.id ?? ''}</button>
        </div>
      </form>
      {message && <p role="status" className="record-status">{message}</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
      {saved && <div className="record-result" aria-label="Retrieved database values">
        <h3>Retrieved record · ID {saved.id}</h3>
        <p>{saved.firstName} {saved.lastName} · {saved.email}</p>
        <p>{saved.majorName} · Enrolled {saved.enrollmentYear} · {saved.isActive ? 'Active' : 'Inactive'}</p>
        <p>Last saved: <time dateTime={saved.updatedAt}>{saved.updatedAt}</time></p>
      </div>}
      <h3>Saved students</h3>
      <div className="record-table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Major</th><th>Action</th></tr></thead>
        <tbody>{students.map((student) => <tr key={student.id}>
          <td>{student.id}</td><td>{student.firstName} {student.lastName}</td><td>{student.email}</td><td>{student.majorName}</td>
          <td><button type="button" disabled={busy} onClick={() => void retrieve(student.id)}>Retrieve {student.id}</button></td>
        </tr>)}</tbody>
      </table></div>
      <details open className="record-requests"><summary>Recent Axios requests</summary>
        <ol>{requests.map((entry, index) => <li key={`${entry.time}-${index}`}><time>{entry.time}</time> <code>{entry.method} {entry.path}</code> → {entry.status}</li>)}</ol>
      </details>
    </section>
  )
}
