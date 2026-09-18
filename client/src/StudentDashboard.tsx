import { useState } from 'react'
import SPJCLogo from './assets/SPJCLogo.jpg'

type Course = {
  grade: string
  credits: string
}

const gradePoints: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
}

function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([
    { grade: '', credits: '' },
    { grade: '', credits: '' },
    { grade: '', credits: '' },
    { grade: '', credits: '' },
  ])

  const [calculatedGPA, setCalculatedGPA] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const updateCourse = (
    index: number,
    field: keyof Course,
    value: string
  ) => {
    const updatedCourses = [...courses]
    updatedCourses[index] = {
      ...updatedCourses[index],
      [field]: value,
    }

    setCourses(updatedCourses)
  }

  const calculateGPA = () => {
    const hasIncompleteInput = courses.some(
      (course) => course.grade === '' || course.credits.trim() === ''
    )

    if (hasIncompleteInput) {
      setCalculatedGPA(null)
      setMessage('Please enter a grade and credit hours for every course.')
      return
    }

    const hasInvalidCredits = courses.some((course) => {
      const credits = Number(course.credits)
      return !Number.isFinite(credits) || credits <= 0
    })

    if (hasInvalidCredits) {
      setCalculatedGPA(null)
      setMessage('Credit hours must be a number greater than zero.')
      return
    }

    let totalGradePoints = 0
    let totalCredits = 0

    courses.forEach((course) => {
      const credits = Number(course.credits)
      totalGradePoints += gradePoints[course.grade] * credits
      totalCredits += credits
    })

    const result = totalGradePoints / totalCredits

    setCalculatedGPA(result)
    setMessage(
      result >= 2
        ? 'Good academic standing.'
        : 'Academic warning: Your GPA is below 2.00.'
    )
  }

  const resetCalculator = () => {
    setCourses([
      { grade: '', credits: '' },
      { grade: '', credits: '' },
      { grade: '', credits: '' },
      { grade: '', credits: '' },
    ])

    setCalculatedGPA(null)
    setMessage('')
  }

  return (
    <div id="student-dashboard" className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            src={SPJCLogo}
            className="dashboard-logo"
            width="80"
            alt="SPJC logo"
          />

          <div>
            <h1>Student Dashboard</h1>
            <p className="dashboard-subtitle">University Student Portal</p>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Student navigation">
          <a href="#gpa">GPA</a>
          <a href="#attendance">Attendance</a>
          <a href="#transcript">Transcript</a>
          <a href="#alerts">Alerts</a>
          <a href="#courses">Upcoming Courses</a>
          <a href="#gpa-calculator">GPA Calculator</a>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2>Student Overview</h2>

          <div className="dashboard-grid">
            <article id="gpa" className="dashboard-card">
              <h3>GPA</h3>
              <p className="dashboard-value">
                {calculatedGPA === null
                  ? '3.75'
                  : calculatedGPA.toFixed(2)}
              </p>
              <p>
                {calculatedGPA === null
                  ? 'Current cumulative GPA'
                  : 'Calculated semester GPA'}
              </p>
            </article>

            <article id="attendance" className="dashboard-card">
              <h3>Attendance</h3>
              <p className="dashboard-value">94%</p>
              <p>Current class attendance</p>
            </article>

            <article id="transcript" className="dashboard-card">
              <h3>Transcript</h3>
              <p>View your completed courses and grades.</p>
            </article>

            <article id="alerts" className="dashboard-card">
              <h3>Alerts</h3>
              <p>
                {message || 'No new academic alerts.'}
              </p>
            </article>
          </div>
        </section>

        <section id="courses" className="dashboard-section">
          <h2>Upcoming Courses</h2>

          <article className="dashboard-card dashboard-wide">
            <h3>Registered Courses</h3>
            <p>View your upcoming and registered courses.</p>
          </article>
        </section>

        <section id="gpa-calculator" className="dashboard-section">
          <h2>GPA Calculator</h2>

          <form
            className="gpa-calculator"
            onSubmit={(event) => {
              event.preventDefault()
              calculateGPA()
            }}
          >
            {courses.map((course, index) => (
              <div className="course-row" key={index}>
                <p className="course-label">Course {index + 1}</p>

                <label>
                  Grade
                  <select
                    value={course.grade}
                    onChange={(event) =>
                      updateCourse(index, 'grade', event.target.value)
                    }
                  >
                    <option value="">Select grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </label>

                <label>
                  Credit Hours
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="3"
                    value={course.credits}
                    onChange={(event) =>
                      updateCourse(index, 'credits', event.target.value)
                    }
                  />
                </label>
              </div>
            ))}

            <div className="calculator-buttons">
              <button type="submit">Calculate GPA</button>

              <button type="button" onClick={resetCalculator}>
                Reset
              </button>
            </div>

            <div className="gpa-result" aria-live="polite">
              <h3>
                Result:{' '}
                {calculatedGPA === null
                  ? '--'
                  : calculatedGPA.toFixed(2)}
              </h3>

              {message && <p>{message}</p>}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default StudentDashboard