import {useEffect, useState} from 'react'
import axios from 'axios'

type Course = {
  courseID: number
  code: string | null
  title: string
  credits: number | null
  subject: string | null
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000`

function CoursesCard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadCourses() {
      try{
        const response = await axios.get<{ courses: Course[] }>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/courses`, 
          { signal: controller.signal }, 
        )
        setCourses(response.data.courses)
      setCourses(response.data.courses)
      } catch {
       if (!controller.signal.aborted) {
         setError('Failed to load courses')
       }
      } finally {
        if (!controller.signal.aborted) {
         setLoading(false)
        }
      }
    }
    
    void loadCourses()
    return () => controller.abort()
  }, [])
  const subjects = [...new Set(courses.flatMap(course => course.subject ? [course.subject] : []),)].sort()

  const visableCourses = subject == 'all' ? courses : subject ? courses.filter(course => course.subject === subject) : []

  return (
    <section is="faculty-courses" className="dashboard-card">
      <h2>Available Courses</h2>

      <label htmlFor="course-subject">Subject</label>
      <select
        id="course-subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      >
        <option value="" disabled> Select a subject</option>
        <option value="all"> All Subjects</option>
        {subjects.map(subject => (
          <option key={subject} value={subject}>{subject}</option>
        ))}
      </select>

      {loading && <p>Loading courses...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && visableCourses.length === 0 && <p>No courses available</p>}

      <ul className="courses-list">
        {visableCourses.map(course => (
          <li key={course.courseID}>
            {course.code ? `${course.code} - ` : ''}{course.title} 
            ({course.credits !== null && `${course.credits} credits`})
          </li>
        ))}
      </ul>

    </section>
  )
}

export default CoursesCard


