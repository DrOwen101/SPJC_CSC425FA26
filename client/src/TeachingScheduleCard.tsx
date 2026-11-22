import { useEffect, useState, type FormEvent, type JSX } from 'react'
import axios from 'axios'

interface ScheduleEntry {
  scheduleId: number
  courseCode: string
  entryType: string
  dayTime: string
  location: string
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`

function TeachingScheduleCard(): JSX.Element {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [courseCode, setCourseCode] = useState('')
  const [entryType, setEntryType] = useState('Lecture')
  const [dayTime, setDayTime] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get<ScheduleEntry[]>(`${apiBaseUrl.replace(/\/$/, '')}/api/faculty/schedule`)
      .then((res) => setEntries(res.data))
      .catch(() => setError('Unable to load teaching schedule.'))
  }, [])

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!courseCode.trim() || !dayTime.trim() || !location.trim()) {
      setError('Course code, day/time, and location are required.')
      return
    }
    setError('')

    try {
      const res = await axios.post<ScheduleEntry>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/faculty/schedule`,
        { courseCode, entryType, dayTime, location },
        { headers: { 'x-user-role': 'faculty' } }
      )
      setEntries([...entries, res.data])
      setCourseCode('')
      setDayTime('')
      setLocation('')
    } catch {
      setError('Failed to save schedule entry.')
    }
  }

  async function handleRemove(id: number) {
    try {
      await axios.delete(`${apiBaseUrl.replace(/\/$/, '')}/api/faculty/schedule/${id}`, {
        headers: { 'x-user-role': 'faculty' },
      })
      setEntries(entries.filter((item) => item.scheduleId !== id))
    } catch {
      setError('Failed to remove schedule entry.')
    }
  }

  return (
    <section id="teaching-schedule" className="dashboard-card" aria-labelledby="schedule-heading">
      <h2 id="schedule-heading">Teaching Schedule &amp; Office Hours</h2>
      <p>Manage weekly lecture meetings and student office hours.</p>

      <form className="gpa-form" onSubmit={handleAdd} noValidate>
        <div className="gpa-entry-row">
          <input
            type="text"
            placeholder="Course (CSC 425)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
          <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
            <option value="Lecture">Lecture</option>
            <option value="Office Hours">Office Hours</option>
          </select>
        </div>

        <div className="gpa-entry-row">
          <input
            type="text"
            placeholder="Day & Time (MWF 10:00 AM)"
            value={dayTime}
            onChange={(e) => setDayTime(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location (Room 204 / Zoom)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button type="submit">Add</button>
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}
      </form>

      <div className="grade-list-area">
        <h3>Weekly Schedule</h3>
        {entries.length === 0 ? (
          <p>No classes or office hours scheduled yet.</p>
        ) : (
          <ol className="grade-list">
            {entries.map((item) => (
              <li key={item.scheduleId}>
                <span>
                  <strong>{item.courseCode}</strong> [{item.entryType}] — {item.dayTime} ({item.location})
                </span>
                <button type="button" onClick={() => handleRemove(item.scheduleId)}>
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default TeachingScheduleCard