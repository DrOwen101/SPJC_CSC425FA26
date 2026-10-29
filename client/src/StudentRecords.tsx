import { useEffect, useId, useState, type SubmitEvent } from 'react'
import {
  createStudentRecord, deleteStudentRecord, getStudentRecord, listMajors,
  studentRecordsError, updateStudentRecord,
  type Major, type StudentInput, type StudentRecord,
} from './studentRecordsApi'

function emptyStudent(): StudentInput {
  return { firstName: '', lastName: '', email: '', majorId: 0, enrollmentYear: new Date().getFullYear(), isActive: true }
}

type StudentRecordsProps = {
  id?: string
  selection?: { studentId: number; requestKey: number }
  onChange?: () => void
}

export default function StudentRecords({ id, selection, onChange }: StudentRecordsProps) {
  const labelId = useId()
  const selectedId = selection?.studentId
  const selectionRequest = selection?.requestKey
  const [majors, setMajors] = useState<Major[]>([])
  const [selected, setSelected] = useState<StudentRecord | null>(null)
  const [draft, setDraft] = useState<StudentInput>(emptyStudent)
  const [lookupId, setLookupId] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Loading student records…')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setBusy(true)
    setError('')
    setSelected(null)
    setDraft(emptyStudent())
    setConfirmDelete(false)
    setMessage('Loading student records…')
    Promise.all([listMajors(controller.signal), selectedId === undefined ? undefined : getStudentRecord(selectedId, controller.signal)])
      .then(([options, student]) => {
        if (controller.signal.aborted) return
        setMajors(options)
        if (student) selectStudent(student)
        setMessage(student ? `Retrieved student #${student.id} from the database.` : 'Student records loaded.')
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) { setError(studentRecordsError(reason)); setMessage('') }
      })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [selectedId, selectionRequest])

  function selectStudent(student: StudentRecord) {
    setSelected(student)
    // Only writable fields belong in POST/PUT bodies; IDs and timestamps are server-owned.
    setDraft({ firstName: student.firstName, lastName: student.lastName, email: student.email,
      majorId: student.majorId, enrollmentYear: student.enrollmentYear, isActive: student.isActive })
    setLookupId(String(student.id))
    setConfirmDelete(false)
  }

  async function perform(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('Working…')
    try { await action() } catch (reason) { setError(studentRecordsError(reason)); setMessage('') }
    finally { setBusy(false) }
  }

  function newStudent() {
    setSelected(null)
    setDraft(emptyStudent())
    setConfirmDelete(false)
    setError('')
    setMessage('Enter a new fictional student.')
  }

  async function retrieve(id: number) {
    await perform(async () => {
      // Clear stale details so a failed lookup cannot display the previous student.
      setSelected(null)
      setDraft(emptyStudent())
      setConfirmDelete(false)
      const student = await getStudentRecord(id)
      selectStudent(student)
      setMessage(`Retrieved student #${student.id} from the database.`)
    })
  }

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async () => {
      const saved = selected
        ? await updateStudentRecord(selected.id, draft)
        : await createStudentRecord(draft)
      selectStudent(saved)
      onChange?.()
      setMessage(`${selected ? 'Updated' : 'Created'} student #${saved.id}. Retrieve by ID to read it again.`)
    })
  }

  function remove() {
    if (!selected) return
    const id = selected.id
    void perform(async () => {
      await deleteStudentRecord(id)
      onChange?.()
      setSelected(null)
      setDraft(emptyStudent())
      setConfirmDelete(false)
      setMessage(`Deleted student #${id}. Retrieve by ID to verify it no longer exists.`)
    })
  }

  return (
    <section id={id} className="dashboard-card student-records" aria-labelledby={`${labelId}-records-heading`} tabIndex={-1}>
      <div className="records-heading-row">
        <div><h2 id={`${labelId}-records-heading`}>Student records</h2><p>Create, retrieve, edit, and delete fictional student records.</p></div>
      </div>
      <p role="status" aria-live="polite">{message}</p>
      {error && <p role="alert" className="field-error">{error}</p>}

      <form className="records-lookup" onSubmit={(event) => { event.preventDefault(); void retrieve(Number(lookupId)) }}>
        <label htmlFor={`${labelId}-record-lookup-id`}>Student record ID</label>
        <input id={`${labelId}-record-lookup-id`} type="number" required min="1" max="2147483647" step="1"
          value={lookupId} disabled={busy} onChange={(event) => setLookupId(event.target.value)} />
        <button disabled={busy} type="submit">Retrieve by ID</button>
      </form>

      <h3>{selected ? `Edit student #${selected.id}` : 'New student'}</h3>
      {selected && <dl className="records-saved" aria-label="Saved student details">
        <div><dt>Saved name</dt><dd>{selected.firstName} {selected.lastName}</dd></div>
        <div><dt>Saved email</dt><dd>{selected.email}</dd></div>
        <div><dt>Saved major</dt><dd>{selected.majorName}</dd></div>
        <div><dt>Saved enrollment year</dt><dd>{selected.enrollmentYear}</dd></div>
        <div><dt>Saved status</dt><dd>{selected.isActive ? 'Active' : 'Inactive'}</dd></div>
      </dl>}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Student information</legend>
          <div className="records-fields">
            <label htmlFor={`${labelId}-record-first`}>First name<input id={`${labelId}-record-first`} required maxLength={60} value={draft.firstName}
              onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} /></label>
            <label htmlFor={`${labelId}-record-last`}>Last name<input id={`${labelId}-record-last`} required maxLength={60} value={draft.lastName}
              onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} /></label>
            <label htmlFor={`${labelId}-record-email`}>Email<input id={`${labelId}-record-email`} type="email" required maxLength={254} value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
            <div><label htmlFor={`${labelId}-record-major`}>Major</label><select id={`${labelId}-record-major`} required value={draft.majorId || ''}
              onChange={(event) => setDraft({ ...draft, majorId: Number(event.target.value) })}>
              <option value="">Choose a major</option>{majors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
            </select></div>
            <label htmlFor={`${labelId}-record-year`}>Enrollment year<input id={`${labelId}-record-year`} type="number" min="2000" max="2100" step="1" required value={draft.enrollmentYear || ''}
              onChange={(event) => setDraft({ ...draft, enrollmentYear: Number(event.target.value) })} /></label>
            <label className="records-checkbox" htmlFor={`${labelId}-record-active`}><input id={`${labelId}-record-active`} type="checkbox" checked={draft.isActive}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />Active student</label>
          </div>
          <div className="records-actions">
            <button type="submit" disabled={majors.length === 0}>{selected ? 'Save changes' : 'Create student'}</button>
            {selected && <button type="button" onClick={newStudent}>New student</button>}
            {selected && !confirmDelete && <button type="button" className="records-delete" onClick={() => setConfirmDelete(true)}>Delete record</button>}
          </div>
          {confirmDelete && selected && <div className="records-confirm">
            <p>Delete student #{selected.id}, {selected.firstName} {selected.lastName}? This permanently removes the record.</p>
            <div className="records-actions"><button type="button" className="records-delete" onClick={remove}>Confirm delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)}>Cancel delete</button></div>
          </div>}
        </fieldset>
      </form>
    </section>
  )
}
