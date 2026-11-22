import { useState, type CSSProperties, type FormEvent } from 'react'
import axios from 'axios'

const base = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3000`
type Student = { id: number; name: string }
type Grade = { id: number; student_id: number; course: string; grade: string }
type Announcement = { id: number; course: string; message: string }

const shell: CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '36px 24px 70px', color: '#17382b', fontFamily: 'Inter, system-ui, Arial, sans-serif' }
const card: CSSProperties = { background: '#fff', border: '1px solid #dbe9df', borderRadius: 18, padding: 24, boxShadow: '0 6px 24px rgba(25,45,85,.05)', minWidth: 0 }
const field: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid #b9d2c2', borderRadius: 9, background: '#fff', color: '#17382b', fontSize: 14 }
const label: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 650, marginBottom: 7, color: '#315944' }
const button: CSSProperties = { border: 0, borderRadius: 9, padding: '11px 17px', background: '#237a4c', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const subtle: CSSProperties = { color: '#60796b', fontSize: 14, lineHeight: 1.6 }
const sectionTitle: CSSProperties = { fontSize: 20, margin: '0 0 7px', fontWeight: 750 }
const item: CSSProperties = { padding: '12px 0', borderBottom: '1px solid #e9f2eb', fontSize: 14 }

function Dashboardfaculty() {
  const [token, setToken] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [transcriptId, setTranscriptId] = useState('1001')
  const [transcript, setTranscript] = useState<unknown>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [studentId, setStudentId] = useState('')
  const [course, setCourse] = useState('CSC 425')
  const [grade, setGrade] = useState('A')
  const [announcementCourse, setAnnouncementCourse] = useState('CSC 425')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('Connect to load faculty records.')
  const [connected, setConnected] = useState(false)
  const config = () => ({ headers: { 'x-faculty-token': token } })
  const errorText = (error: unknown) => axios.isAxiosError(error)
    ? `Request failed (${error.response?.status ?? 'network'}). Check the server, access key, and database.`
    : 'Request failed. Please try again.'

  async function loadData() {
    try {
      const [s, g, a] = await Promise.all([
        axios.get<{ students: Student[] }>(`${base}/api/faculty/students`, config()),
        axios.get<Grade[]>(`${base}/api/faculty/grades`, config()),
        axios.get<Announcement[]>(`${base}/api/faculty/announcements`, config()),
      ])
      setStudents(s.data.students)
      setGrades(g.data)
      setAnnouncements(a.data)
      setConnected(true)
      setNotice('Faculty records are up to date.')
    } catch (error) { setConnected(false); setNotice(errorText(error)) }
  }
  async function loadTranscript(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const response = await axios.get<unknown>(`${base}/api/faculty/transcripts/${encodeURIComponent(transcriptId)}`, config())
      setTranscript(response.data)
      setNotice('Transcript loaded.')
    } catch (error) { setTranscript(null); setNotice(errorText(error)) }
  }
  async function saveGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await axios.post(`${base}/api/faculty/grades`, { studentId: Number(studentId), course, grade }, config())
      await loadData()
      setNotice('Grade saved successfully.')
    } catch (error) { setNotice(errorText(error)) }
  }
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await axios.post(`${base}/api/faculty/announcements`, { course: announcementCourse, message }, config())
      setMessage('')
      await loadData()
      setNotice('Announcement published successfully.')
    } catch (error) { setNotice(errorText(error)) }
  }
  const matches = students.filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <main id="faculty-dashboard" style={{ background: '#f4faf5', minHeight: '100vh' }}>
      <div style={shell}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <p style={{ color: '#348b5c', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, fontWeight: 800, margin: '0 0 9px' }}>Faculty workspace</p>
            <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', margin: '0 0 8px', letterSpacing: -1.2 }}>Faculty Dashboard</h1>
            <p style={{ ...subtle, margin: 0 }}>Manage student records, grades, and course communication.</p>
          </div>
          <div style={{ ...card, padding: 16, width: 270 }}>
            <label htmlFor="faculty-token" style={label}>Faculty access key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="faculty-token" aria-label="Faculty access key" type="password" value={token} onChange={e => setToken(e.target.value)} style={{ ...field, minWidth: 0, flex: 1 }} />
              <button type="button" onClick={() => void loadData()} style={button}>Connect</button>
            </div>
            <p style={{ fontSize: 12, color: connected ? '#147d55' : '#64748b', margin: '9px 0 0' }}>{connected ? '● Connected' : '○ Not connected'}</p>
          </div>
        </header>

        <div role="status" style={{ background: '#e3f4e8', color: '#225f3c', borderRadius: 11, padding: '12px 16px', fontSize: 14, marginBottom: 24 }}>{notice}</div>

        <nav aria-label="Faculty sections" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
          {[
            ['#class-rosters', 'Class Rosters'], ['#faculty-transcript', 'Transcripts'],
            ['#grading', 'Grading'], ['#faculty-alerts', 'Announcements'],
          ].map(([href, text]) => <a key={href} href={href} style={{ textDecoration: 'none', background: '#fff', color: '#276c45', padding: '10px 14px', border: '1px solid #d8e9dc', borderRadius: 10, fontWeight: 650, fontSize: 13 }}>{text}</a>)}
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 22 }}>
          <section id="class-rosters" style={card}>
            <h2 style={sectionTitle}>Class Rosters</h2>
            <p style={subtle}>Find students in your directory.</p>
            <label htmlFor="faculty-search" style={label}>Search by student name</label>
            <input id="faculty-search" style={field} placeholder="Start typing a name..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ marginTop: 16, maxHeight: 235, overflowY: 'auto' }}>
              {!connected ? <p style={subtle}>Connect to view student records.</p> : matches.length === 0 ? <p style={subtle}>No students found.</p> : matches.map(s => <div key={s.id} style={item}><strong>{s.name}</strong><span style={{ float: 'right', color: '#64748b' }}>ID {s.id}</span></div>)}
            </div>
          </section>

          <section id="faculty-transcript" style={card}>
            <h2 style={sectionTitle}>Student Transcripts</h2>
            <p style={subtle}>Review an academic transcript by student ID.</p>
            <form onSubmit={loadTranscript}>
              <label htmlFor="faculty-transcript-id" style={label}>Four-digit student ID</label>
              <input id="faculty-transcript-id" style={field} value={transcriptId} onChange={e => setTranscriptId(e.target.value)} pattern="[0-9]{4}" required />
              <button type="submit" style={{ ...button, marginTop: 13 }}>View Transcript</button>
            </form>
            {transcript !== null && <pre style={{ background: '#f5f7fb', borderRadius: 10, padding: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 260, overflowY: 'auto', fontSize: 12 }}>{JSON.stringify(transcript, null, 2)}</pre>}
          </section>

          <section id="grading" style={card}>
            <h2 style={sectionTitle}>Grade Management</h2>
            <p style={subtle}>Add or update a student's course grade.</p>
            <form onSubmit={saveGrade} style={{ display: 'grid', gap: 14 }}>
              <div><label htmlFor="faculty-grade-student" style={label}>Student database ID</label><input id="faculty-grade-student" style={field} type="number" min="1" required placeholder="Enter student ID" value={studentId} onChange={e => setStudentId(e.target.value)} /></div>
              <div><label htmlFor="faculty-grade-course" style={label}>Course</label><input id="faculty-grade-course" style={field} required value={course} onChange={e => setCourse(e.target.value)} /></div>
              <div><label htmlFor="faculty-grade-value" style={label}>Grade</label><select id="faculty-grade-value" style={field} value={grade} onChange={e => setGrade(e.target.value)}>{['A','B','C','D','F'].map(g => <option key={g}>{g}</option>)}</select></div>
              <button type="submit" style={button}>Save Grade</button>
            </form>
            <div style={{ marginTop: 15, maxHeight: 200, overflowY: 'auto' }}>{grades.map(g => <div key={g.id} style={item}>Student {g.student_id} · {g.course}<strong style={{ float: 'right' }}>{g.grade}</strong></div>)}</div>
          </section>

          <section id="faculty-alerts" style={card}>
            <h2 style={sectionTitle}>Announcements</h2>
            <p style={subtle}>Create updates for your courses.</p>
            <form onSubmit={publish} style={{ display: 'grid', gap: 14 }}>
              <div><label htmlFor="faculty-announcement-course" style={label}>Course</label><input id="faculty-announcement-course" style={field} required value={announcementCourse} onChange={e => setAnnouncementCourse(e.target.value)} /></div>
              <div><label htmlFor="faculty-announcement-message" style={label}>Announcement message</label><textarea id="faculty-announcement-message" style={{ ...field, minHeight: 100, resize: 'vertical' }} placeholder="Write your announcement..." required value={message} onChange={e => setMessage(e.target.value)} /></div>
              <button type="submit" style={button}>Publish Announcement</button>
            </form>
            <div style={{ marginTop: 15, maxHeight: 200, overflowY: 'auto' }}>{announcements.map(a => <div key={a.id} style={item}><strong>{a.course}</strong><p style={{ margin: '5px 0 0', color: '#567465' }}>{a.message}</p></div>)}</div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Dashboardfaculty
