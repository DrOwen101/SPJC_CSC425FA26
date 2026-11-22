import { useEffect, useId, useState } from 'react'
import axios from 'axios'
import './TranscriptCard.css'

type Student = {
  student_id: number
  first_name: string
  last_name: string
}

type Grade = {
  assessment_name: string
  max_points: number
  score: number | null
}

type Report = {
  student: Student
  grades: Grade[]
  current_percentage: number | null
}

type Props = {
  id?: string
  sectionId: number | null
  refreshKey: number
}

const API = 'http://localhost:3000/api/faculty'

/**
 * Faculty adaptation of the Transcript Card.
 * Displays a section-specific academic record for an enrolled student.
 */
export default function FacultyTranscriptView({
  id = 'faculty-transcript',
  sectionId,
  refreshKey,
}: Props) {
  const labelId = useId()
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState<number | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Retrieve students enrolled in the selected section.
  useEffect(() => {
    setStudents([])
    setStudentId(null)
    setReport(null)
    setError('')

    if (sectionId === null) return

    const controller = new AbortController()

    axios.get<{ students: Student[] }>(
      `${API}/sections/${sectionId}/students`,
      {
        withCredentials: true,
        signal: controller.signal,
      }
    )
      .then(({ data }) => {
        if (controller.signal.aborted) return

        setStudents(data.students)
        setStudentId(data.students[0]?.student_id ?? null)
      })
      .catch((err) => {
        if (!controller.signal.aborted && !axios.isCancel(err)) {
          setError('Unable to load enrolled students.')
        }
      })

    return () => controller.abort()
  }, [sectionId])

  // Retrieve the selected student's section academic record.
  useEffect(() => {
    setReport(null)

    if (sectionId === null || studentId === null) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    axios.get<Report>(
      `${API}/sections/${sectionId}/students/${studentId}/grade-report`,
      {
        withCredentials: true,
        signal: controller.signal,
      }
    )
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setReport(data)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && !axios.isCancel(err)) {
          setError('Unable to load this student’s section record.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [sectionId, studentId, refreshKey])

  return (
    <section
      id={id}
      className="transcript-card"
      aria-labelledby={`${labelId}-heading`}
      tabIndex={-1}
    >
      <h2 id={`${labelId}-heading`}>
        Transcript Card — Section Record
      </h2>

      <p>
        Review assessment results for students enrolled in your
        selected section.
      </p>

      <p className="transcript-card-help">
        Section-only academic record, not a full or official transcript.
      </p>

      {sectionId === null ? (
        <p>Select an assigned section above.</p>
      ) : (
        <>
          <label htmlFor={`${labelId}-student`}>
            Enrolled student
          </label>

          <div className="transcript-card-controls">
            <select
              id={`${labelId}-student`}
              value={studentId ?? ''}
              onChange={(event) =>
                setStudentId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
            >
              {students.length === 0 && (
                <option value="">No enrolled students</option>
              )}

              {students.map((student) => (
                <option
                  key={student.student_id}
                  value={student.student_id}
                >
                  {student.first_name} {student.last_name}
                  {' '}(#{student.student_id})
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <p role="status">
              Loading student academic record...
            </p>
          )}

          {error && (
            <p className="transcript-card-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && report && (
            <div className="transcript-card-record">
              <header>
                <h3>
                  {report.student.first_name}{' '}
                  {report.student.last_name}
                </h3>

                <p>Student ID: {report.student.student_id}</p>
              </header>

              <div className="transcript-card-semester">
                <div
                  className="transcript-card-table-scroll"
                  role="region"
                  aria-label="Section assessment results"
                  tabIndex={0}
                >
                  <table>
                    <caption>Section Assessments</caption>

                    <thead>
                      <tr>
                        <th scope="col">Assessment</th>
                        <th scope="col">Score</th>
                        <th scope="col">Possible</th>
                        <th scope="col">Percent</th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.grades.map((grade, index) => (
                        <tr key={index}>
                          <th scope="row">
                            {grade.assessment_name}
                          </th>

                          <td>
                            {grade.score ?? 'Not graded'}
                          </td>

                          <td>{grade.max_points}</td>

                          <td>
                            {grade.score === null
                              ? '—'
                              : `${(
                                  100 *
                                  grade.score /
                                  grade.max_points
                                ).toFixed(1)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {report.grades.length === 0 && (
                  <p>
                    No assessments have been created for this section.
                  </p>
                )}
              </div>

              <dl className="transcript-card-summary">
                <div>
                  <dt>Current Section Grade</dt>
                  <dd>
                    {report.current_percentage === null
                      ? 'Not graded'
                      : `${report.current_percentage.toFixed(2)}%`}
                  </dd>
                </div>
              </dl>

              <p className="transcript-card-help">
                Ungraded assessments are excluded from the
                current percentage.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}