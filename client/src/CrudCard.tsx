import { useEffect, useId, useRef, useState, type ReactNode, type SubmitEvent } from 'react'
import { apiError, dashboardApi, readRecords, type DashboardRecord, type Field } from './dashboardApi'
import './DashboardForms.css'

type Props = {
  id: string
  title: string
  description: string
  endpoint: string
  fields: Field[]
  revision: number
  onChange: () => void
  envelope?: string
  recordLabel: (record: DashboardRecord) => string
  summary?: (records: DashboardRecord[]) => ReactNode
  deleteHelp?: string
}

// The same CRUD lifecycle serves each module; field definitions stay in the dashboard.
export default function CrudCard({ id, title, description, endpoint, fields, revision, onChange,
  envelope = 'records', recordLabel, summary, deleteHelp = 'This record will be permanently deleted.' }: Props) {
  const labelId = useId()
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [draft, setDraft] = useState<DashboardRecord>({})
  const [editing, setEditing] = useState<string | number | null>(null)
  const [deleting, setDeleting] = useState<DashboardRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const form = useRef<HTMLFormElement>(null)
  const writeRequest = useRef<AbortController | null>(null)
  const inFlight = useRef(false)
  useEffect(() => () => writeRequest.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    dashboardApi.get<unknown>(endpoint, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setRecords(readRecords(data, envelope))
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(apiError(failure))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [endpoint, envelope, revision, reload])

  function valueFor(field: Field) {
    return draft[field.name] ?? (field.type === 'checkbox' ? false : '')
  }
  function resetForm() { setDraft({}); setEditing(null) }
  async function mutate(method: 'post' | 'put' | 'delete', recordID?: string | number, body?: DashboardRecord) {
    if (inFlight.current) return
    inFlight.current = true
    const controller = new AbortController()
    writeRequest.current = controller
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await dashboardApi.request({ method, url: recordID === undefined ? endpoint : `${endpoint}/${recordID}`, data: body, signal: controller.signal })
      if (controller.signal.aborted) return
      resetForm()
      setDeleting(null)
      setNotice(method === 'delete' ? 'Record deleted.' : 'Record saved.')
      onChange()
      setReload((value) => value + 1)
    } catch (failure) {
      if (!controller.signal.aborted) setError(apiError(failure))
    } finally {
      inFlight.current = false
      if (!controller.signal.aborted) setSaving(false)
    }
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const body: DashboardRecord = {}
    for (const field of fields) {
      if (editing !== null && field.immutable) continue
      const value = valueFor(field)
      body[field.name] = field.type === 'number' ? Number(value) : value
    }
    // Selects use strings in HTML; foreign keys are numeric in the API.
    for (const key of ['courseID', 'enrollmentID']) if (key in body) body[key] = Number(body[key])
    if (body.status === 'upcoming' && 'grade' in body) body.grade = null
    void mutate(editing === null ? 'post' : 'put', editing ?? undefined, body)
  }
  function edit(record: DashboardRecord) {
    setDraft(record)
    setEditing(record.id as number ?? record.studentID as string)
    setDeleting(null)
    setNotice('')
    form.current?.querySelector<HTMLInputElement | HTMLSelectElement>('input:not(:disabled), select')?.focus()
    form.current?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <section id={id} className="dashboard-card crud-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>{title}</h2>
      <p>{description}</p>
      <p role="status">{loading ? 'Loading records…' : notice || `${records.length} record${records.length === 1 ? '' : 's'}.`}</p>
      {error && <div role="alert" className="field-error"><p>{error}</p><button type="button" disabled={saving} onClick={() => setReload((v) => v + 1)}>Retry loading</button></div>}
      {!loading && !error && summary?.(records)}
      {!loading && records.length === 0 && <p>No records yet. Add the first record below.</p>}
      <ul className="crud-records" aria-label={`${title} records`} aria-busy={loading}>
        {records.map((record) => {
          const key = record.id as number ?? record.studentID as string
          const label = recordLabel(record)
          return <li key={key}>
            <p>{label}</p>
            <div className="crud-actions">
              <button type="button" disabled={saving || loading} aria-label={`Edit ${label}`} onClick={() => edit(record)}>Edit</button>
              <button type="button" disabled={saving || loading} aria-label={`Delete ${label}`} onClick={() => { setDeleting(record); setNotice('') }}>Delete</button>
            </div>
          </li>
        })}
      </ul>
      {deleting && <div className="delete-confirmation" role="group" aria-label="Confirm deletion">
        <p>Delete {recordLabel(deleting)}? {deleteHelp}</p>
        <div className="crud-actions">
          <button type="button" disabled={saving} onClick={() => void mutate('delete', deleting.id as number ?? deleting.studentID as string)}>Confirm delete</button>
          <button type="button" disabled={saving} onClick={() => setDeleting(null)}>Keep record</button>
        </div>
      </div>}
      <form ref={form} onSubmit={submit}>
        <h3>{editing === null ? 'Add record' : 'Edit record'}</h3>
        <fieldset disabled={saving || loading}>
          <legend className="sr-only">{title} details</legend>
          {fields.map((field) => {
            const inputId = `${labelId}-${field.name}`
            const disabled = (editing !== null && field.immutable) || (field.name === 'grade' && draft.status === 'upcoming')
            const required = field.name === 'grade' && 'status' in draft ? draft.status === 'completed' : field.required
            return <div className="crud-field" key={field.name}>
              <label htmlFor={inputId}>{field.label}{required ? ' *' : ''}</label>
              {field.type === 'select' ? <select id={inputId} value={String(valueFor(field))} required={required} disabled={disabled}
                onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })}>
                <option value="">Choose {field.label.toLowerCase()}</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select> : field.type === 'checkbox' ? <input id={inputId} type="checkbox" checked={Boolean(valueFor(field))}
                onChange={(event) => setDraft({ ...draft, [field.name]: event.target.checked })} />
                : <input id={inputId} type={field.type || 'text'} value={String(valueFor(field))} required={required} disabled={disabled}
                  maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === 'number' ? 1 : undefined}
                  onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} />}
            </div>
          })}
          <div className="crud-actions">
            <button type="submit">{saving ? 'Saving…' : editing === null ? 'Add record' : 'Save changes'}</button>
            {editing !== null && <button type="button" onClick={resetForm}>Cancel edit</button>}
          </div>
        </fieldset>
      </form>
    </section>
  )
}
