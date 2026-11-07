
import { useEffect, useState, type SubmitEvent } from 'react'
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  type StudentRecord,
  type StudentInput,
} from './studentRecordApi'

// Default values for a new student
const emptyForm: StudentInput = {
  first_name: '',
  last_name: '',
  email: '',
  major_id: 1,
  enrollment_year: new Date().getFullYear(),
  is_active: true,
}

// Majors from the PostgreSQL sample data
const majors = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Information Systems' },
  { id: 3, name: 'Mathematics' },
  { id: 4, name: 'English' },
  { id: 5, name: 'History' },
  { id: 6, name: 'Biology' },
  { id: 7, name: 'Chemistry' },
  { id: 8, name: 'Physics' },
  { id: 9, name: 'Psychology' },
  { id: 10, name: 'Sociology' },
]

function StudentRecords() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [form, setForm] = useState<StudentInput>({ ...emptyForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
  const [lookupId, setLookupId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Load student records when the component opens
  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      setError('')
      const data = await getStudents()
      setStudents(data)

      setSelectedStudent((current) =>
        current ? data.find((student) => student.id === current.id) ?? null : null
      )
    } catch {
      setError('Unable to load student records.')
    } finally {
      setLoading(false)
    }
  }

  // Refresh the student list from PostgreSQL
  async function handleRefresh() {
    setMessage('')
    await loadStudents()
  }

  function resetForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  // Retrieve a single student using their database ID
  async function handleLookup(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    const id = Number(lookupId)

    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Enter a valid student ID.')
      return
    }

    try {
      const student = await getStudent(id)
      setSelectedStudent(student)
      setMessage(`Retrieved student #${id} from PostgreSQL.`)
    } catch {
      setSelectedStudent(null)
      setError(`Student #${id} was not found.`)
    }
  }

  // Display a student's information without editing
  async function handleView(id: number) {
    setError('')
    setMessage('')

    try {
      const student = await getStudent(id)
      setSelectedStudent(student)
      setLookupId(String(id))
      setMessage(`Retrieved student #${id} from PostgreSQL.`)
    } catch {
      setSelectedStudent(null)
      setError(`Unable to retrieve student #${id}.`)
    }
  }

  // Populate the form with a student's saved information
  function startEditing(student: StudentRecord) {
    setEditingId(student.id)
    setSelectedStudent(student)
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      major_id: student.major_id,
      enrollment_year: student.enrollment_year,
      is_active: student.is_active,
    })

    setError('')
    setMessage('')
  }

  // Create a new student or update an existing student
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (editingId === null) {
        const created = await createStudent(form)
        setSelectedStudent(created)
        setMessage(`Student #${created.id} created successfully.`)
      } else {
        const updated = await updateStudent(editingId, form)
        setSelectedStudent(updated)
        setMessage(`Student #${editingId} updated successfully.`)
      }

      resetForm()
      await loadStudents()
    } catch {
      setError('Unable to save student. Check the fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  // Permanently remove a student from PostgreSQL
  async function handleDelete(id: number) {
    setError('')
    setMessage('')

    if (!window.confirm(`Permanently delete student #${id}?`)) {
      return
    }

    try {
      await deleteStudent(id)

      if (editingId === id) {
        resetForm()
      }

      if (selectedStudent?.id === id) {
        setSelectedStudent(null)
      }

      setMessage(`Student #${id} deleted successfully.`)
      await loadStudents()
    } catch {
      setError(
        'Unable to delete student. Students with existing enrollments cannot be deleted.'
      )
    }
  }

  return (
    <section
      id="student-records"
      className="dashboard-card student-records"
      aria-labelledby="student-records-heading"
      tabIndex={-1}
    >
      <div className="student-records-header">
        <div>
          <h2 id="student-records-heading">Student Records</h2>
          <p>Create, view, update, and delete student records in PostgreSQL.</p>
        </div>

        <button
          type="button"
          className="student-records-save"
          onClick={handleRefresh}
          disabled={loading || saving}
        >
          Refresh List
        </button>
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="student-records-message" role="status">
          {message}
        </p>
      )}

      <form className="student-records-lookup" onSubmit={handleLookup}>
        <label htmlFor="student-lookup-id">Student ID</label>
        <input
          id="student-lookup-id"
          type="number"
          min="1"
          step="1"
          value={lookupId}
          onChange={(event) => setLookupId(event.target.value)}
          required
        />
        <button type="submit" className="student-records-save">
          Retrieve by ID
        </button>
      </form>

      <div className="student-records-section-heading">
        <h3>Current Students</h3>
        <span className="student-records-count">
          {students.length} Students
        </span>
      </div>

      {loading ? (
        <p>Loading student records...</p>
      ) : students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <div className="student-records-table-wrapper">
          <table className="student-records-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Student</th>
                <th scope="col">Major</th>
                <th scope="col">Year</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>

                  <td>
                    <strong>
                      {student.first_name} {student.last_name}
                    </strong>
                    <span className="student-records-email">
                      {student.email}
                    </span>
                  </td>

                  <td>
                    {student.major ?? `Major ID: ${student.major_id}`}
                  </td>

                  <td>{student.enrollment_year}</td>

                  <td>
                    <span
                      className={
                        student.is_active
                          ? 'student-records-status active'
                          : 'student-records-status inactive'
                      }
                    >
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td>
                    <div className="student-records-actions">
                      <button
                        type="button"
                        className="student-records-edit"
                        onClick={() => handleView(student.id)}
                        disabled={saving}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="student-records-edit"
                        onClick={() => startEditing(student)}
                        disabled={saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="student-records-delete"
                        onClick={() => handleDelete(student.id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="student-records-details">
          <h3>Saved Student #{selectedStudent.id}</h3>

          <dl className="student-records-details-grid">
            <div>
              <dt>Name</dt>
              <dd>
                {selectedStudent.first_name} {selectedStudent.last_name}
              </dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{selectedStudent.email}</dd>
            </div>

            <div>
              <dt>Major</dt>
              <dd>
                {selectedStudent.major ??
                  majors.find((major) => major.id === selectedStudent.major_id)?.name ??
                  `Major ID: ${selectedStudent.major_id}`}
              </dd>
            </div>

            <div>
              <dt>Enrollment Year</dt>
              <dd>{selectedStudent.enrollment_year}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>{selectedStudent.is_active ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="student-records-form-section">
        <h3>
          {editingId === null
            ? 'Add Student'
            : `Edit Student #${editingId}`}
        </h3>

        <p>
          {editingId === null
            ? 'Enter the information below to add a student.'
            : 'Update the selected student and save the changes.'}
        </p>

        <form className="student-records-form" onSubmit={handleSubmit}>
          <div className="student-records-field">
            <label htmlFor="student-first-name">First Name</label>
            <input
              id="student-first-name"
              type="text"
              value={form.first_name}
              onChange={(event) =>
                setForm({ ...form, first_name: event.target.value })
              }
              required
            />
          </div>

          <div className="student-records-field">
            <label htmlFor="student-last-name">Last Name</label>
            <input
              id="student-last-name"
              type="text"
              value={form.last_name}
              onChange={(event) =>
                setForm({ ...form, last_name: event.target.value })
              }
              required
            />
          </div>

          <div className="student-records-field">
            <label htmlFor="student-email">Email</label>
            <input
              id="student-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
            />
          </div>

          <div className="student-records-field">
            <label htmlFor="student-major">Major</label>
            <select
              id="student-major"
              value={form.major_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  major_id: Number(event.target.value),
                })
              }
            >
              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </select>
          </div>

          <div className="student-records-field">
            <label htmlFor="student-year">Enrollment Year</label>
            <input
              id="student-year"
              type="number"
              min="2000"
              max="2100"
              value={form.enrollment_year}
              onChange={(event) =>
                setForm({
                  ...form,
                  enrollment_year: Number(event.target.value),
                })
              }
              required
            />
          </div>

          <div className="student-records-field student-records-status-field">
            <label className="student-records-checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm({
                    ...form,
                    is_active: event.target.checked,
                  })
                }
              />
              <span>Active Student</span>
            </label>
            <span className="student-records-status-help">
              Uncheck to mark the student as inactive.
            </span>
          </div>

          <div className="student-records-form-actions">
            <button
              type="submit"
              className="student-records-save"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId === null
                  ? 'Add Student'
                  : 'Save Changes'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="student-records-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default StudentRecords
