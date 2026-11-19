import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import RecordTable from './RecordTable'
import StudentSearchForm from './StudentSearchForm'
import { facultyError, type FacultyApi, type RosterStudent } from './facultyApi'
import { normalizeName } from './studentLookupApi'

export default function FacultyStudentLookup({ api }: { api: FacultyApi }) {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputError, setInputError] = useState('')
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  async function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    request.current?.abort()
    const searchTerm = normalizeName(query)
    setSubmitted('')
    setStudents([])
    setError('')
    setLoading(false)
    if (!searchTerm) {
      setInputError('Enter a student name or ID.')
      return
    }
    setInputError('')
    setSubmitted(query.trim())
    setLoading(true)
    const controller = new AbortController()
    request.current = controller
    try {
      const result = await api.search(searchTerm, controller.signal)
      if (!controller.signal.aborted) setStudents(result.students)
    } catch (error) {
      if (!controller.signal.aborted) setError(facultyError(error))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <section id="class-rosters" className="dashboard-card student-lookup" aria-labelledby="faculty-lookup-heading" tabIndex={-1}>
      <h2 id="faculty-lookup-heading">Find a student on your rosters</h2>
      <p id="faculty-lookup-help">Search by student ID or part of a name across your assigned sections.</p>
      <StudentSearchForm inputId="faculty-student-search" helpId="faculty-lookup-help" label="Student name or ID"
        value={query} inputError={inputError} maxLength={80} onChange={(value) => { setQuery(value); setInputError('') }}
        onSubmit={search} />
      <p role="status">
        {loading && 'Searching your rosters…'}
        {!loading && !error && submitted && (students.length ? `${students.length} shown for “${submitted}”.` : `No students matched “${submitted}” on your rosters.`)}
      </p>
      {error && <p role="alert" className="field-error">{error}</p>}
      {students.length > 0 && (
        <RecordTable caption="Matching students" regionLabel="Student search results" columns={['ID', 'Student', 'Major', 'Your sections']}>
          {students.map((student) => (
            <tr key={student.id}><td>{student.id}</td><th scope="row">{student.fullName}</th><td>{student.major}</td><td>{student.sections.join(', ')}</td></tr>
          ))}
        </RecordTable>
      )}
    </section>
  )
}
