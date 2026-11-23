import { useEffect, useId, useState } from 'react'
import { listCourses, courseError, type Course } from './CourseAPI'
import {getFaculty} from './facultyAPI'
// I want this card to SELECT every course that the provided instructor name is teaching
//I used All Records as a base
type CourseCardProps = {
  id?: string
  refreshKey?:number
}

export default function FacultyCoures({id,refreshKey=0}:CourseCardProps)  {
    const labelId = useId()
    const [facultyID, setFacultyID] = useState('')
    const [result, setResult] = useState<Course[]>([])
    const [displayedCourses, setDisplayedCourses] = useState<Course[]>([])
    const [refreshCount, setRefreshCount] = useState(0)
    const [busy, setBusy] = useState(true)
    const [error, setError] = useState('')
    const [inputError, setInputError] = useState('')
    /*const activeRequest = useRef<AbortController | null>(null)
    useEffect(() => () => activeRequest.current?.abort(), [])*/
  
  useEffect(() => {
      const controller = new AbortController()
      setBusy(true)
      setError('')
      // Define an async function inside the effect so the effect can return cleanup.
      async function loadCourses() {
        try {
          const records = await listCourses(controller.signal)
          if (controller.signal.aborted) return
  
          // Updating state tells React to display the returned students.
          setResult(records)
          setDisplayedCourses(records)
        } catch (error) {
          if (controller.signal.aborted) return
  
          setResult([])
          setError(courseError(error))
        } finally {
          if (!controller.signal.aborted) {
            setBusy(false)
          }
        }
      }
    void loadCourses()
    return () => controller.abort()}, [refreshKey, refreshCount])
    
  async function restrictCourses(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!facultyID.trim()) {
      setDisplayedCourses(result)
      setInputError('Enter a faculty employee number.')
      return
    }

    try {
      setBusy(true)
      setError('')

      const facultyResults = await Promise.all(
        result.map(async (course) => ({
          course,
          faculty: await getFaculty(course.instructor_id)
        }))
      )

      const employeeNumber = facultyID.trim().toUpperCase()
      const items = facultyResults
        .filter(({ faculty }) => faculty.employee_number.toUpperCase() === employeeNumber)
        .map(({ course }) => course)

      setDisplayedCourses(items)
    } catch (searchError) {
      setDisplayedCourses([])
      setError(searchError instanceof Error ? searchError.message : 'Unable to search faculty courses.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id={id} className="dashboard-card all-students-courses faculty-courses-card" aria-labelledby={`${labelId}-heading`} tabIndex={-1}>
      <h2 id={`${labelId}-heading`}>Faculty Courses</h2>
      <p>Search saved course sections by the faculty's employee number.</p>
      <form onSubmit={restrictCourses} noValidate>
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
          <button type="submit">Search</button>
        </div>
        <p id={`${labelId}-help`} className="transcript-card-help">Enter the starting letter as well.</p>
        {inputError && <p id={`${labelId}-input-error`} className="transcript-card-error" role="alert">{inputError}</p>}
      </form>
      <div className="faculty-course-table-scroll" role="region" aria-label="Faculty course sections" tabIndex={0}>
        <table>
          <caption>{displayedCourses.length} Courses</caption>
          <thead>
            <tr>
              <th scope="col">Section ID</th>
              <th scope="col">Section Number</th>
              <th scope="col">Course Code</th>
              <th scope="col">Title</th>
              <th scope="col">Capacity</th>
              <th scope="col">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {displayedCourses.map((course) => (
              <tr key={course.course_id}>
                <td>{course.course_id}</td>
                <td>{course.section_number}</td>
                <td>{course.course_code_snapshot}</td>
                <td>{course.title_snapshot}</td>
                <td>{course.capacity}</td>
                <td>{course.delivery_mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      

      {busy && <p className="course-card-status" role="status">Loading courses...</p>}
      {error && <p className="course-card-error" role="alert">{error}</p>}

      
      
    </section>
  )
}

