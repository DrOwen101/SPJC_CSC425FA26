import { useEffect, useState } from 'react'
import './ScheduleFaculty.css'

type Faculty = {
  facultyId: string
  firstName: string
  lastName: string
  department: string
}

type ScheduleEntry = {
  scheduleId: number
  sectionId: number
  courseCode: string
  courseTitle: string
  sectionNumber: string
  term: string
  deliveryMode: string
  meetingDay: number
  startTime: string
  endTime: string
  building: string | null
  room: string | null
  effectiveStart: string
  effectiveEnd: string
}

type ScheduleResponse = {
  faculty: {
    facultyId: string
    firstName: string
    lastName: string
  }
  term: string
  schedule: ScheduleEntry[]
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

const meetingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ScheduleFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [facultyId, setFacultyId] = useState('F001')
  const [term, setTerm] = useState('Fall 2026')
  const [result, setResult] = useState<ScheduleResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadFaculty() {
      try {
        const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/faculty`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Faculty request failed (HTTP ${response.status}).`)

        const data = await response.json() as { faculty: Faculty[] }
        if (!Array.isArray(data.faculty)) throw new Error('The faculty service returned unexpected data.')
        setFaculty(data.faculty)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load faculty.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadFaculty()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setResult(null)
    setError('')

    async function loadSchedule() {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${apiBaseUrl.replace(/\/$/, '')}/api/faculty/${encodeURIComponent(facultyId)}/schedule?term=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        )
        if (!response.ok) {
          const data = await response.json() as { message?: string }
          throw new Error(data.message || `Schedule request failed (HTTP ${response.status}).`)
        }

        const data = await response.json() as ScheduleResponse
        if (!Array.isArray(data.schedule)) throw new Error('The schedule service returned unexpected data.')
        setResult(data)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load the schedule.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadSchedule()
    return () => controller.abort()
  }, [facultyId, term])

  return (
    <section
      id="teaching-schedule"
      className="dashboard-card schedule-faculty"
      aria-labelledby="teaching-schedule-heading"
      tabIndex={-1}
    >
      <h2 id="teaching-schedule-heading">Teaching Schedule</h2>

      <div className="schedule-filters">
        <div>
          <label htmlFor="schedule-faculty">Faculty</label>
          <select
            id="schedule-faculty"
            value={facultyId}
            onChange={(event) => setFacultyId(event.target.value)}
          >
            {faculty.map((member) => (
              <option key={member.facultyId} value={member.facultyId}>
                {member.firstName} {member.lastName} ({member.facultyId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="schedule-term">Term</label>
          <select
            id="schedule-term"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          >
            <option value="Fall 2026">Fall 2026</option>
            <option value="Spring 2027">Spring 2027</option>
          </select>
        </div>
      </div>

      {isLoading && <p role="status">Loading schedule…</p>}
      {error && <p className="schedule-error" role="alert">{error}</p>}

      {!isLoading && result && (
        <>
          <h3>
            {result.faculty.firstName} {result.faculty.lastName}
          </h3>
          <p>{result.term}</p>

          {result.schedule.length === 0 ? (
            <p>No scheduled classes were found for this faculty member and term.</p>
          ) : (
            <ul className="schedule-list">
              {result.schedule.map((entry) => (
                <li key={entry.scheduleId}>
                  <strong>{entry.courseCode} — {entry.courseTitle}</strong>
                  <p>
                    Section {entry.sectionNumber} · {meetingDays[entry.meetingDay - 1]} ·{' '}
                    {entry.startTime}–{entry.endTime}
                  </p>
                  <p>
                    {entry.deliveryMode}
                    {entry.building || entry.room
                      ? ` · ${entry.building ?? ''}${entry.building && entry.room ? ', ' : ''}${entry.room ?? ''}`
                      : ''}
                  </p>
                  <p>{entry.effectiveStart} through {entry.effectiveEnd}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default ScheduleFaculty
