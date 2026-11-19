import type { ReactNode } from 'react'

type Props = {
  caption: string
  regionLabel: string
  columns: string[]
  children: ReactNode
}

// Shared with the student transcript and faculty record tables.
export default function RecordTable({ caption, regionLabel, columns, children }: Props) {
  return (
    <div className="transcript-card-table-scroll" role="region" aria-label={regionLabel} tabIndex={0}>
      <table>
        <caption>{caption}</caption>
        <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
