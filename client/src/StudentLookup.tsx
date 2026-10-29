import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isStudentsResponse, normalizeName, type Student } from './studentLookupApi'

// Use the same development proxy and deployed API setting as Student Records.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

// This component owns the lookup's state, API request, and displayed result.
// Import it into a dashboard and render <StudentLookup /> to show the feature.
function StudentLookup({ id }: { id?: string }) {
  const labelId = useId()
  // The editable input and submitted name are separate: typing a new name
  // must not relabel an existing result or start a request automatically.
  const [searchName, setSearchName] = useState('')
  const [requestedStudent, setRequestedStudent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // null means there is no record to display. setStudent updates React state
  // and causes the component to render again with the selected student.
  const [student, setStudent] = useState<Student | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [inputError, setInputError] = useState('')

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
    setLookupError('')
    setInputError('')
    setIsLoading(false)
    if (!name) {
      setInputError('Enter a student’s full name before searching.')
      return // Blank input never sends a request or displays the collection.
    }

    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)

    try {
      // GET /api/students returns { students: [...] }, not a single student.
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

  // Derive the status from existing state so there is no extra state to keep
  // synchronized. The submitted name stays separate from the editable input.
  let statusMessage = ''
  if (isLoading) {
    statusMessage = `Loading student data for ${requestedStudent}…`
  } else if (student) {
    statusMessage = `Showing the result for ${requestedStudent}.`
  } else if (!requestedStudent) {
    statusMessage = 'No student requested yet.'
  }

  return (
    <section id={id} className="dashboard-card student-lookup" aria-labelledby={`${labelId}-lookup-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-lookup-heading`}>Student lookup</h2>
      <p id={`${labelId}-lookup-help`}>Enter a student’s full name to search the saved student records.</p>
      <form onSubmit={searchStudents} noValidate>
        <label htmlFor={`${labelId}-student-name`}>Student full name</label>
        <div className="student-lookup-controls">
          <input
            id={`${labelId}-student-name`}
            name="studentName"
            type="text"
            autoComplete="off"
            value={searchName}
            onChange={(event) => {
              setSearchName(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-lookup-help${inputError ? ` ${labelId}-lookup-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          {/* Remain usable while loading: a new search cancels the old one. */}
          <button type="submit">Search</button>
        </div>
      </form>
      {inputError && <p id={`${labelId}-lookup-input-error`} className="field-error" role="alert">{inputError}</p>}
      {/* The live region announces changes without moving keyboard focus. */}
      <p role="status">{statusMessage}</p>
      {lookupError && <p className="field-error" role="alert">{lookupError}</p>}
      {/* Render labeled values, never the response collection or raw JSON. */}
      {student && (
        <dl className="student-lookup-result">
          <div><dt>Student ID</dt><dd>{student.studentID}</dd></div>
          <div><dt>First name</dt><dd>{student.firstName}</dd></div>
          <div><dt>Last name</dt><dd>{student.lastName}</dd></div>
          <div><dt>Major</dt><dd>{student.major}</dd></div>
        </dl>
      )}
    </section>
  )
}

export default StudentLookup
