import { useEffect, useId, useState, type SubmitEvent } from 'react'
import axios from 'axios'
import './ClassRosters.css'
import { isTranscript } from './transcriptApi'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || `${window.location.protocol}//${window.location.hostname}:3000`

type RosterStudent = {
  studentID: string
  firstName: string
  lastName: string
  term: string
  grade: string
  termGPA: number
  cumulativeGPA: number
}

type CourseRoster = {
  courseCode: string
  courseTitle: string
  students: RosterStudent[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCourseRoster(value: unknown): value is CourseRoster {
  return isRecord(value)
    && typeof value.courseCode === 'string'
    && typeof value.courseTitle === 'string'
    && Array.isArray(value.students)
    && value.students.every((student: unknown) =>
      isRecord(student)
      && typeof student.studentID === 'string'
      && typeof student.firstName === 'string'
      && typeof student.lastName === 'string'
      && typeof student.term === 'string'
      && typeof student.grade === 'string'
      && typeof student.termGPA === 'number'
      && Number.isFinite(student.termGPA)
      && typeof student.cumulativeGPA === 'number'
      && Number.isFinite(student.cumulativeGPA),
    )
}

function getStudentKey(student: Pick<RosterStudent, 'studentID' | 'term'>) {
  return `${student.studentID}-${student.term}`
}

function ClassRosters() {
  const labelId = useId()
  const [classCode, setClassCode] = useState('')
  const [inputError, setInputError] = useState('')
  const [request, setRequest] = useState<{ courseCode: string } | null>(null)
  const [result, setResult] = useState({
    roster: null as CourseRoster | null,
    isLoading: false,
    error: '',
  })
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState('')
  const [saveMessages, setSaveMessages] = useState<Record<string, { type: 'saving' | 'success' | 'error'; text: string }>>({})
  const { roster, isLoading, error } = result

  useEffect(() => {
    if (!request) return

    const requestedCourse = request
    const controller = new AbortController()
    setResult({ roster: null, isLoading: true, error: '' })

    async function getRoster() {
      try {
        const response = await axios.get<unknown>(
          `${apiBaseUrl.replace(/\/$/, '')}/api/rosters/${encodeURIComponent(requestedCourse.courseCode)}`,
          { signal: controller.signal, timeout: 15000 },
        )
        if (controller.signal.aborted) return
        if (!isCourseRoster(response.data) || response.data.courseCode !== requestedCourse.courseCode) {
          throw new Error('The roster service returned unexpected data. Please try again.')
        }
        const drafts: Record<string, string> = {}
        response.data.students.forEach((student) => {
          drafts[getStudentKey(student)] = student.grade
        })
        setGradeDrafts(drafts)
        setSaveMessages({})
        setResult({ roster: response.data, isLoading: false, error: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return
        let message = 'Unable to load the class roster. Please try again.'
        if (axios.isAxiosError(requestError)) {
          const status = requestError.response?.status
          if (requestError.code === 'ECONNABORTED') {
            message = 'The roster request timed out. Please try again.'
          } else if (status === 404) {
            message = `No class was found with course code ${requestedCourse.courseCode}.`
          } else if (status) {
            message = `The roster request failed (HTTP ${status}). Please try again.`
          } else {
            message = 'Unable to reach the transcript service. Check your connection and try again.'
          }
        } else if (requestError instanceof Error) {
          message = requestError.message
        }
        setResult({ roster: null, isLoading: false, error: message })
      }
    }

    void getRoster()
    return () => controller.abort()
  }, [request])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading || savingKey) return

    const courseCode = classCode.trim().replace(/\s+/g, ' ').toUpperCase()
    if (!/^[A-Z]{3} \d{3}$/.test(courseCode)) {
      setInputError('Enter a course code such as CSC 101.')
      return
    }

    setInputError('')
    setClassCode(courseCode)
    setRequest({ courseCode })
  }

  async function saveGrade(student: RosterStudent) {
    if (!roster || savingKey) return

    const key = getStudentKey(student)
    const grade = gradeDrafts[key] ?? student.grade
    if (grade === student.grade) return

    setSavingKey(key)
    setSaveMessages((current) => ({ ...current, [key]: { type: 'saving', text: 'Saving grade…' } }))

    try {
      const response = await axios.patch<unknown>(
        `${apiBaseUrl.replace(/\/$/, '')}/api/transcripts/${encodeURIComponent(student.studentID)}/grades`,
        { courseCode: roster.courseCode, term: student.term, grade },
        { timeout: 15000 },
      )
      const updatedTranscript = response.data
      if (!isTranscript(updatedTranscript) || updatedTranscript.studentID !== student.studentID) {
        throw new Error('The grade service returned an unexpected transcript.')
      }

      const updatedSemester = updatedTranscript.semesters.find((semester) => semester.term === student.term)
      const updatedCourse = updatedSemester?.courses.find((course) => course.courseCode === roster.courseCode)
      if (!updatedSemester || !updatedCourse || updatedCourse.grade !== grade) {
        throw new Error('The grade service response did not include the updated course.')
      }

      setResult((current) => current.roster
        ? {
            ...current,
            roster: {
              ...current.roster,
              students: current.roster.students.map((row) => getStudentKey(row) === key
                ? {
                    ...row,
                    grade: updatedCourse.grade,
                    termGPA: updatedSemester.gpa,
                    cumulativeGPA: updatedTranscript.summary.cumulativeGPA,
                  }
                : row),
            },
          }
        : current)
      setGradeDrafts((current) => ({ ...current, [key]: updatedCourse.grade }))
      setSaveMessages((current) => ({
        ...current,
        [key]: {
          type: 'success',
          text: `Saved.`,
        },
      }))
    } catch (saveError) {
      let message = 'Unable to save the grade. Please try again.'
      if (axios.isAxiosError(saveError)) {
        if (saveError.code === 'ECONNABORTED') {
          message = 'The grade update timed out. Please try again.'
        } else if (saveError.response?.status) {
          message = `The grade update failed (HTTP ${saveError.response.status}). Please try again.`
        } else {
          message = 'Unable to reach the transcript service. Check your connection and try again.'
        }
      } else if (saveError instanceof Error) {
        message = saveError.message
      }
      setSaveMessages((current) => ({ ...current, [key]: { type: 'error', text: message } }))
    } finally {
      setSavingKey('')
    }
  }

  let status = 'Enter a course code to view its roster.'
  if (isLoading) status = `Loading roster for ${request?.courseCode}…`
  else if (roster) status = `${roster.students.length} student${roster.students.length === 1 ? '' : 's'} found.`

  return (
    <section
      id="class-rosters"
      className="dashboard-card class-rosters"
      aria-labelledby="class-rosters-heading"
      tabIndex={-1}
    >
      <h2 id="class-rosters-heading">Class Rosters</h2>
      <p id={`${labelId}-help`}>Search by course code to see students and their grades in the mock transcript records.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${labelId}-course-code`}>Class code</label>
        <div className="class-rosters-controls">
          <input
            id={`${labelId}-course-code`}
            name="courseCode"
            type="text"
            autoComplete="off"
            placeholder="CSC 101"
            disabled={Boolean(savingKey)}
            value={classCode}
            onChange={(event) => {
              setClassCode(event.target.value)
              setInputError('')
            }}
            aria-describedby={`${labelId}-help${inputError ? ` ${labelId}-input-error` : ''}`}
            aria-invalid={inputError ? true : undefined}
          />
          <button type="submit" disabled={isLoading || Boolean(savingKey)}>{isLoading ? 'Searching…' : 'Search'}</button>
        </div>
        {inputError && <p className="class-rosters-error" id={`${labelId}-input-error`} role="alert">{inputError}</p>}
      </form>
      <p className="class-rosters-status" role="status">{status}</p>
      {error && <p className="class-rosters-error" role="alert">{error}</p>}
      {roster && (
        <div className="class-rosters-record">
          <h3>{roster.courseCode}: {roster.courseTitle}</h3>
          <div className="class-rosters-table-scroll" role="region" aria-label={`${roster.courseCode} roster`} tabIndex={0}>
            <table>
              <caption>Students and grades</caption>
              <thead>
                <tr>
                  <th scope="col">Student ID</th>
                  <th scope="col">Student</th>
                  <th scope="col">Term</th>
                  <th scope="col">Grade</th>
                </tr>
              </thead>
              <tbody>
                {roster.students.map((student) => (
                  <tr key={`${student.studentID}-${student.term}`}>
                    <th scope="row">{student.studentID}</th>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.term}</td>
                    <td>
                      <div className="class-rosters-grade-controls">
                        <label className="class-rosters-visually-hidden" htmlFor={`${labelId}-grade-${student.studentID}-${student.term.replace(/\s+/g, '-')}`}>
                          Grade for {student.firstName} {student.lastName}, {student.term}
                        </label>
                        <select
                          id={`${labelId}-grade-${student.studentID}-${student.term.replace(/\s+/g, '-')}`}
                          value={gradeDrafts[getStudentKey(student)] ?? student.grade}
                          disabled={Boolean(savingKey)}
                          onChange={(event) => {
                            const key = getStudentKey(student)
                            setGradeDrafts((current) => ({ ...current, [key]: event.target.value }))
                            setSaveMessages((current) => {
                              const next = { ...current }
                              delete next[key]
                              return next
                            })
                          }}
                        >
                          {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={Boolean(savingKey) || (gradeDrafts[getStudentKey(student)] ?? student.grade) === student.grade}
                          onClick={() => void saveGrade(student)}
                          aria-label={`Save grade for ${student.firstName} ${student.lastName}, ${student.term}`}
                        >
                          {savingKey === getStudentKey(student) ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                      {saveMessages[getStudentKey(student)] && (
                        <p
                          className={`class-rosters-save-message class-rosters-save-message-${saveMessages[getStudentKey(student)].type}`}
                          role={saveMessages[getStudentKey(student)].type === 'error' ? 'alert' : 'status'}
                        >
                          {saveMessages[getStudentKey(student)].text}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default ClassRosters
