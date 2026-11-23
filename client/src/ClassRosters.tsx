import { useEffect, useId, useState, type SubmitEvent } from 'react'
import {
  createAttendanceRecord, deleteAttendanceRecord, getAttendanceRecord,
  listAttendanceRecords,
  attendanceRecordsError, updateAttendanceRecord,
  type AttendanceRecordInput, type AttendanceRecord,
} from './ClassRostersAPI'

type AttendanceRecordDraft = Omit<AttendanceRecordInput, 'date'> & { date: string }

function formatDateForDisplay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

function parseDisplayDate(date: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date)
  if (!match) return null

  const [, day, month, year] = match
  const parsed = new Date(0)
  parsed.setUTCHours(0, 0, 0, 0)
  parsed.setUTCFullYear(Number(year), Number(month) - 1, Number(day))
  if (parsed.getUTCFullYear() !== Number(year)
    || parsed.getUTCMonth() !== Number(month) - 1
    || parsed.getUTCDate() !== Number(day)) {
    return null
  }
  return `${year}-${month}-${day}`
}

function emptyAttendanceRecords(): AttendanceRecordDraft {
  const today = new Date()
  return {
    courseID: 0,
    date: `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getFullYear()).padStart(4, '0')}`,
    attendanceNumber: 0,
  }
}

type AttendanceRecordsProps = {
  id?: string
  selection?: { studentID: number; requestKey: number }
  onChange?: () => void
}

