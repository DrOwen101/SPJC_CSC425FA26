import {useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'

type Student = {
  studentID: string
  firstName: string
  lastName: string
}

type Section = {
  sectionID: number
  section: string
  term: string
  code: string | null
  title: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000`

function ClassRosters({ onSelectStudent }: { onSelectStudent: (studentID: string) => void }) {
  const [sectionID, setSectionID] = useState('')
  const [request, setRequest] = useState<{ sectionID: string } | null>(null)
  const [roster, setRoster] = useState<Student[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [professorID, setProfessorID] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if(!request) return

    const controller = new AbortController()
    async function loadRoster(){
      try{
        const response = await axios.get<{ roster: Student[] }> (
         `${apiBaseUrl.replace(/\/$/, '')}/api/rosters/${request!.sectionID}`,
        { signal: controller.signal, withCredentials: true },
      )
      if(!controller.signal.aborted) setRoster(response.data.roster)
    } catch {
      if(!controller.signal.aborted) setError("Unable to load")
    } finally {
      if(!controller.signal.aborted) setLoading(false)
    }
  }

  void loadRoster()
  return () => controller.abort()
}, [request])

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const value = sectionID.trim()
  const number = Number(value)

  if (!/^\d+$/.test(value) || number < 1 || number > 2147483647) {
    setError('Enter a valid section ID.')
    return
  }

  setError('')
  setRoster(null)
  setLoading(true)
  setRequest({ sectionID: value})
  }

  async function handleProfessorSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = professorID.trim()

    if(!id) {
      setSearchError('Enter a valid professor ID.')
      return
    }

    setSearching(true)
    setSearchError('')
    setSearched(false)
    setSections([])
    setSectionID('')
    setRoster(null)
    setRequest(null)
    setError('')

    try{
      const response = await axios.get<{ sections: Section[] }>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/professors/${id}/sections`,
        { withCredentials: true },
      )
      setSections(response.data.sections)
      setSearched(true)
    } catch {
      setSearchError('Unable to load sections')
    } finally {
      setSearching(false)
    }
  }

return (
  <section id="class-rosters" className="dashboard-card">
    <h2>Class Roster</h2>
    <form onSubmit={handleProfessorSearch}>
      <label htmlFor="professor-id">Professor ID</label>
      <input
        id="professor-id"
        value={professorID}
        disabled={searching || loading}
        onChange={(event) => {
          setProfessorID(event.target.value)
          setSections([])
          setSectionID('')
          setRoster(null)
          setRequest(null)
          setSearched(false)
          setSearchError('')
        }}
      />
      <button type="submit" disabled={searching || loading}>{searching ? 'Searching...' : 'Search sections'}</button>
    </form>
    {searchError && <p role="alert">{searchError}</p>}
    {searched && sections.length === 0 && <p>No classes found for this professor.</p>}

    <form onSubmit={handleSubmit}>
      <label htmlFor="roster-section">Class</label>
      <select
        id="roster-section"
        value={sectionID}
        disabled={searching || loading}
        onChange={(event) => {
          setSectionID(event.target.value)
          setRoster(null)
          setError('')
        }}
      >
        <option value=""> Select a class</option>
        {sections.map((section) => (
          <option key={section.sectionID} value={section.sectionID}>
            {section.code} - {section.title} - {section.section} {section.term}
          </option>
        ))}
      </select>
    <button type="submit" disabled={searching || loading || !sectionID}>
      {loading ? 'Loading...' : 'Load Roster'}
    </button>
    </form>

    {loading && <p>Loading roster...</p>}
    {error && <p role="alert">{error}</p>}
    {roster && roster.length === 0 && <p>No students found for this section.</p>}
    {roster && roster.length > 0 && (
      <ul>
        {roster.map((student) => (
          <li key={student.studentID}>{student.firstName} {student.lastName} ({student.studentID})
            <button type="button" onClick={() => onSelectStudent(student.studentID)}>
              View Transcript
            </button>
            <span>(Mock data: IDs 1001-1005)</span>
          </li>
        ))}
      </ul>
    )}
  </section>

)
}

export default ClassRosters