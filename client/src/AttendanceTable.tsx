import type { ReactNode } from 'react'
import RecordTable from './RecordTable'

export default function AttendanceTable<T extends { studentId: number; fullName: string }>({
  rows, caption, columns, renderDetails, rowKey, regionLabel = caption,
}: {
  rows: T[]; caption: string; columns: string[]
  renderDetails: (row: T) => ReactNode
  rowKey?: (row: T) => string; regionLabel?: string
}) {
  return (
    <RecordTable caption={caption} regionLabel={regionLabel} columns={['ID', 'Student', ...columns]}>
      {rows.map((row) => (
        <tr key={rowKey ? rowKey(row) : row.studentId}>
          <td>{row.studentId}</td><th scope="row">{row.fullName}</th>{renderDetails(row)}
        </tr>
      ))}
    </RecordTable>
  )
}
