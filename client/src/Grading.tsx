import { useEffect, useId, useState, type SubmitEvent } from 'react'
import {
  createAssignment, deleteAssignment, getAssignment, getSubmission, listAssignments, listSubmissions,
  assignmentError, submissionError, updateAssignment, updateSubmission,
  type Assignment, type AssignmentDraft, type Submission
} from './gradingAPI.ts'
import { getFaculty } from './facultyAPI'
import { getCourse } from './CourseAPI'

function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function emptyAssignment(): AssignmentDraft {
  return {
    section_id: 0,
    title: '',
    instructions: '',
    due_at: '',
    max_points: 0,
    is_published: true
  }
}

async function filterAssignmentsByFaculty(assignments: Assignment[], employeeNumber: string): Promise<Assignment[]> {
  const facultyAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      const courseSection = await getCourse(assignment.section_id)
      const faculty = await getFaculty(courseSection.instructor_id)
      return { assignment, faculty }
    })
  )

  return facultyAssignments
    .filter(({ faculty }) => faculty.employee_number.toUpperCase() === employeeNumber)
    .map(({ assignment }) => assignment)
}

//Do i need this???
type AssignmentProp = {
  id?: string
  selection?: { assignmentID: number; requestKey: number }
  onChange?: () => void
}

export default function Grading({ id, selection, onChange }: AssignmentProp) {
  const labelId = useId()
  const selectedId = selection?.assignmentID
  const selectionRequest = selection?.requestKey
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [displayedAssignments, setDisplayedAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [draft, setDraft] = useState<AssignmentDraft>(emptyAssignment)
  const [assignmentLookupId, setAssignmentLookupId] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Loading Assignment records…')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [facultyID, setFacultyID] = useState('')
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setBusy(true)
    setError('')
    setSelectedAssignment(null)
    setSelectedSubmission(null)
    setDraft(emptyAssignment())
    setConfirmDelete(false)
    setMessage('Loading Assignment records…')
    async function loadForm() {
      try {
        const [assignmentRows, assignment] = await Promise.all([
          listAssignments(controller.signal),
          selectedId === undefined ? undefined : getAssignment(selectedId, controller.signal),
        ])
        if (controller.signal.aborted) return

        setAssignments(assignmentRows)
        setDisplayedAssignments(assignmentRows)

        if (assignment) {
          selectAssignment(assignment)
          setMessage(`Retrieved assignment #${assignment.id} from the database.`)
        } else {
          setMessage('Assignments and submissions loaded.')
        }

        try {
          setSubmissions(await listSubmissions(controller.signal))
        } catch {
          if (!controller.signal.aborted) {
            setMessage('Assignments loaded; submissions are currently unavailable.')
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return

        setError(assignmentError(error))
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

  function selectAssignment(assignment: Assignment) {
    setSelectedAssignment(assignment)
    // Only writable fields belong in POST/PUT bodies; IDs and timestamps are server-owned.
    setDraft({
      section_id: assignment.section_id,
      title: assignment.title,
      instructions: assignment.instructions,
      due_at: toDateTimeLocal(assignment.due_at),
      max_points: assignment.max_points,
      is_published: assignment.is_published
    })
    setConfirmDelete(false)
  }

  // Each action supplies its API call. This helper handles the shared UI steps:
  // show progress, await the action, display errors, and enable the form again.
  async function runAssignmentAction(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('Working…')
    try {
      await action()
    } catch (error) {
      setError(assignmentError(error))
      setMessage('')
    } finally {
      setBusy(false)
    }
  }

  function newAssignment() {
    setSelectedAssignment(null)
    setDraft(emptyAssignment())
    setConfirmDelete(false)
    setError('')
    setMessage('Enter a new assignment.')
  }

  async function retrieve(id: number) {
    await runAssignmentAction(async () => {
      // Clear stale details so a failed lookup cannot display the previous assignment.
      setSelectedAssignment(null)
      setDraft(emptyAssignment())
      setConfirmDelete(false)
      const assignment = await getAssignment(id)
      selectAssignment(assignment)
      setMessage(`Retrieved assignment #${assignment.id} from the database.`)
    })
  }

  async function refreshAssignmentForm() {
    if (selectedAssignment) {
      await retrieve(selectedAssignment.id)
      return
    }

    setDraft(emptyAssignment())
    setConfirmDelete(false)
    setError('')
    setMessage('Assignment form reset.')
  }

  async function handleAssignmentLookup(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const assignmentId = Number(assignmentLookupId)
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      setError('Enter a valid assignment ID.')
      return
    }
    await retrieve(assignmentId)
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAssignmentAction(async () => {
      let saved: Assignment
      if (selectedAssignment) {
        saved = await updateAssignment(selectedAssignment.id, draft)
      } else {
        saved = await createAssignment(draft)
      }
      setAssignments((current) => selectedAssignment
        ? current.map((assignment) => assignment.id === saved.id ? saved : assignment)
        : [...current, saved])
      setDisplayedAssignments((current) => selectedAssignment
        ? current.map((assignment) => assignment.id === saved.id ? saved : assignment)
        : [...current, saved])
      selectAssignment(saved)
      onChange?.()
      setMessage(`${selectedAssignment ? 'Updated' : 'Created'} assignment #${saved.id}. Retrieve by ID to read it again.`)
    })
  }

  async function remove() {
    if (!selectedAssignment) return
    const id = selectedAssignment.id
    await runAssignmentAction(async () => {
      await deleteAssignment(id)
      setAssignments((current) => current.filter((assignment) => assignment.id !== id))
      setDisplayedAssignments((current) => current.filter((assignment) => assignment.id !== id))
      onChange?.()
      setSelectedAssignment(null)
      setDraft(emptyAssignment())
      setConfirmDelete(false)
      setMessage(`Deleted assignment #${id}.`)
    })
  }

  async function restrict(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!facultyID.trim()) {
      setDisplayedAssignments(assignments)
      setInputError('Enter a faculty employee number.')
      return
    }

    try {
      setBusy(true)
      setError('')

      const employeeNumber = facultyID.trim().toUpperCase()
      const items = await filterAssignmentsByFaculty(assignments, employeeNumber)

      setDisplayedAssignments(items)
      setMessage(items.length === 0
        ? `No assignments found for faculty ${employeeNumber}.`
        : `${items.length} assignment${items.length === 1 ? '' : 's'} found for faculty ${employeeNumber}.`)
    } catch (searchError) {
      setDisplayedAssignments([])
      setError(searchError instanceof Error ? searchError.message : 'Unable to search faculty assignments.')
    } finally {
      setBusy(false)
    }
  }

  async function refreshAssignments() {
    try {
      setBusy(true)
      setError('')
      setInputError('')

      const refreshedAssignments = await listAssignments()
      setAssignments(refreshedAssignments)

      if (facultyID.trim()) {
        const employeeNumber = facultyID.trim().toUpperCase()
        const items = await filterAssignmentsByFaculty(refreshedAssignments, employeeNumber)
        setDisplayedAssignments(items)
        setMessage(items.length === 0
          ? `No assignments found for faculty ${employeeNumber}.`
          : `${items.length} assignment${items.length === 1 ? '' : 's'} found for faculty ${employeeNumber}.`)
      } else {
        setDisplayedAssignments(refreshedAssignments)
        setMessage(`${refreshedAssignments.length} assignments refreshed.`)
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh assignments.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id={id} className="dashboard-card student-records assignment-management" aria-labelledby={`${labelId}-records-heading`} tabIndex={-1}>
      <div className="records-heading-row">
        <div><h2 id={`${labelId}-records-heading`}>Assignment Management</h2><p>Create, read, update, or delete assignments. </p></div>
      </div>
      <p role="status" aria-live="polite">{message}</p>
      {error && <p role="alert" className="field-error">{error}</p>}

      <form onSubmit={restrict} noValidate>
        <label htmlFor={`${labelId}-student-name`}>Employee Number</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-student-name`}
            name="studentName"
            type="text"
            autoComplete="off"
            value={facultyID}
            onChange={(event) => {
              setFacultyID(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit" disabled={busy}>Search</button>
          <button type="button" disabled={busy} onClick={() => void refreshAssignments()}>Refresh</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Enter the starting letter as well.</p>
        {inputError && <p id={`${labelId}-input-error`} className="transcript-card-error" role="alert">{inputError}</p>}
      </form>

      <div className="assignment-table-scroll" role="region" aria-label="Assignments" tabIndex={0}>
        <table>
          <caption>{displayedAssignments.length} Assignments</caption>
          <thead>
            <tr>
              <th scope="col">Assignment ID</th>
              <th scope="col">Section ID</th>
              <th scope="col">Title</th>
              <th scope="col">Instructions</th>
              <th scope="col">Due</th>
              <th scope="col">Max Points</th>
              <th scope="col">Published</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.id}</td>
                <td>{assignment.section_id}</td>
                <td>{assignment.title}</td>
                <td>{assignment.instructions}</td>
                <td>{new Date(assignment.due_at).toLocaleString()}</td>
                <td>{assignment.max_points}</td>
                <td>{assignment.is_published ? 'Yes' : 'No'}</td>
                <td><button type="button" disabled={busy} onClick={() => void retrieve(assignment.id)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleAssignmentLookup} noValidate>
        <label htmlFor={`${labelId}-assignment-id`}>Assignment ID</label>
        <div className="transcript-card-controls">
          <input
            id={`${labelId}-assignment-id`}
            name="assignmentId"
            type="number"
            min="1"
            step="1"
            required
            value={assignmentLookupId}
            onChange={(event) => setAssignmentLookupId(event.target.value)}
          />
          <button type="submit" disabled={busy}>Load assignment</button>
        </div>
      </form>
      <h3>{selectedAssignment ? `Edit assignment #${selectedAssignment.id}` : 'New assignment'}</h3>
      {selectedAssignment && <dl className="records-saved" aria-label="Saved assignment details">
        <div><dt>Saved id</dt><dd>{selectedAssignment.id}</dd></div>
        <div><dt>Saved section_id</dt><dd>{selectedAssignment.section_id}</dd></div>
        <div><dt>Saved title</dt><dd>{selectedAssignment.title}</dd></div>
        <div><dt>Saved instructions</dt><dd>{selectedAssignment.instructions}</dd></div>
        <div><dt>Saved Due Date</dt><dd>{new Date(selectedAssignment.due_at).toLocaleString()}</dd></div>
        <div><dt>Saved Maximum Points</dt><dd>{selectedAssignment.max_points }</dd></div>
        <div><dt>Saved Published State</dt><dd>{selectedAssignment.is_published ? 'True' : 'False'}</dd></div>
      </dl>}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Assignment information</legend>
          <div className="records-fields">
            <label htmlFor={`${labelId}-record-number`}>Section ID<input id={`${labelId}-record-number`} type="number" required min="1" value={draft.section_id || ''}
              onChange={(event) => setDraft({ ...draft, section_id: Number(event.target.value) })} /></label>

            <label htmlFor={`${labelId}-record-first`}>Title<input id={`${labelId}-record-first`} required maxLength={60} value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>

              <label htmlFor={`${labelId}-record-first`}>Instructions<input id={`${labelId}-record-first`} required maxLength={60} value={draft.instructions}
              onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} /></label>

            <label htmlFor={`${labelId}-record-last`}>Due Date<input id={`${labelId}-record-last`} type="datetime-local" required value={draft.due_at}
              onChange={(event) => setDraft({ ...draft, due_at: event.target.value })} /></label>

            <label htmlFor={`${labelId}-record-email`}>Maximum Points<input id={`${labelId}-record-email`} type="number" required min="0" value={draft.max_points || ''}
              onChange={(event) => setDraft({ ...draft, max_points: Number(event.target.value) })} /></label>

            <label className="records-checkbox" htmlFor={`${labelId}-record-active`}><input id={`${labelId}-record-active`} type="checkbox" checked={draft.is_published}
              onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} />Active Assignment</label>
          </div>
          <div className="records-actions">
            <button type="submit">{selectedAssignment ? 'Save changes' : 'Create Assignment'}</button>
            <button type="button" disabled={busy} onClick={() => void refreshAssignmentForm()}>
              {selectedAssignment ? 'Refresh form' : 'Reset form'}
            </button>
            {selectedAssignment && <button type="button" onClick={newAssignment}>New assignment</button>}
            {selectedAssignment && !confirmDelete && <button type="button" className="records-delete" onClick={() => setConfirmDelete(true)}>Delete record</button>}
          </div>
          {confirmDelete && selectedAssignment && <div className="records-confirm">
            <p>Delete assignment #{selectedAssignment.id}, {selectedAssignment.title}? This permanently removes the assignment.</p>
            <div className="records-actions"><button type="button" className="records-delete" onClick={remove}>Confirm delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)}>Cancel delete</button></div>
          </div>}
        </fieldset>
      </form>
    </section>
  )
}