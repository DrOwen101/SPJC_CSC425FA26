
import { useEffect, useState } from 'react'
import axios from 'axios'
import './StudentManagementCard.css'

type Student = {
  id: string
  firstName: string
  lastName: string
  major: string
}

type StudentForm = Student

const API_URL = 'http://localhost:3000/api/students'

const emptyForm: StudentForm = {
  id: '',
  firstName: '',
  lastName: '',
  major: ''
}

export default function StudentManagementCard() {
  const [students, setStudents] = useState<Student[]>([])
  const [form, setForm] = useState<StudentForm>({ ...emptyForm })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // READ: Retrieve students from PostgreSQL
  async function fetchStudents() {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(API_URL)
      const records = response.data.students

      if (!Array.isArray(records)) {
        throw new Error('Invalid student response from server')
      }

      setStudents(records)
    } catch (err) {
      console.error('Failed to retrieve students:', err)
      setError('Unable to retrieve student records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStudents()
  }, [])

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value
    }))
  }

  function resetForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  // CREATE or UPDATE
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')
    setMessage('')

    const data = {
      id: form.id.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      major: form.major.trim()
    }

    if (!/^\d{4}$/.test(data.id)) {
      setError('Student ID must contain exactly four digits.')
      return
    }

    if (!data.firstName || !data.lastName || !data.major) {
      setError('Please complete all fields.')
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        // UPDATE
        await axios.put(`${API_URL}/${editingId}`, {
          firstName: data.firstName,
          lastName: data.lastName,
          major: data.major
        })

        setMessage('Student updated successfully.')
      } else {
        // CREATE
        await axios.post(API_URL, data)
        setMessage('Student created successfully.')
      }

      resetForm()

      // Fresh GET request confirms the database change.
      await fetchStudents()
    } catch (err) {
      console.error('Failed to save student:', err)

      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('A student with that ID already exists.')
      } else if (
        axios.isAxiosError(err) &&
        err.response?.status === 404
      ) {
        setError('The student no longer exists.')
      } else {
        setError('Unable to save student.')
      }
    } finally {
      setSaving(false)
    }
  }

  function startEditing(student: Student) {
    setEditingId(student.id)
    setForm({ ...student })
    setError('')
    setMessage('')
  }

  // DELETE
  async function deleteStudent(student: Student) {
    const confirmed = window.confirm(
      `Delete ${student.firstName} ${student.lastName} (${student.id})? This will also delete their enrollments.`
    )

    if (!confirmed) return

    setDeletingId(student.id)
    setError('')
    setMessage('')

    try {
      await axios.delete(`${API_URL}/${student.id}`)

      if (editingId === student.id) {
        resetForm()
      }

      setMessage('Student deleted successfully.')

      // Fresh GET request verifies deletion.
      await fetchStudents()
    } catch (err) {
      console.error('Failed to delete student:', err)
      setError('Unable to delete student.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="student-management-card">
      <div className="student-management-header">
        <div>
          <h2>Student Management</h2>
          <p>Manage student records stored in PostgreSQL.</p>
        </div>

        <button
          type="button"
          className="student-refresh-button"
          onClick={() => void fetchStudents()}
          disabled={loading || saving || deletingId !== null}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="student-alert student-alert-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="student-alert student-alert-success" role="status">
          {message}
        </p>
      )}

      <form
        className="student-management-form"
        onSubmit={handleSubmit}
      >
        <h3>{editingId ? 'Edit Student' : 'Add New Student'}</h3>

        <div className="student-form-grid">
          <label>
            Student ID
            <input
              type="text"
              name="id"
              value={form.id}
              onChange={handleChange}
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="1006"
              disabled={editingId !== null}
              required
            />
          </label>

          <label>
            First Name
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              maxLength={50}
              placeholder="Alex"
              required
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              maxLength={50}
              placeholder="Johnson"
              required
            />
          </label>

          <label>
            Major
            <input
              type="text"
              name="major"
              value={form.major}
              onChange={handleChange}
              maxLength={100}
              placeholder="Computer Science"
              required
            />
          </label>
        </div>

        <div className="student-form-actions">
          <button
            type="submit"
            className="student-save-button"
            disabled={saving || deletingId !== null}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Student'
                : 'Add Student'}
          </button>

          {editingId && (
            <button
              type="button"
              className="student-cancel-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="student-records-header">
        <h3>Student Records</h3>
        <span>{students.length} students</span>
      </div>

      <div className="student-table-container">
        <table className="student-management-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Major</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.major}</td>
                <td>
                  <div className="student-table-actions">
                    <button
                      type="button"
                      className="student-edit-button"
                      onClick={() => startEditing(student)}
                      disabled={saving || deletingId !== null}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="student-delete-button"
                      onClick={() => void deleteStudent(student)}
                      disabled={saving || deletingId !== null}
                    >
                      {deletingId === student.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={4} className="student-empty-state">
                  No student records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