export default function StudentRecords({ id, selection, onChange }: AttendanceRecordsProps) {
  const labelId = useId()
  const selectedId = selection?.studentID
  const selectionRequest = selection?.requestKey
 const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordInput[]>([])
  const [selected, setSelected] = useState<AttendanceRecord | null>(null)
  const [draft, setDraft] = useState<AttendanceRecordDraft>(emptyAttendanceRecords)
  const [lookupId, setLookupId] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Loading class rosters…')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setBusy(true)
    setError('')
    setSelected(null)
    setDraft(emptyAttendanceRecords())
    setConfirmDelete(false)
    setMessage('Loading class rosters…')
    async function loadForm() {
      try {
        // These independent requests can run together. Promise.all waits for both.
        const [options, attendanceRecord] = await Promise.all([
          listAttendanceRecords(controller.signal),
          selectedId === undefined ? undefined : getAttendanceRecord(selectedId, controller.signal),
        ])
        if (controller.signal.aborted) return

        setAttendanceRecords(options)
        if (attendanceRecord) {
          selectAttendanceRecord(attendanceRecord)
          setMessage(`Retrieved record #${attendanceRecord.courseID} from the database.`)
        } else {
          setMessage('Attendance records loaded.')
        }
      } catch (error) {
        if (controller.signal.aborted) return

        setError(attendanceRecordsError(error))
        setMessage('')
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false)
        }
      }
    }

    void loadForm()
    return () => controller.abort()
  }, [selectedId, selectionRequest])

  function selectAttendanceRecord(attendanceRecord: AttendanceRecord) {
    setSelected(attendanceRecord)
    // Only writable fields belong in POST/PUT bodies; IDs and timestamps are server-owned.
    setDraft({
      courseID: attendanceRecord.courseID,
      date: formatDateForDisplay(attendanceRecord.date),
      attendanceNumber: attendanceRecord.attendanceNumber,
    })
    setLookupId(String(attendanceRecord.courseID))
    setConfirmDelete(false)
  }

  // Each action supplies its API call. This helper handles the shared UI steps:
  // show progress, await the action, display errors, and enable the form again.
  async function runAttendanceRecordAction(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('Working…')
    try {
      await action()
    } catch (error) {
      setError(attendanceRecordsError(error))
      setMessage('')
    } finally {
      setBusy(false)
    }
  }

  function newAttendanceRecord() {
    setSelected(null)
    setDraft(emptyAttendanceRecords())
    setConfirmDelete(false)
    setError('')
    setMessage('Enter a new fictional attendance record.')
  }

  async function retrieve(id: number) {
    await runAttendanceRecordAction(async () => {
      // Clear stale details so a failed lookup cannot display the previous student.
      setSelected(null)
      setDraft(emptyAttendanceRecords())
      setConfirmDelete(false)
      const attendanceRecord = await getAttendanceRecord(id)
      selectAttendanceRecord(attendanceRecord)
      setMessage(`Retrieved record #${attendanceRecord.courseID} from the database.`)
    })
  }

  async function handleLookup(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await retrieve(Number(lookupId))
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const date = parseDisplayDate(draft.date)
    if (!date) {
      setError('Enter a valid date in DD-MM-YYYY format.')
      setMessage('')
      return
    }

    await runAttendanceRecordAction(async () => {
      const attendanceRecord: AttendanceRecordInput = { ...draft, date }
      let saved: AttendanceRecord
      if (selected) {
        saved = await updateAttendanceRecord(selected.courseID, attendanceRecord)
      } else {
        saved = await createAttendanceRecord(attendanceRecord)
      }
      selectAttendanceRecord(saved)
      onChange?.()
      setMessage(`${selected ? 'Updated' : 'Created'} record #${saved.courseID}. Retrieve by ID to read it again.`)
    })
  }

  async function remove() {
    if (!selected) return
    const id = selected.courseID
    await runAttendanceRecordAction(async () => {
      await deleteAttendanceRecord(id)
      onChange?.()
      setSelected(null)
      setDraft(emptyAttendanceRecords())
      setConfirmDelete(false)
      setMessage(`Deleted record #${id}. Retrieve by ID to verify it no longer exists.`)
    })
  }

  return (
    <section id={id} className="dashboard-card student-records" aria-labelledby={`${labelId}-records-heading`} tabIndex={-1}>
      <div className="records-heading-row">
        <div><h2 id={`${labelId}-records-heading`}>Class Rosters</h2><p>Create, retrieve, edit, and delete fictional attendance records.</p></div>
      </div>
      <p role="status" aria-live="polite">{message}</p>
      {error && <p role="alert" className="field-error">{error}</p>}

      <form className="records-lookup" onSubmit={handleLookup}>
        <label htmlFor={`${labelId}-record-lookup-id`}>Course ID</label>
        <input id={`${labelId}-record-lookup-id`} type="number" required min="1" max="2147483647" step="1"
          value={lookupId} disabled={busy} onChange={(event) => setLookupId(event.target.value)} />
        <button disabled={busy} type="submit">Retrieve by ID</button>
      </form>

      <h3>{selected ? `Edit attendance record` : 'New attendance record'}</h3>
      {selected && <dl className="records-saved" aria-label="Saved attendance record details">
        <div><dt>Saved course ID</dt><dd>{selected.courseID}</dd></div>
        <div><dt>Saved date</dt><dd>{formatDateForDisplay(selected.date)}</dd></div>
        <div><dt>Saved attendance number</dt><dd>{selected.attendanceNumber}</dd></div>
      </dl>}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Attendance Record information</legend>
          <div className="records-fields">
            <label htmlFor={`${labelId}-record-first`}>Course ID<input id={`${labelId}-record-first`} required maxLength={50} value={draft.courseID}
              onChange={(event) => setDraft({ ...draft, courseID: Number(event.target.value) })} /></label>
            <label htmlFor={`${labelId}-record-last`}>Date<input id={`${labelId}-record-last`} type="text" required
              maxLength={10} inputMode="numeric" placeholder="DD-MM-YYYY" pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}" value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
            <label htmlFor={`${labelId}-record-major`}>Attendance<input id={`${labelId}-record-major`} required maxLength={50} value={draft.attendanceNumber}
              onChange={(event) => setDraft({ ...draft, attendanceNumber: Number(event.target.value) })} /></label>
          </div>
          <div className="records-actions">
            <button type="submit" disabled={attendanceRecords.length === 0}>{selected ? 'Save changes' : 'Create course record'}</button>
            {selected && <button type="button" onClick={newAttendanceRecord}>New attendance record</button>}
            {selected && !confirmDelete && <button type="button" className="records-delete" onClick={() => setConfirmDelete(true)}>Delete record</button>}
          </div>
          {confirmDelete && selected && <div className="records-confirm">
            <p>Delete attendance record #{selected.courseID}, {formatDateForDisplay(selected.date)} {selected.attendanceNumber}? This permanently removes the record.</p>
            <div className="records-actions"><button type="button" className="records-delete" onClick={remove}>Confirm delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)}>Cancel delete</button></div>
          </div>}
        </fieldset>
      </form>
    </section>
  )
}