import { useEffect, useState } from 'react'
import { facultyApi } from './facultyApi'

type FacultyCourse = {
  sectionId: string
  courseCode: string
  term: string
  sectionName: string
}

type CourseGrade = {
  recordId: string
  grade: string
}

const gradePoints: Record<string, number> = {
  'A+': 4, A: 4, 'A-': 3.7,
  'B+': 3.3, B: 3, 'B-': 2.7,
  'C+': 2.3, C: 2, 'C-': 1.7,
  'D+': 1.3, D: 1, 'D-': 0.7,
  F: 0,
}

function FacultyCoursePerformance() {
  const [courses, setCourses] = useState<FacultyCourse[]>([])
  const [sectionId, setSectionId] = useState('')
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([])
  const [message, setMessage] = useState('Loading courses…')

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await facultyApi.get<{ courses: FacultyCourse[] }>('/api/faculty/courses')
        setCourses(response.data.courses)
        if (response.data.courses.length > 0) {
          setSectionId(response.data.courses[0].sectionId)
        } else {
          setMessage('No course sections are assigned to the faculty account.')
        }
      } catch {
        setMessage('Could not load faculty courses. Check that the server and database are running.')
      }
    }

    void loadCourses()
  }, [])

  useEffect(() => {
    if (!sectionId) return

    async function loadGrades() {
      setCourseGrades([])
      setMessage('Loading course grades…')
      try {
        const response = await facultyApi.get<{ records: CourseGrade[] }>(
          `/api/faculty/courses/${sectionId}/gradebook`,
        )
        setCourseGrades(response.data.records)
        setMessage(
          response.data.records.length === 0
            ? 'No grades are available for this course.'
            : '',
        )
      } catch {
        setMessage('Could not load grades for this course.')
      }
    }

    void loadGrades()
  }, [sectionId])

  const gradeCounts = courseGrades.reduce<Record<string, number>>((counts, record) => {
    counts[record.grade] = (counts[record.grade] ?? 0) + 1
    return counts
  }, {})
  const average = courseGrades.length === 0
    ? null
    : courseGrades.reduce((sum, record) => sum + gradePoints[record.grade], 0) / courseGrades.length

  return (
    <section id="faculty-performance" className="dashboard-card faculty-feature" aria-labelledby="faculty-performance-heading" tabIndex={-1}>
      <h2 id="faculty-performance-heading">Course Performance Summary</h2>
      <p>Compare the average grade points and grade distribution for a course section.</p>
      <label htmlFor="performance-course">Course section</label>
      <select
        id="performance-course"
        value={sectionId}
        onChange={(event) => setSectionId(event.target.value)}
        disabled={courses.length === 0}
      >
        {courses.map((course) => (
          <option key={course.sectionId} value={course.sectionId}>
            {course.courseCode} · {course.term} · Section {course.sectionName}
          </option>
        ))}
      </select>

      {message && <p role="status">{message}</p>}
      {average !== null && (
        <>
          <p className="metric">{average.toFixed(2)} / 4.00</p>
          <p>Unweighted average grade points · {courseGrades.length} student records</p>
          <h3>Grade distribution</h3>
          <ul>
            {Object.entries(gradeCounts)
              .sort(([first], [second]) => gradePoints[second] - gradePoints[first])
              .map(([grade, count]) => (
                <li key={grade}>{grade}: {count}</li>
              ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default FacultyCoursePerformance
