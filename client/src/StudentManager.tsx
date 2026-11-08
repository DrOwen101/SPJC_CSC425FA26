import { useEffect, useId, useState, type SubmitEvent } from 'react'
import './StudentManager.css'
import { errorMessage } from './apiClient'
import {
  createStudent,
  deleteStudent,
  getStudent,
  listMajors,
  updateStudent,
  type DashboardStudent,
  type Major,
  type StudentInput,
} from './dashboardStudentsApi'

type StudentManagerProps = { id?: string }

// Form values stay as text until they are sent, then become numbers and booleans.
type StudentForm = {
  firstName: string
  lastName: string
  email: string
  majorId: string
  enrollmentYear: string
  isActive: boolean
}

const blankForm: StudentForm = {
  firstName: '',
  lastName: '',
  email: '',
  majorId: '',
  enrollmentYear: String(new Date().getFullYear()),
  isActive: true,
}

function toInput(form: StudentForm): StudentInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    majorId: Number(form.majorId),
    enrollmentYear: Number(form.enrollmentYear),
    isActive: form.isActive,
  }
}

function toForm(student: DashboardStudent): StudentForm {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    majorId: String(student.majorId),
    enrollmentYear: String(student.enrollmentYear),
    isActive: student.isActive,
  }
}

// Lab 10: create, retrieve, edit, and delete one student stored in PostgreSQL.
// The record shown below always comes from an API response, never only from form state.
function StudentManager({ id = 'student-records' }: StudentManagerProps) {
  const labelId = useId()
  const [majors, setMajors] = useState<Major[]>([])
  const [newForm, setNewForm] = useState<StudentForm>(blankForm)
  const [lookupId, setLookupId] = useState('')
  const [student, setStudent] = useState<DashboardStudent | null>(null)
  const [editForm, setEditForm] = useState<StudentForm>(blankForm)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Loading majors…')
  const [error, setError] = useState('')

  // Load the majors once so both forms can offer them in a dropdown.
  useEffect(() => {
    listMajors()
      .then((loaded) => {
        setMajors(loaded)
        setMessage('Add a student or load one by ID.')
      })
      .catch((requestError) => {
        setError(errorMessage(requestError))
        setMessage('Majors could not be loaded from the database.')
      })
  }, [])

  // Runs one API call, shows a "working" message, and catches every failure,
  // so a success message only appears after the server confirms the change.
  async function run(working: string, action: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage(working)
    try {
      await action()
    } catch (requestError) {
      setError(errorMessage(requestError))
      setMessage('The last request did not succeed. Nothing shown below was changed by it.')
    } finally {
      setBusy(false)
    }
  }

  function showStudent(saved: DashboardStudent) {
    setStudent(saved)
    setLookupId(String(saved.id))
    setEditForm(toForm(saved))
  }

  function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void run('Saving the new student to the database…', async () => {
      const saved = await createStudent(toInput(newForm))
      showStudent(saved)
      setNewForm(blankForm)
      setMessage(`Saved. The database created student #${saved.id}.`)
    })
  }

  function handleLoad(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const studentId = Number(lookupId)
    if (!Number.isInteger(studentId) || studentId < 1) {
      setError('Enter a student ID that is a positive whole number.')
      return
    }
    void run(`Loading student #${studentId} from the database…`, async () => {
      setStudent(null)
      const loaded = await getStudent(studentId)
      showStudent(loaded)
      setMessage(`Loaded student #${studentId} from the database.`)
    })
  }

  function handleUpdate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!student) return
    const studentId = student.id
    void run(`Saving changes to student #${studentId}…`, async () => {
      const updated = await updateStudent(studentId, toInput(editForm))
      showStudent(updated)
      setMessage(`Saved changes. Student #${studentId} was updated in the database.`)
    })
  }

  function handleDelete() {
    if (!student) return
    const studentId = student.id
    if (!window.confirm(`Delete student #${studentId}, ${student.firstName} ${student.lastName}?`)) return
    void run(`Deleting student #${studentId}…`, async () => {
      await deleteStudent(studentId)
      setStudent(null)
      setMessage(`Deleted student #${studentId}. Load #${studentId} again to confirm it is gone.`)
    })
  }

  return (
    <section id={id} className="dashboard-card student-manager" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>Student Records</h2>
      <p>Students are saved in the PostgreSQL database. All data is fictional.</p>

      <div className="student-manager-columns">
        <form onSubmit={handleCreate} noValidate aria-labelledby={`${labelId}-new`}>
          <h3 id={`${labelId}-new`}>Add a student</h3>
          <StudentFields prefix={`${labelId}-new`} form={newForm} majors={majors} onChange={setNewForm} />
          <button type="submit" disabled={busy || majors.length === 0}>Save new student</button>
        </form>

        <form onSubmit={handleLoad} noValidate aria-labelledby={`${labelId}-load`}>
          <h3 id={`${labelId}-load`}>Load a student</h3>
          <label htmlFor={`${labelId}-id`}>Student ID</label>
          <input id={`${labelId}-id`} value={lookupId} inputMode="numeric"
            onChange={(event) => setLookupId(event.target.value)} />
          <button type="submit" disabled={busy}>Load from database</button>
        </form>
      </div>

      <p className="student-manager-status" role="status">{message}</p>
      {error && <p className="student-manager-error" role="alert">{error}</p>}

      {student && (
        <div className="student-manager-record">
          <h3>Student #{student.id} (from the database)</h3>
          <dl>
            <div><dt>Student ID</dt><dd>{student.id}</dd></div>
            <div><dt>Name</dt><dd>{student.firstName} {student.lastName}</dd></div>
            <div><dt>Email</dt><dd>{student.email}</dd></div>
            <div><dt>Major</dt><dd>{student.majorName}</dd></div>
            <div><dt>Enrollment year</dt><dd>{student.enrollmentYear}</dd></div>
            <div><dt>Active</dt><dd>{student.isActive ? 'Yes' : 'No'}</dd></div>
            <div><dt>Last saved</dt><dd>{new Date(student.updatedAt).toLocaleString()}</dd></div>
          </dl>

          <form onSubmit={handleUpdate} noValidate aria-labelledby={`${labelId}-edit`}>
            <h3 id={`${labelId}-edit`}>Edit student #{student.id}</h3>
            <StudentFields prefix={`${labelId}-edit`} form={editForm} majors={majors} onChange={setEditForm} />
            <div className="student-manager-actions">
              <button type="submit" disabled={busy}>Save changes</button>
              <button type="button" className="student-manager-delete" onClick={handleDelete} disabled={busy}>
                Delete student
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

type StudentFieldsProps = {
  prefix: string
  form: StudentForm
  majors: Major[]
  onChange: (form: StudentForm) => void
}

// The inputs shared by the add and edit forms.
function StudentFields({ prefix, form, majors, onChange }: StudentFieldsProps) {
  return (
    <>
      <label htmlFor={`${prefix}-first`}>First name</label>
      <input id={`${prefix}-first`} value={form.firstName} maxLength={60} autoComplete="off"
        onChange={(event) => onChange({ ...form, firstName: event.target.value })} />
      <label htmlFor={`${prefix}-last`}>Last name</label>
      <input id={`${prefix}-last`} value={form.lastName} maxLength={60} autoComplete="off"
        onChange={(event) => onChange({ ...form, lastName: event.target.value })} />
      <label htmlFor={`${prefix}-email`}>Email</label>
      <input id={`${prefix}-email`} type="email" value={form.email} maxLength={254} autoComplete="off"
        onChange={(event) => onChange({ ...form, email: event.target.value })} />
      <label htmlFor={`${prefix}-major`}>Major</label>
      <select id={`${prefix}-major`} value={form.majorId}
        onChange={(event) => onChange({ ...form, majorId: event.target.value })}>
        <option value="">Choose a major</option>
        {majors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
      </select>
      <label htmlFor={`${prefix}-year`}>Enrollment year</label>
      <input id={`${prefix}-year`} type="number" min={2000} max={2100} value={form.enrollmentYear}
        onChange={(event) => onChange({ ...form, enrollmentYear: event.target.value })} />
      <label className="student-manager-check" htmlFor={`${prefix}-active`}>
        <input id={`${prefix}-active`} type="checkbox" checked={form.isActive}
          onChange={(event) => onChange({ ...form, isActive: event.target.checked })} />
        Active student
      </label>
    </>
  )
}

export default StudentManager
