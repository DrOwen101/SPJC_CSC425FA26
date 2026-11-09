import { useCallback, useEffect, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import './StudentRecordCreate.css'

type CourseRecord = {
  recordId: string
  studentID: string
  firstName: string
  lastName: string
  term: string
  courseCode: string
  grade: string
  creditHours: number
}

type CourseForm = {
  studentID: string
  term: string
  courseCode: string
  grade: string
  creditHours: number
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

const emptyForm: CourseForm = {
  studentID: '',
  term: 'Fall 2026',
  courseCode: '',
  grade: 'B',
  creditHours: 3,
}

function StudentRecordCreate() {
  const [records, setRecords] = useState<CourseRecord[]>([])
  const [newForm, setNewForm] = useState(emptyForm)
  const [editingRecord, setEditingRecord] = useState<CourseRecord | null>(null)
  const [editForm, setEditForm] = useState<CourseForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.get<{ records: CourseRecord[] }>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/student-records`,
      )
      setRecords(response.data.records)
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message || 'Could not load course records.')
      } else {
        setErrorMessage('An unexpected error occurred while loading course records.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  async function createRecord(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await axios.post<{ record: CourseRecord }>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/student-records`,
        newForm,
      )
      setSuccessMessage(`Saved record #${response.data.record.recordId}.`)
      setNewForm(emptyForm)
      await loadRecords()
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message || 'Could not save this course record.')
      } else {
        setErrorMessage('An unexpected error occurred while saving the record.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing(record: CourseRecord) {
    setEditingRecord(record)
    setEditForm({
      studentID: record.studentID,
      term: record.term,
      courseCode: record.courseCode,
      grade: record.grade,
      creditHours: record.creditHours,
    })
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function saveChanges(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingRecord || !editForm) return

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await axios.put(
        `${apiBaseUrl.replace(/\/$/, '')}/api/student-records/${editingRecord.recordId}`,
        {
          term: editForm.term,
          courseCode: editForm.courseCode,
          grade: editForm.grade,
          creditHours: editForm.creditHours,
        },
      )
      setSuccessMessage(`Saved changes to record #${editingRecord.recordId}.`)
      setEditingRecord(null)
      setEditForm(null)
      await loadRecords()
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message || 'Could not update this course record.')
      } else {
        setErrorMessage('An unexpected error occurred while updating the record.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteRecord(record: CourseRecord) {
    if (!window.confirm(`Delete ${record.courseCode} for ${record.firstName} ${record.lastName}?`)) {
      return
    }

    setDeletingRecordId(record.recordId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await axios.delete(`${apiBaseUrl.replace(/\/$/, '')}/api/student-records/${record.recordId}`)
      setSuccessMessage(`Deleted record #${record.recordId}.`)
      if (editingRecord?.recordId === record.recordId) {
        setEditingRecord(null)
        setEditForm(null)
      }
      await loadRecords()
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(error.response?.data?.message || 'Could not delete this course record.')
      } else {
        setErrorMessage('An unexpected error occurred while deleting the record.')
      }
    } finally {
      setDeletingRecordId(null)
    }
  }

  return (
    <section id="create-student-record" className="dashboard-card student-record-create" aria-labelledby="create-record-heading" tabIndex={-1}>
      <h2 id="create-record-heading">Course records</h2>
      <p>Add a course record or edit an existing one.</p>

      <h3>Saved records</h3>
      {isLoading ? (
        <p role="status">Loading course records…</p>
      ) : records.length === 0 ? (
        <p>No course records found.</p>
      ) : (
        <div className="student-record-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Term</th>
                <th scope="col">Course</th>
                <th scope="col">Grade</th>
                <th scope="col">Credits</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.recordId}>
                  <td>{record.firstName} {record.lastName} ({record.studentID})</td>
                  <td>{record.term}</td>
                  <td>{record.courseCode}</td>
                  <td>{record.grade}</td>
                  <td>{record.creditHours}</td>
                  <td>
                    <button type="button" onClick={() => startEditing(record)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRecord(record)}
                      disabled={deletingRecordId === record.recordId}
                    >
                      {deletingRecordId === record.recordId ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button type="button" onClick={() => void loadRecords()} disabled={isLoading}>
        Refresh records
      </button>

      {editingRecord && editForm && (
        <form className="student-record-form" onSubmit={saveChanges}>
          <h3>Edit record #{editingRecord.recordId}</h3>
          <p>{editingRecord.firstName} {editingRecord.lastName} ({editingRecord.studentID})</p>
          <div>
            <label htmlFor="edit-record-term">Term</label>
            <input
              id="edit-record-term"
              value={editForm.term}
              onChange={(event) => setEditForm({ ...editForm, term: event.target.value })}
              maxLength={20}
              required
            />
          </div>
          <div>
            <label htmlFor="edit-record-course">Course code</label>
            <input
              id="edit-record-course"
              value={editForm.courseCode}
              onChange={(event) => setEditForm({ ...editForm, courseCode: event.target.value })}
              maxLength={12}
              required
            />
          </div>
          <div>
            <label htmlFor="edit-record-grade">Grade</label>
            <select
              id="edit-record-grade"
              value={editForm.grade}
              onChange={(event) => setEditForm({ ...editForm, grade: event.target.value })}
            >
              {grades.map((grade) => <option key={grade}>{grade}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-record-credits">Credit hours</label>
            <input
              id="edit-record-credits"
              type="number"
              min={1}
              max={6}
              step={1}
              value={editForm.creditHours}
              onChange={(event) => setEditForm({ ...editForm, creditHours: event.target.valueAsNumber })}
              required
            />
          </div>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => { setEditingRecord(null); setEditForm(null) }}>
            Cancel
          </button>
        </form>
      )}

      <h3>Add a course record</h3>
      <form className="student-record-form" onSubmit={createRecord}>
        <div>
          <label htmlFor="record-student-id">Student ID</label>
          <input
            id="record-student-id"
            value={newForm.studentID}
            onChange={(event) => setNewForm({ ...newForm, studentID: event.target.value })}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="9101"
            required
          />
        </div>
        <div>
          <label htmlFor="record-term">Term</label>
          <input
            id="record-term"
            value={newForm.term}
            onChange={(event) => setNewForm({ ...newForm, term: event.target.value })}
            maxLength={20}
            required
          />
        </div>
        <div>
          <label htmlFor="record-course-code">Course code</label>
          <input
            id="record-course-code"
            value={newForm.courseCode}
            onChange={(event) => setNewForm({ ...newForm, courseCode: event.target.value })}
            maxLength={12}
            placeholder="CSC425"
            required
          />
        </div>
        <div>
          <label htmlFor="record-grade">Grade</label>
          <select
            id="record-grade"
            value={newForm.grade}
            onChange={(event) => setNewForm({ ...newForm, grade: event.target.value })}
          >
            {grades.map((grade) => <option key={grade}>{grade}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="record-credit-hours">Credit hours</label>
          <input
            id="record-credit-hours"
            type="number"
            min={1}
            max={6}
            step={1}
            value={newForm.creditHours}
            onChange={(event) => setNewForm({ ...newForm, creditHours: event.target.valueAsNumber })}
            required
          />
        </div>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Add record'}
        </button>
      </form>

      {errorMessage && <p className="field-error" role="alert">{errorMessage}</p>}
      {successMessage && <p role="status">{successMessage}</p>}
    </section>
  )
}

export default StudentRecordCreate
