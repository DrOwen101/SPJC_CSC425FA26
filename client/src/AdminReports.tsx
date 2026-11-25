import { useEffect, useState } from 'react'
import SectionScheduleTable from './SectionScheduleTable'
import AttendanceTable from './AttendanceTable'
import { dashboardError } from './facultyApi'
import { departments, type AdminApi, type AdminSection, type Concern } from './adminApi'

export default function AdminReports({ api, version }: { api: AdminApi; version: number }) {
  const [department, setDepartment] = useState('')
  return (
    <>
      <section id="course-directory" className="dashboard-card faculty-card" aria-labelledby="directory-heading" tabIndex={-1}>
        <h2 id="directory-heading">Department section directory</h2>
        <div className="faculty-controls">
          <label>Show department
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        <DirectoryRows key={`${department}:${version}`} api={api} department={department} />
      </section>
      <section id="reports" className="dashboard-card faculty-card" aria-labelledby="report-heading" tabIndex={-1}>
        <h2 id="report-heading">Attendance concerns</h2>
        <p>{departments.find((item) => item.id === department)?.name ?? 'All departments'}. Students with two or more absences in a section.</p>
        <ConcernRows key={department} api={api} department={department} />
      </section>
    </>
  )
}

function DirectoryRows({ api, department }: { api: AdminApi; department: string }) {
  const [sections, setSections] = useState<AdminSection[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api.sections(department, controller.signal)
      .then(({ sections }) => { if (!controller.signal.aborted) setSections(sections) })
      .catch((error) => { if (!controller.signal.aborted) setError(dashboardError(error)) })
    return () => controller.abort()
  }, [api, department])

  if (error) return <p className="field-error" role="alert">{error}</p>
  if (!sections) return <p role="status">Loading sections…</p>
  if (!sections.length) return <p role="status">No sections in this department.</p>
  return <SectionScheduleTable sections={sections} caption="Sections and instructors" showManagement />
}

function ConcernRows({ api, department }: { api: AdminApi; department: string }) {
  const [rows, setRows] = useState<Concern[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api.concerns(department, controller.signal)
      .then(({ concerns }) => { if (!controller.signal.aborted) setRows(concerns) })
      .catch((error) => { if (!controller.signal.aborted) setError(dashboardError(error)) })
    return () => controller.abort()
  }, [api, department])

  if (error) return <p className="field-error" role="alert">{error}</p>
  if (!rows) return <p role="status">Loading attendance…</p>
  if (!rows.length) return <p role="status">No repeated absences in this department.</p>
  return (
    <AttendanceTable rows={rows} caption="Repeated absences" columns={['Section', 'Absences', 'Latest absence']}
      rowKey={(row) => `${row.sectionId}:${row.studentId}`}
      renderDetails={(row) => <><td>{row.sectionId}</td><td>{row.absences}</td><td>{row.lastAbsence}</td></>}
    />
  )
}
