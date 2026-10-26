export type Attendance = {
  id: number
  studentId: string
  studentName: string
  date: string
  status: 'present' | 'absent' | 'late'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isAttendance(value: unknown): value is Attendance {
  return isObject(value)
    && typeof value.id === 'number'
    && typeof value.studentId === 'string'
    && typeof value.studentName === 'string'
    && typeof value.date === 'string'
    && (
      value.status === 'present'
      || value.status === 'absent'
      || value.status === 'late'
    )
}
