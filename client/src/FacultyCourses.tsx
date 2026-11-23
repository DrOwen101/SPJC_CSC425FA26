import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import { isCoursesResponse, normalizeName, type Course } from './facultyCoursesAPI'

// Use the same development proxy and deployed API setting as Student Records.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

// This component owns the lookup's state, API request, and displayed result.
// Import it into a dashboard and render <StudentLookup /> to show the feature.
function FacultyCourses({ id }: { id?: string }) {
  const labelId = useId()
  // The editable input and submitted name are separate: typing a new name
  // must not relabel an existing result or start a request automatically.
  const [searchInstructor, setSearchInstructor] = useState('')
  const [requestedInstructor, setRequestedInstructor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // null means there is no record to display. setStudent updates React state
  // and causes the component to render again with the selected student.
  const [course, setCourse] = useState<Course | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [inputError, setInputError] = useState('')

  // A ref keeps the active controller between renders without updating the UI.
  // Every submission (even an invalid one) cancels the previous request.
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => activeRequest.current?.abort()
  }, [])

  async function searchInstructors(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // The form supports Enter without reloading the page.
    activeRequest.current?.abort()
    const name = searchInstructor.trim()

    // Clear ALL previous outcomes immediately, including after a blank search.
    setRequestedInstructor(name)
    setCourse(null)
    setLookupError('')
    setInputError('')
    setIsLoading(false)
    if (!name) {
      setInputError('Enter an instructor’s full name before searching.')
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
        `${apiBaseUrl.replace(/\/$/, '')}/api/courses`,
        { params: { name }, signal: controller.signal, timeout: 15000 },
      )
      if (controller.signal.aborted) return

      // TypeScript cannot guarantee the shape of JSON received over the network.
      // Check it before accessing fields or rendering any student information.
      if (!isCoursesResponse(response.data)) {
        throw new Error('The courses service returned unexpected data. Please try again.')
      }

      // Use both returned name fields and compare the whole normalized name.
      // filter (rather than find) lets us detect ambiguous duplicate names.
      const requestedName = normalizeName(name)
      const matches = response.data.courses.filter((candidate) =>
        normalizeName(candidate.instructor) === requestedName,
      )
      if (matches.length === 0) {
        setLookupError(`Instructor not found: “${name}”. Check the full name and try again.`)
      } else if (matches.length > 1) {
        setLookupError(`More than one student matches “${name}”. Please clarify which student you mean with your instructor before continuing.`)
      } else {
        setCourse(matches[0]) // Store only the one matching record for rendering.
      }
    } catch (error) {
      // Cancellation is expected on another search or navigation. An old error
      // must not replace the outcome of the newer request either.
      if (controller.signal.aborted) return
      let message = 'Unable to load course data. Please try again.'
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          message = 'The course request timed out. Please try again.'
        } else if (error.response) {
          message = `The course request failed (HTTP ${error.response.status}). Please try again.`
        } else {
          message = 'Unable to reach the courses API. Check that the server is running and try again.'
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
    statusMessage = `Loading student data for ${requestedInstructor}…`
  } else if (course) {
    statusMessage = `Showing the result for ${requestedInstructor}.`
  } else if (!requestedInstructor) {
    statusMessage = 'No instructor requested yet.'
  }

  return (
    <section id={id} className="dashboard-card course-lookup" aria-labelledby={`${labelId}-lookup-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-lookup-heading`}>Courses</h2>
      <p id={`${labelId}-lookup-help`}>Enter an instructor’s full name to search the saved courses records.</p>
      <form onSubmit={searchInstructors} noValidate>
        <label htmlFor={`${labelId}-instructor-name`}>Instructor full name</label>
        <div className="course-lookup-controls">
          <input
            id={`${labelId}-instructor-name`}
            name="instructor"
            type="text"
            autoComplete="off"
            value={searchInstructor}
            onChange={(event) => {
              setSearchInstructor(event.target.value)
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
      {course && (
        <dl className="course-lookup-result">
          <div><dt>Course Title</dt><dd>{course.courseTitle}</dd></div>
          <div><dt>Section Number</dt><dd>{course.sectionNumber}</dd></div>
          <div><dt>Enrollment</dt><dd>{course.enrollment + "/" + course.seats}</dd></div>
          <div><dt>Course Materials</dt><dd>{course.courseMaterials}</dd></div>
        </dl>
      )}
    </section>
  )
}

export default FacultyCourses