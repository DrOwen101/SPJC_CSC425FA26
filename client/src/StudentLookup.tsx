import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isStudentRecord, isStudentsResponse, normalizeName, type Student } from './studentLookupApi'
import './StudentLookup.css'

// This is the same Express API used by the Lab 6 transcript example.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

// This component owns the lookup's state, API request, and displayed result.
// Import it into a dashboard and render <StudentLookup /> to show the feature.
function StudentLookup() {
  // The editable input and submitted name are separate: typing a new name
  // must not relabel an existing result or start a request automatically.
  const [searchName, setSearchName] = useState('')
  const [requestedStudent, setRequestedStudent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // null means there is no record to display. setStudent updates React state
  // and causes the component to render again with the selected student.
  const [student, setStudent] = useState<Student | null>(null)
  const [createDraft, setCreateDraft] = useState<Student>({
    studentID: '',
    firstName: '',
    lastName: '',
    major: '',
    institution: '',
  })
  const [isCreatingRecord, setIsCreatingRecord] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [inputError, setInputError] = useState('')
  const [notice, setNotice] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMutating = isCreating || isUpdating || isDeleting

  // A ref keeps the active controller between renders without updating the UI.
  // Every submission (even an invalid one) cancels the previous request.
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => activeRequest.current?.abort()
  }, [])

  async function searchStudents(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // The form supports Enter without reloading the page.
    activeRequest.current?.abort()
    const name = searchName.trim()

    // Clear ALL previous outcomes immediately, including after a blank search.
    setRequestedStudent(name)
    setStudent(null)
    setIsCreatingRecord(false)
    setLookupError('')
    setInputError('')
    setNotice('')
    setIsLoading(false)
    if (!name) {
      setInputError('Enter a student’s full name before searching.')
      return // Blank input never sends a request or displays the collection.
    }

    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)

    try {
      // GET /api/students?name=... returns { students: [...] }, not a single student.
      // Keep the request here so this component's input-to-result flow is visible.
      // A timeout also allows the user to retry if the server stops responding.
      const response = await axios.get<unknown>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/students`,
        { params: { name }, signal: controller.signal, timeout: 15000 },
      )
      if (controller.signal.aborted) return

      // TypeScript cannot guarantee the shape of JSON received over the network.
      // Check it before accessing fields or rendering any student information.
      if (!isStudentsResponse(response.data)) {
        throw new Error('The student service returned unexpected data. Please try again.')
      }

      // Use both returned name fields and compare the whole normalized name.
      // filter (rather than find) lets us detect ambiguous duplicate names.
      const requestedName = normalizeName(name)
      const matches = response.data.students.filter((candidate) =>
        normalizeName(`${candidate.firstName} ${candidate.lastName}`) === requestedName,
      )
      if (matches.length === 0) {
        setLookupError(`Student not found: “${name}”. Check the full name and try again.`)
      } else if (matches.length > 1) {
        setLookupError(`More than one student matches “${name}”. Please clarify which student you mean with your instructor before continuing.`)
      } else {
        setStudent(matches[0]) // Store only the one matching record for rendering.
      }
    } catch (error) {
      // Cancellation is expected on another search or navigation. An old error
      // must not replace the outcome of the newer request either.
      if (controller.signal.aborted) return
      let message = 'Unable to load student data. Please try again.'
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          message = 'The student request timed out. Please try again.'
        } else if (error.response) {
          message = `The student request failed (HTTP ${error.response.status}). Please try again.`
        } else {
          message = 'Unable to reach the student API. Check that the server is running and try again.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      setLookupError(message)
    } finally {
      // An earlier request must not turn off a later request's loading indicator.
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  function openCreateForm() {
    activeRequest.current?.abort()
    setIsLoading(false)
    setCreateDraft({ studentID: '', firstName: '', lastName: '', major: '', institution: '' })
    setStudent(null)
    setIsCreatingRecord(true)
    setLookupError('')
    setInputError('')
    setNotice('')
  }

  async function createStudent(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isMutating) return

    const studentID = createDraft.studentID.trim()
    const firstName = createDraft.firstName.trim()
    const lastName = createDraft.lastName.trim()
    const numericStudentID = Number(studentID)
    if (
      !/^[1-9]\d*$/.test(studentID) || !Number.isSafeInteger(numericStudentID)
      || numericStudentID > 2147483647 || !firstName || !lastName
    ) {
      setLookupError('Enter a valid student ID (1–2147483647), first name, and last name.')
      return
    }

    setLookupError('')
    setNotice('')
    setIsCreating(true)
    try {
      const response = await axios.post<unknown>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/db/students`,
        {
          studentID: numericStudentID,
          firstName,
          lastName,
          major: createDraft.major.trim() || null,
          institution: createDraft.institution.trim() || null,
        },
        { timeout: 15000 },
      )
      if (!isStudentRecord(response.data)) {
        throw new Error('The student service returned unexpected data. Please try again.')
      }

      setStudent(response.data)
      setIsCreatingRecord(false)
      const createdName = `${response.data.firstName} ${response.data.lastName}`
      setSearchName(createdName)
      setRequestedStudent(createdName)
      setNotice('Student record created.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setLookupError('That student ID already exists. Enter a different ID.')
        } else {
          setLookupError(`Unable to create the student record${error.response ? ` (HTTP ${error.response.status})` : ''}. Please try again.`)
        }
      } else if (error instanceof Error) {
        setLookupError(error.message)
      } else {
        setLookupError('Unable to create the student record. Please try again.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function updateStudent(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!student || isMutating) return

    const firstName = student.firstName.trim()
    const lastName = student.lastName.trim()
    if (!firstName || !lastName) {
      setLookupError('First name and last name are required.')
      return
    }

    setLookupError('')
    setNotice('')
    setIsUpdating(true)
    try {
      const response = await axios.put<unknown>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/db/students/${encodeURIComponent(student.studentID)}`,
        {
          firstName,
          lastName,
          major: student.major.trim() || null,
          institution: student.institution.trim() || null,
        },
        { timeout: 15000 },
      )
      if (!isStudentRecord(response.data)) {
        throw new Error('The student service returned unexpected data. Please try again.')
      }

      setStudent(response.data)
      const updatedName = `${response.data.firstName} ${response.data.lastName}`
      setSearchName(updatedName)
      setRequestedStudent(updatedName)
      setNotice('Student record updated.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setLookupError(error.response?.status === 404
          ? 'This student record no longer exists. Search again to refresh the result.'
          : `Unable to update the student record${error.response ? ` (HTTP ${error.response.status})` : ''}. Please try again.`)
      } else if (error instanceof Error) {
        setLookupError(error.message)
      } else {
        setLookupError('Unable to update the student record. Please try again.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteStudent() {
    if (!student || isMutating) return
    if (!window.confirm(`Delete the student record for ${student.firstName} ${student.lastName}? This cannot be undone.`)) {
      return
    }

    const deletedName = `${student.firstName} ${student.lastName}`
    setLookupError('')
    setNotice('')
    setIsDeleting(true)
    try {
      await axios.delete(
        `${apiBaseUrl.replace(/\/$/, '')}/api/db/students/${encodeURIComponent(student.studentID)}`,
        { timeout: 15000 },
      )
      setStudent(null)
      setNotice(`Deleted the student record for ${deletedName}.`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          setLookupError('This student record no longer exists. Search again to refresh the result.')
        } else if (error.response?.status === 409) {
          setLookupError('This student has enrollment records and cannot be deleted until those enrollments are removed.')
        } else {
          setLookupError(`Unable to delete the student record${error.response ? ` (HTTP ${error.response.status})` : ''}. Please try again.`)
        }
      } else {
        setLookupError('Unable to delete the student record. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Derive the status from existing state so there is no extra state to keep
  // synchronized. The submitted name stays separate from the editable input.
  let statusMessage = ''
  if (notice) {
    statusMessage = notice
  } else if (isLoading) {
    statusMessage = `Loading student data for ${requestedStudent}…`
  } else if (student) {
    statusMessage = `Showing the result for ${requestedStudent}.`
  } else if (!requestedStudent) {
    statusMessage = ''
  }

  return (
    <section id="student-lookup" className="dashboard-card student-lookup" aria-labelledby="lookup-heading" tabIndex={-1}>
      <h2 id="lookup-heading">Student lookup</h2>
      <form onSubmit={searchStudents} noValidate>
        <label htmlFor="student-name">Student full name</label>
        <div className="student-lookup-controls">
          <input
            id="student-name"
            name="studentName"
            type="text"
            autoComplete="off"
            value={searchName}
            disabled={isMutating}
            onChange={(event) => {
              setSearchName(event.target.value)
              setInputError('')
              setNotice('')
            }}
            aria-describedby={inputError ? 'lookup-help lookup-input-error' : 'lookup-help'}
            aria-invalid={inputError ? true : undefined}
          />
          {/* Remain usable while loading: a new search cancels the old one. */}
          <button type="submit" disabled={isMutating}>Search</button>
        </div>
        <button
          type="button"
          className="student-lookup-create-toggle"
          onClick={openCreateForm}
          disabled={isMutating}
        >
          Create New Record
        </button>
      </form>
      {inputError && <p id="lookup-input-error" className="field-error" role="alert">{inputError}</p>}
      {/* The live region announces changes without moving keyboard focus. */}
      <p role="status">{statusMessage}</p>
      {lookupError && <p className="field-error" role="alert">{lookupError}</p>}
      {isCreatingRecord && (
        <form className="student-lookup-edit" onSubmit={createStudent}>
          <h3>Create new student record</h3>
          <div className="student-lookup-fields">
            <label>
              Student ID
              <input
                name="studentID"
                type="number"
                min="1"
                step="1"
                value={createDraft.studentID}
                required
                disabled={isMutating}
                onChange={(event) => setCreateDraft({ ...createDraft, studentID: event.target.value })}
              />
            </label>
            <label>
              First name
              <input
                name="firstName"
                value={createDraft.firstName}
                maxLength={50}
                required
                disabled={isMutating}
                onChange={(event) => setCreateDraft({ ...createDraft, firstName: event.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                name="lastName"
                value={createDraft.lastName}
                maxLength={50}
                required
                disabled={isMutating}
                onChange={(event) => setCreateDraft({ ...createDraft, lastName: event.target.value })}
              />
            </label>
            <label>
              Major
              <input
                name="major"
                value={createDraft.major}
                maxLength={50}
                disabled={isMutating}
                onChange={(event) => setCreateDraft({ ...createDraft, major: event.target.value })}
              />
            </label>
            <label>
              Institution
              <input
                name="institution"
                value={createDraft.institution}
                maxLength={50}
                disabled={isMutating}
                onChange={(event) => setCreateDraft({ ...createDraft, institution: event.target.value })}
              />
            </label>
          </div>
          <div className="student-lookup-actions">
            <button type="submit" disabled={isMutating}>
              {isCreating ? 'Creating…' : 'Create record'}
            </button>
            <button type="button" className="student-lookup-cancel" onClick={() => setIsCreatingRecord(false)} disabled={isMutating}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {!isCreatingRecord && student && (
        <form className="student-lookup-edit" onSubmit={updateStudent}>
          <h3>Edit student record</h3>
          <div className="student-lookup-fields">
            <label>
              Student ID
              <input name="studentID" value={student.studentID} readOnly />
            </label>
            <label>
              First name
              <input
                name="firstName"
                value={student.firstName}
                maxLength={50}
                required
                disabled={isMutating}
                onChange={(event) => setStudent({ ...student, firstName: event.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                name="lastName"
                value={student.lastName}
                maxLength={50}
                required
                disabled={isMutating}
                onChange={(event) => setStudent({ ...student, lastName: event.target.value })}
              />
            </label>
            <label>
              Major
              <input
                name="major"
                value={student.major}
                maxLength={50}
                disabled={isMutating}
                onChange={(event) => setStudent({ ...student, major: event.target.value })}
              />
            </label>
            <label>
              Institution
              <input
                name="institution"
                value={student.institution}
                maxLength={50}
                disabled={isMutating}
                onChange={(event) => setStudent({ ...student, institution: event.target.value })}
              />
            </label>
          </div>
          <div className="student-lookup-actions">
            <button type="submit" disabled={isMutating}>
              {isUpdating ? 'Updating…' : 'Update record'}
            </button>
            <button type="button" className="student-lookup-delete" onClick={deleteStudent} disabled={isMutating}>
              {isDeleting ? 'Deleting…' : 'Delete record'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default StudentLookup
