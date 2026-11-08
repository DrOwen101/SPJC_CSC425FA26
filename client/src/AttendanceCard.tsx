import { useState } from 'react'
import axios from 'axios'

type AttendanceRecord = {
  id: number
  studentId: string
  studentName: string
  date: string
  status: 'present' | 'absent' | 'late'
}

type Action = 'create' | 'retrieve' | 'update' | 'delete'

// Change environments through client/.env.local:
// VITE_API_BASE_URL=http://localhost:3000
const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, ''),
  timeout: 10000,
})

export default function AttendanceCard() {
  const [recordId, setRecordId] = useState('')
  const [studentId, setStudentId] = useState('1001')
  const [date, setDate] = useState('2026-11-07')
  const [status, setStatus] =
    useState<AttendanceRecord['status']>('present')
  const [record, setRecord] =
    useState<AttendanceRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function displayRecord(saved: AttendanceRecord) {
    setRecord(saved)
    setRecordId(String(saved.id))
    setStudentId(saved.studentId)
    setDate(saved.date)
    setStatus(saved.status)
  }

  async function perform(action: Action) {
    setError('')
    setMessage('')
    setRecord(null)

    const id = recordId.trim()

    if (
      action !== 'create' &&
      (
        !/^[1-9]\d*$/.test(id) ||
        !Number.isSafeInteger(Number(id)) ||
        Number(id) > 2147483647
      )
    ) {
      setError('Enter a valid positive record ID.')
      return
    }

    if (
      (action === 'create' || action === 'update') &&
      (
        !/^\d{4}$/.test(studentId.trim()) ||
        !date
      )
    ) {
      setError('Enter a four-digit student ID and a date.')
      return
    }

    setBusy(true)
    let verification = ''

    try {
      const payload = {
        studentId: studentId.trim(),
        date,
        status,
      }

      if (action === 'create') {
        const created = await api.post<{ id: number }>(
          '/api/attendance',
          payload
        )

        const newId = created.data.id
        setRecordId(String(newId))
        verification =
          `Record ${newId} was created, but retrieval failed. `

        // A separate GET verifies the stored values.
        const saved = await api.get<AttendanceRecord>(
          `/api/attendance/${newId}`
        )

        displayRecord(saved.data)
        setMessage(`Record ${newId} saved and retrieved.`)
      }

      if (action === 'retrieve') {
        const saved = await api.get<AttendanceRecord>(
          `/api/attendance/${id}`
        )

        displayRecord(saved.data)
        setMessage(`Record ${id} retrieved from the database.`)
      }

      if (action === 'update') {
        await api.put(`/api/attendance/${id}`, payload)

        verification =
          `Record ${id} was updated, but retrieval failed. `

        const saved = await api.get<AttendanceRecord>(
          `/api/attendance/${id}`
        )

        displayRecord(saved.data)
        setMessage(`Record ${id} updated and retrieved again.`)
      }

      if (action === 'delete') {
        await api.delete(`/api/attendance/${id}`)

        verification =
          `Record ${id} was deleted, but verification failed. `

        // Confirm a fresh retrieval returns 404.
        let missing = false

        try {
          await api.get(`/api/attendance/${id}`)
        } catch (checkError) {
          if (
            axios.isAxiosError(checkError) &&
            checkError.response?.status === 404
          ) {
            missing = true
          } else {
            throw checkError
          }
        }

        if (!missing) {
          throw new Error('The record is still retrievable.')
        }

        setMessage(
          `Record ${id} deleted. A fresh GET returned 404.`
        )
      }
    } catch (requestError) {
      let detail = 'The request failed. Please try again.'

      if (axios.isAxiosError(requestError)) {
        detail =
          requestError.response?.data?.error ||
          'Cannot reach the API. Check the backend and connection.'
      } else if (requestError instanceof Error) {
        detail = requestError.message
      }

      setError(verification + detail)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      id="attendance"
      className="dashboard-card"
      aria-labelledby="attendance-heading"
      tabIndex={-1}
      aria-busy={busy}
    >
      <h2 id="attendance-heading">Attendance</h2>
      <p>Create, retrieve, update, or delete fictional attendance.</p>
      <p>Sample student IDs: 1001, 1002, 1003.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void perform('create')
        }}
      >
        <fieldset disabled={busy} className="attendance-fields">
          <legend>Attendance record</legend>

          <label htmlFor="attendance-record-id">Record ID</label>
          <input
            id="attendance-record-id"
            type="text"
            inputMode="numeric"
            value={recordId}
            onChange={(event) => setRecordId(event.target.value)}
            placeholder="Generated when you save"
            aria-describedby="attendance-id-help"
          />
          <small id="attendance-id-help">
            Use this ID to retrieve, update, or delete the same record.
          </small>

          <label htmlFor="attendance-student-id">Student ID</label>
          <input
            id="attendance-student-id"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          />

          <label htmlFor="attendance-date">Date</label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <label htmlFor="attendance-status">Status</label>
          <select
            id="attendance-status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as AttendanceRecord['status']
              )
            }
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>

          <div className="attendance-actions">
            <button type="submit">Save New</button>
            <button
              type="button"
              onClick={() => void perform('retrieve')}
            >
              Retrieve
            </button>
            <button
              type="button"
              onClick={() => void perform('update')}
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => void perform('delete')}
            >
              Delete
            </button>
          </div>
        </fieldset>
      </form>

      <p role="status">
        {busy ? 'Processing request…' : message}
      </p>
      {error && <p className="field-error" role="alert">{error}</p>}

      {record && (
        <div>
          <h3>Retrieved database record</h3>
          <dl>
            <dt>Record ID</dt><dd>{record.id}</dd>
            <dt>Student ID</dt><dd>{record.studentId}</dd>
            <dt>Student</dt><dd>{record.studentName}</dd>
            <dt>Date</dt><dd>{record.date}</dd>
            <dt>Status</dt><dd>{record.status}</dd>
          </dl>
        </div>
      )}
    </section>
  )
}