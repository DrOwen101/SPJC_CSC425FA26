import { useState, type SubmitEvent } from 'react'
import { dashboardError } from './facultyApi'
import { departments, type AdminApi, type AdminSection, type Instructor } from './adminApi'

type FormProps = { api: AdminApi; instructors: Instructor[]; onSaved: () => void }

function InstructorOptions({ instructors }: { instructors: Instructor[] }) {
  return <><option value="">Choose faculty</option>{instructors.map((person) =>
    <option key={person.id} value={person.id}>{person.name}</option>,
  )}</>
}

export function NewSectionForm({ api, instructors, onSaved }: FormProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const field = (key: string) => String(data.get(key) ?? '')
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const { section } = await api.createSection({
        id: field('id'), title: field('title'), department: field('department'), instructorId: Number(field('instructor')),
        meetingDays: field('days'), startsAt: field('start'), endsAt: field('end'), location: field('room'),
      })
      form.reset()
      setStatus(`Created section ${section.id}.`)
      onSaved()
    } catch (error) {
      setError(dashboardError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="course-management" className="dashboard-card faculty-card" aria-labelledby="create-section-heading" tabIndex={-1}>
      <h2 id="create-section-heading">Create a class section</h2>
      <form className="faculty-controls" onSubmit={save}>
        <label>Section ID<input name="id" placeholder="CSC130-01" required maxLength={12} /></label>
        <label>Course title<input name="title" required maxLength={100} /></label>
        <label>New section department<select name="department" required>
          {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>New section instructor<select name="instructor" required><InstructorOptions instructors={instructors} /></select></label>
        <label>Meeting days<select name="days"><option>Mon / Wed</option><option>Tue / Thu</option><option>Friday</option></select></label>
        <label>Start time<input name="start" type="time" required /></label>
        <label>End time<input name="end" type="time" required /></label>
        <label>Room<input name="room" required maxLength={80} /></label>
        <button type="submit" disabled={busy || !instructors.length}>{busy ? 'Creating…' : 'Create section'}</button>
      </form>
      {error && <p className="field-error" role="alert">{error}</p>}
      {status && <p className="status-label" role="status">{status}</p>}
    </section>
  )
}

export function AssignInstructorForm({ api, instructors, sections, onSaved }: FormProps & { sections: AdminSection[] }) {
  const [sectionId, setSectionId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const selected = sections.find((section) => section.id === sectionId)

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const { section } = await api.assignInstructor(sectionId, Number(data.get('instructor')))
      setStatus(`Assigned ${section.instructor} to ${section.id}.`)
      onSaved()
    } catch (error) {
      setError(dashboardError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="instructor-assignment" className="dashboard-card faculty-card" aria-labelledby="assignment-heading" tabIndex={-1}>
      <h2 id="assignment-heading">Assign an instructor</h2>
      <form className="faculty-controls" onSubmit={save}>
        <label>Section to assign<select required value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
          <option value="">Choose a section</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.id} · {section.title}</option>)}
        </select></label>
        <label>Assign to<select name="instructor" required><InstructorOptions instructors={instructors} /></select></label>
        <button type="submit" disabled={busy || !sections.length || !instructors.length}>{busy ? 'Saving…' : 'Assign instructor'}</button>
      </form>
      {selected && <p>Current instructor for {selected.id}: {selected.instructor}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {status && <p className="status-label" role="status">{status}</p>}
    </section>
  )
}
