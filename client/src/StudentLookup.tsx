import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isEnrollmentsResponse, isStudentsResponse, normalizeName, type Enrollment, type Student } from './studentLookupApi'
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
  const [enrollment, setEnrollment] = useState<Enrollment[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [inputError, setInputError] = useState('')
  const [newStudent, setNewStudent] = useState<Student>({
    studentID: '',
    firstName: '',
    lastName: '',
    major: '',
  })

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
    setEnrollment([])
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
        { signal: controller.signal, timeout: 15000 },
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
        const matchedStudent = matches[0]
        const enrollmentsResponse = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/enrollments/${encodeURIComponent(matchedStudent.studentID)}`,
          { signal: controller.signal, timeout: 15000 },
        )
        if (controller.signal.aborted) return
        if (!isEnrollmentsResponse(enrollmentsResponse.data)) {
          throw new Error('The enrollment service returned unexpected data. Please try again.')
        }
        setEnrollment(enrollmentsResponse.data.enrollments)
        setStudent(matchedStudent)
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

  async function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const { data } = await axios.post<Student>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/students`,
        newStudent,
      )
      setStudent(data)
      setRequestedStudent(`${data.firstName} ${data.lastName}`)
      setSearchName(`${data.firstName} ${data.lastName}`)
      setNewStudent({ studentID: '', firstName: '', lastName: '', major: '' })
      setLookupError('')
    } catch {
      setLookupError('Unable to add student. Please try again.')
    }
  }

  async function saveStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if(!student) return
    try {
      await axios.put(
        `${apiBaseUrl.replace(/\/$/, '')}/api/students/${student.studentID}`,
        student,
      )
      const { data } = await axios.get<{students: Student[]}>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/students`,
      )
      const savedStudent = data.students.find((item) => item.studentID === student.studentID)
      if (savedStudent) setStudent(savedStudent)
      setLookupError(savedStudent ? '' : 'Unable to save student. Please try again.')
    } catch {
      setLookupError('Unable to save student. Please try again.')
    }
  }

  async function removeStudent() {
    if(!student) return
    try{
      await axios.delete(
        `${apiBaseUrl.replace(/\/$/, '')}/api/students/${student.studentID}`
      )
      setStudent(null)
      setEnrollment([])
      setLookupError('Student successfully removed.')
    } catch {
      setLookupError('Unable to remove student. Please try again.')
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
    <section id="student-lookup" className="dashboard-card student-lookup" aria-labelledby="lookup-heading" tabIndex={-1}>
      <h2 id="lookup-heading">Student lookup</h2>
      <p id="lookup-help">Enter a student’s full name, then select Search. These are fictional classroom records.</p>
      <form onSubmit={searchStudents} noValidate>
        <label htmlFor="student-name">Student full name</label>
        <div className="student-lookup-controls">
          <input
            id="student-name"
            name="studentName"
            type="text"
            autoComplete="off"
            value={searchName}
            onChange={(event) => {
              setSearchName(event.target.value)
              setInputError('')
            }}
            aria-describedby={inputError ? 'lookup-help lookup-input-error' : 'lookup-help'}
            aria-invalid={inputError ? true : undefined}
          />
          {/* Remain usable while loading: a new search cancels the old one. */}
          <button type="submit">Search</button>
        </div>
      </form>
      {inputError && <p id="lookup-input-error" className="field-error" role="alert">{inputError}</p>}
      {/* The live region announces changes without moving keyboard focus. */}
      <p role="status">{statusMessage}</p>
      {lookupError && <p className="field-error" role="alert">{lookupError}</p>}
      {/* Render labeled values, never the response collection or raw JSON. */}
      {student && (
        <>
        <dl className="student-lookup-result">
          <div><dt>Student ID</dt><dd>{student.studentID}</dd></div>
          <div><dt>First name</dt><dd>{student.firstName}</dd></div>
          <div><dt>Last name</dt><dd>{student.lastName}</dd></div>
          <div><dt>Major</dt><dd>{student.major}</dd></div>
        </dl>

        <h3>Enrollments</h3>
        {enrollment.length === 0 ? (
          <p>No enrollments found.</p>
        ) : (
          <ul>
            {enrollment.map((item, index) => (
              <li key={`${item.courseName}-${index}`}>{item.courseName}</li>
            ))}
          </ul>
        )}

        </>
      )}
      {student && (
        <form onSubmit={saveStudent}>
          <h3>Edit student</h3>
          <label>
            Student ID
            <input value={student.studentID} readOnly />
          </label>
          {(['firstName', 'lastName', 'major'] as const).map((field) => (
            <label key={field}>
              {field}
              <input
                required
                value={student[field]}
                onChange={(event) => setStudent({ ...student, [field]: event.target.value })}
              />
            </label>
          ))}
          <button type="submit">Save Student</button>
          <button type="button" onClick={removeStudent}>Delete Student</button>
        </form>
      )}
      <form onSubmit={addStudent}>
        <h3>Add Student</h3>
        {(['studentID', 'firstName', 'lastName', 'major'] as const).map((field) => (
          <label key = {field}>
            {field}
            <input
            required
            value={newStudent[field]}
            onChange={(event) => setNewStudent({ ...newStudent, [field]: event.target.value })}
            />
          </label>
        ))}
        <button type="submit">Add Student</button>
      </form>
    </section>

  )
}

export default StudentLookup
