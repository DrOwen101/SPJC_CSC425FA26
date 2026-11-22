import { useEffect, useState, type SubmitEvent } from 'react'
import WeatherCard from './WeatherCard'
import StudentLookup from './StudentLookup'
import TranscriptCard from './TranscriptCard'
import { getAllStudents, getStudentById, createStudent,updateStudent,deleteStudent, type DbStudent } from './studentDbApi'

// Each letter grade maps to its value on a standard 4.0 GPA scale.
const gradePoints: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0,
}

// This role component supplies content; App.css supplies the shared layout.
// The lookup uses the dummy API; the other cards remain classroom examples.
function Dashboardstudent() {
  // Module 10 — PostgreSQL student records
const [dbStudents, setDbStudents] = useState<DbStudent[]>([])
const [dbLoading, setDbLoading] = useState(true)
const [dbError, setDbError] = useState('')


// MODULE 10 — FETCH STUDENTS FROM POSTGRESQL

useEffect(() => {
  async function fetchStudents() {
    try {
      setDbLoading(true)
      setDbError('')

      const students = await getAllStudents()
      setDbStudents(students)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      setDbError('Unable to load students from PostgreSQL.')
    } finally {
      setDbLoading(false)
    }
  }

  void fetchStudents()
}, [])
  const [gradeEntry, setGradeEntry] = useState('')
  const [grades, setGrades] = useState<string[]>([])
  const [gpa, setGpa] = useState<number | null>(null)
  const [gradeError, setGradeError] = useState('')

  // MODULE 10 — CREATE STUDENT FORM
const [newStudent, setNewStudent] = useState<DbStudent>({
  student_id: 1005,
  first_name: '',
  last_name: '',
  email: '',
})

const [createMessage, setCreateMessage] = useState('')
const [creatingStudent, setCreatingStudent] = useState(false)

// MODULE 10 — CREATE STUDENT HANDLER

async function handleCreateStudent(event: SubmitEvent<HTMLFormElement>) {
  event.preventDefault()

  setCreatingStudent(true)
  setCreateMessage('')

  try {
    const createdStudent = await createStudent(newStudent)

    // Update the student list after successful creation
    setDbStudents((previous) => [...previous, createdStudent])

    setCreateMessage(
      `Student ${createdStudent.first_name} ${createdStudent.last_name} created successfully!`
    )

    // Reset the form
    setNewStudent({
      student_id: 1006,
      first_name: '',
      last_name: '',
      email: '',
    })
  } catch (error) {
    console.error('Failed to create student:', error)
    setCreateMessage('Failed to create student. Check the ID and email.')
  } finally {
    setCreatingStudent(false)
  }
}
// MODULE 10 — UPDATE STUDENT FORM
const [editStudent, setEditStudent] = useState<DbStudent>({
  student_id: 0,
  first_name: '',
  last_name: '',
  email: '',
})

const [updateMessage, setUpdateMessage] = useState('')
const [updatingStudent, setUpdatingStudent] = useState(false)


// MODULE 10 — UPDATE STUDENT HANDLER


// MODULE 10 — LOAD STUDENT BY ID
const [loadingStudent, setLoadingStudent] = useState(false)
const [loadMessage, setLoadMessage] = useState('')

async function handleLoadStudent() {
  setLoadingStudent(true)
  setLoadMessage('')

  try {
    const student = await getStudentById(editStudent.student_id)

    // Fill the UPDATE form with the saved PostgreSQL values
    setEditStudent(student)

    setLoadMessage('Student loaded successfully!')
  } catch (error) {
    console.error('Failed to load student:', error)
    setLoadMessage('Student not found or unable to load.')
  } finally {
    setLoadingStudent(false)
  }
}

async function handleUpdateStudent(event: SubmitEvent<HTMLFormElement>) {
  event.preventDefault()

  setUpdatingStudent(true)
  setUpdateMessage('')

  try {
    const updatedStudent = await updateStudent(editStudent.student_id, {
      first_name: editStudent.first_name,
      last_name: editStudent.last_name,
      email: editStudent.email,
    })

    // Update the student displayed in React
    setDbStudents((previous) =>
      previous.map((student) =>
        student.student_id === updatedStudent.student_id
          ? updatedStudent
          : student
      )
    )

    setUpdateMessage('Student updated successfully!')
  } catch (error) {
    console.error('Failed to update student:', error)
    setUpdateMessage('Failed to update student. Check the ID and details.')
  } finally {
    setUpdatingStudent(false)
  }
}// MODULE 10 — DELETE STUDENT HANDLER
const [deletingStudent, setDeletingStudent] = useState(false)
const [deleteMessage, setDeleteMessage] = useState('')

async function handleDeleteStudent(studentId: number) {
  const confirmed = window.confirm(
    `Are you sure you want to delete student ID ${studentId}?`
  )

  if (!confirmed) return

  setDeletingStudent(true)
  setDeleteMessage('')

  try {
    await deleteStudent(studentId)

    // Remove deleted student from the React list
    setDbStudents((previous) =>
      previous.filter((student) => student.student_id !== studentId)
    )

    setDeleteMessage('Student deleted successfully!')
  } catch (error) {
    console.error('Failed to delete student:', error)
    setDeleteMessage('Unable to delete student. Check for existing enrollments.')
  } finally {
    setDeletingStudent(false)
  }
}


  function addGrade(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    // Removing spaces and capitalizing lets entries such as "b +" become "B+".
    const newGrade = gradeEntry.trim().toUpperCase().replaceAll(' ', '')

    if (!(newGrade in gradePoints)) {
      setGradeError('Enter a valid letter grade from A+ through F.')
      return
    }

    setGrades([...grades, newGrade])
    setGradeEntry('')
    setGradeError('')
    setGpa(null)
  }

  function calculateGpa() {
    const totalPoints = grades.reduce((total, grade) => total + gradePoints[grade], 0)
    setGpa(totalPoints / grades.length)
  }

  return (
    <main id="student-dashboard" className="dashboard" aria-labelledby="student-title" tabIndex={-1}>
      {/* One h1 names the page. Each card below has an h2 for heading navigation. */}
      <header className="dashboard-header">
        <p className="eyebrow">Your academic overview</p>
        <h1 id="student-title">Student Dashboard</h1>
        <p>Review your progress and find your academic information.</p>
      </header>

      {/* Real anchor links work with keyboards and browser history.
          Each href matches a section ID; .dashboard-nav styles the link list. */}
      <nav className="dashboard-nav" aria-label="Student sections">
        <ul>
            <li><a href="#gpa">GPA</a></li>
            {/* <li><a href="#attendance">Attendance</a></li> */}
            <li><a href="#student-lookup">Student lookup</a></li>
            <li><a href="#transcript">Transcript</a></li>
            <li><a href="#alerts">Alerts</a></li>
            <li><a href="#courses">Upcoming Courses</a></li>
        </ul>
      </nav>

      {/* className="dashboard-grid" connects to .dashboard-grid in App.css.
          Each named section is a card. tabIndex=-1 permits anchor focus without
          adding every card to the Tab sequence; links remain the normal stops. */}
      <div className="dashboard-grid">
        {/*
    MODULE 10 — POSTGRESQL STUDENT RECORDS
     */}

<section
  id="student-database"
  className="dashboard-card"
  aria-labelledby="student-database-heading"
  tabIndex={-1}
>
<h2 id="student-database-heading">Add Student</h2>
<p>Create a new student record in PostgreSQL.</p>

  {/* MODULE 10 — CREATE STUDENT FORM */}
<h3>Add New Student</h3>

<form onSubmit={handleCreateStudent}>
  <label htmlFor="new-student-id">Student ID</label>
  <input
    id="new-student-id"
    type="number"
    min="1"
    required
    value={newStudent.student_id}
    onChange={(event) =>
      setNewStudent({
        ...newStudent,
        student_id: Number(event.target.value),
      })
    }
  />

  <label htmlFor="new-first-name">First Name</label>
  <input
    id="new-first-name"
    type="text"
    maxLength={50}
    required
    value={newStudent.first_name}
    onChange={(event) =>
      setNewStudent({
        ...newStudent,
        first_name: event.target.value,
      })
    }
  />

  <label htmlFor="new-last-name">Last Name</label>
  <input
    id="new-last-name"
    type="text"
    maxLength={50}
    required
    value={newStudent.last_name}
    onChange={(event) =>
      setNewStudent({
        ...newStudent,
        last_name: event.target.value,
      })
    }
  />

  <label htmlFor="new-email">Email</label>
  <input
    id="new-email"
    type="email"
    maxLength={100}
    required
    value={newStudent.email}
    onChange={(event) =>
      setNewStudent({
        ...newStudent,
        email: event.target.value,
      })
    }
  />

  <button type="submit" disabled={creatingStudent}>
    {creatingStudent ? 'Creating...' : 'Create Student'}
  </button>
</form>

{createMessage && (
  <p role="status" aria-live="polite">
    {createMessage}
  </p>
)}

</section>
<section
  id="update-student"
  className="dashboard-card"
  aria-labelledby="update-student-heading"
  tabIndex={-1}
>
  <h2 id="update-student-heading">Update Student</h2>
  <p>Load an existing student from PostgreSQL and edit their information.</p>

<form onSubmit={handleUpdateStudent}>
  <label htmlFor="edit-student-id">Student ID</label>
  <input
    id="edit-student-id"
    type="number"
    min="1"
    required
    value={editStudent.student_id}
    onChange={(event) =>
      setEditStudent({
        ...editStudent,
        student_id: Number(event.target.value),
      })
    }
  />

  <button
    type="button"
    onClick={handleLoadStudent}
    disabled={loadingStudent || editStudent.student_id <= 0}
  >
    {loadingStudent ? 'Loading...' : 'Load Student'}
  </button>

  {loadMessage && <p role="status">{loadMessage}</p>}

  <label htmlFor="edit-first-name">First Name</label>
  <input
    id="edit-first-name"
    type="text"
    maxLength={50}
    required
    value={editStudent.first_name}
    onChange={(event) =>
      setEditStudent({ ...editStudent, first_name: event.target.value })
    }
  />

  <label htmlFor="edit-last-name">Last Name</label>
  <input
    id="edit-last-name"
    type="text"
    maxLength={50}
    required
    value={editStudent.last_name}
    onChange={(event) =>
      setEditStudent({ ...editStudent, last_name: event.target.value })
    }
  />

  <label htmlFor="edit-email">Email</label>
  <input
    id="edit-email"
    type="email"
    maxLength={100}
    required
    value={editStudent.email}
    onChange={(event) =>
      setEditStudent({ ...editStudent, email: event.target.value })
    }
  />

  <button type="submit" disabled={updatingStudent}>
    {updatingStudent ? 'Updating...' : 'Update Student'}
  </button>
</form>

{updateMessage && (
  <p role="status" aria-live="polite">{updateMessage}</p>
)}


</section>

{/* MODULE 10 — STUDENT RECORDS CARD */}
<section
  id="student-records"
  className="dashboard-card"
  aria-labelledby="student-records-heading"
  tabIndex={-1}
>
  <h2 id="student-records-heading">Student Records</h2>
  <p>View and delete student records stored in PostgreSQL.</p>

  {dbLoading && <p>Loading students...</p>}

  {dbError && <p role="alert">{dbError}</p>}

  {!dbLoading && !dbError && (
    <>
      {dbStudents.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <ul>
          {dbStudents.map((student) => (
            <li key={student.student_id}>
              <strong>
                {student.first_name} {student.last_name}
              </strong>
              {' — '}
              ID: {student.student_id}
              {' — '}
              {student.email}
              {' '}
<button
  type="button"
  disabled={deletingStudent}
  onClick={() => handleDeleteStudent(student.student_id)}
>
  Delete
</button>
            </li>
          ))}
        </ul>
      )}
    </>
  )}
  {deleteMessage && (
  <p role="status" aria-live="polite">
    {deleteMessage}
  </p>
)}
</section>
        {/* StudentLookup contains the Lab 7 form, request, state, and result.
            The dashboard imports and places it like any other React component. */}
        <StudentLookup />
        <WeatherCard />
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <p id="gpa-value" className="metric" aria-live="polite">
            {gpa === null ? '--' : gpa.toFixed(2)}
          </p>
          <p>Calculated GPA · equal weight per grade</p>

          <form className="gpa-form" onSubmit={addGrade} noValidate>
            <label htmlFor="grade-entry">Enter a letter grade</label>
            <div className="gpa-entry-row">
              <input
                id="grade-entry"
                name="grade"
                type="text"
                value={gradeEntry}
                onChange={(event) => setGradeEntry(event.target.value)}
                placeholder="A-"
                maxLength={3}
                autoComplete="off"
                aria-describedby={gradeError ? 'grade-help grade-error' : 'grade-help'}
                aria-invalid={gradeError ? true : undefined}
              />
              <button type="submit">Add Grade</button>
            </div>
            <p id="grade-help" className="field-help">Accepted grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, and F.</p>
            {gradeError && <p id="grade-error" className="field-error" role="alert">{gradeError}</p>}
          </form>

          <div className="grade-list-area">
            <h3>Grades entered</h3>
            {grades.length === 0 ? (
              <p>No grades entered yet.</p>
            ) : (
              <ol className="grade-list">
                {grades.map((grade, index) => (
                  <li key={`${grade}-${index}`}>
                    <span>{grade}</span>
                    <span>{gradePoints[grade].toFixed(1)} points</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <button className="calculate-button" type="button" onClick={calculateGpa} disabled={grades.length === 0}>
            Calculate GPA
          </button>
        </section>
        {/* <section id="attendance" className="dashboard-card" aria-labelledby="attendance-heading" tabIndex={-1}>
          <h2 id="attendance-heading">Attendance</h2>
          <p className="metric">94%</p>
          <p>Current attendance · sample value</p>
        </section> */}
        <TranscriptCard id="transcript" />
        <section id="alerts" className="dashboard-card" aria-labelledby="alerts-heading" tabIndex={-1}>
          <h2 id="alerts-heading">Alerts</h2>
          <p className="status-label">Sample status: no new academic alerts</p>
          <p>Check here for academic reminders and notices. Live alerts are not connected.</p>
        </section>
        <section id="courses" className="dashboard-card" aria-labelledby="courses-heading" tabIndex={-1}>
          <h2 id="courses-heading">Upcoming Courses</h2>
          <p className="status-label">Not connected</p>
          <p>Your registered courses, meeting times, and locations will appear here when registration data is connected.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboardstudent
