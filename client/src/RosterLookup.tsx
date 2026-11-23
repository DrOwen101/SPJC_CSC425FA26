import { useRef, useState, type SubmitEvent } from 'react'
import { errorMessage } from './apiClient'
import { normalizeName } from './studentLookupApi'
import { searchMyStudents, type RosterMatch } from './facultyApi'

// Lab 12 repurposed module (from the student "Student lookup"). It keeps the
// same flow: a typed name, a separate submitted search, a cancelled older
// request, and clear "not found" messages. It changes the data: the server
// searches the database and returns only students in YOUR sections, with
// part of a name or an email instead of an exact full name.
function RosterLookup() {
  const [searchText, setSearchText] = useState('')
  const [requested, setRequested] = useState('')
  const [matches, setMatches] = useState<RosterMatch[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const activeRequest = useRef<AbortController | null>(null)

  async function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    activeRequest.current?.abort()
    const query = normalizeName(searchText).replace(/\s+/g, ' ')
    setRequested(searchText.trim())
    setMatches(null)
    setError('')
    if (query.length < 2) {
      setError('Enter at least 2 characters of a name or email.')
      return
    }
    const controller = new AbortController()
    activeRequest.current = controller
    setLoading(true)
    try {
      const found = await searchMyStudents(query, controller.signal)
      if (!controller.signal.aborted) setMatches(found)
    } catch (requestError) {
      if (!controller.signal.aborted) setError(errorMessage(requestError))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <section id="roster-lookup" className="dashboard-card faculty-card" aria-labelledby="roster-lookup-heading" tabIndex={-1}>
      <h2 id="roster-lookup-heading">Roster Student Lookup</h2>
      <form className="faculty-form" onSubmit={search} noValidate>
        <label htmlFor="roster-lookup-input">Name or email</label>
        <input id="roster-lookup-input" value={searchText} autoComplete="off"
          onChange={(event) => setSearchText(event.target.value)} />
        <p className="field-help">Searches only students enrolled in your sections.</p>
        <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>
      {error && <p className="faculty-error" role="alert">{error}</p>}
      {matches !== null && (
        matches.length === 0 ? (
          <p role="status">No student in your sections matches “{requested}”.</p>
        ) : (
          <ul className="faculty-matches" aria-label={`Results for ${requested}`}>
            {matches.map((student) => (
              <li key={student.studentId}>
                <strong>{student.firstName} {student.lastName}</strong> · {student.email}
                <br />{student.majorName} · {student.sections.join(', ')}
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}

export default RosterLookup
