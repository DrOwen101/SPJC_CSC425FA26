import type { ReactNode } from 'react'

export type DisplayStudent = {
  id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
}

type Props<T extends DisplayStudent> = {
  students: T[]
  extraHeaders?: ReactNode
  renderExtraCells?: (student: T) => ReactNode
}

/**
 * Shared student table used by both Student Records and Faculty Roster.
 * The parent component controls additional columns and permitted actions.
 */
export default function StudentRecordsTable<T extends DisplayStudent>({
  students,
  extraHeaders,
  renderExtraCells,
}: Props<T>) {
  return (
    <div className="student-records-table-wrapper">
      <table className="student-records-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Student</th>
            <th scope="col">Status</th>
            {extraHeaders}
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>

              <td>
                <strong>
                  {student.first_name} {student.last_name}
                </strong>
                <span className="student-records-email">
                  {student.email}
                </span>
              </td>

              <td>
                <span
                  className={
                    student.is_active
                      ? 'student-records-status active'
                      : 'student-records-status inactive'
                  }
                >
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>

              {renderExtraCells?.(student)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}