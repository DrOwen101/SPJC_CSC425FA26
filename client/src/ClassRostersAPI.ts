

import axios from 'axios'

// The form sends these fields when creating or updating a student.
export type AttendanceRecordInput = {
  courseID: number
  date: string
  attendanceNumber: number
}

// A saved student also has an ID, major name, and database timestamps.
export type AttendanceRecord = AttendanceRecordInput & {
  courseID: number
  date: string
  attendanceNumber: number
}

// Use the Vite proxy locally, or a configured API origin when deployed.
const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api`,
  timeout: 15000,
})

// These checks validate actual JSON. TypeScript types alone cannot validate
// data received over the network. "value is ..." tells TypeScript what we checked.
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAttendanceRecord(value: unknown): value is AttendanceRecord {
  if (!isObject(value)) return false

  return Number.isInteger(value.courseID)
    && Number.isInteger(value.attendanceNumber)
    && typeof value.date === 'string'
    && !Number.isNaN(Date.parse(value.date))
}

function readAttendanceRecord(data: unknown): AttendanceRecord {
  if (!isObject(data) || !isAttendanceRecord(data.attendanceRecord)) {
    throw new Error('The API returned an unexpected student record.')
  }
  return data.attendanceRecord
}

export async function listAttendanceRecords(signal?: AbortSignal): Promise<AttendanceRecord[]> {
  const response = await api.get<unknown>('/attendanceRecords', { signal })
  const data = response.data

  if (!isObject(data) || !Array.isArray(data.attendanceRecords) || !data.attendanceRecords.every(isAttendanceRecord)) {
    throw new Error('The API returned an unexpected attendance-record list.')
  }
  return data.attendanceRecords
}

export async function getAttendanceRecord(id: number, signal?: AbortSignal): Promise<AttendanceRecord> {
  const response = await api.get<unknown>(`/attendanceRecords/${id}`, { signal })
  return readAttendanceRecord(response.data)
}

export async function createAttendanceRecord(attendanceRecord: AttendanceRecordInput): Promise<AttendanceRecord> {
  const response = await api.post<unknown>('/attendanceRecords', attendanceRecord)
  return readAttendanceRecord(response.data)
}

export async function updateAttendanceRecord(id: number, attendanceRecord: AttendanceRecordInput): Promise<AttendanceRecord> {
  const response = await api.put<unknown>(`/students/${id}`, attendanceRecord)
  return readAttendanceRecord(response.data)
}

export async function deleteAttendanceRecord(id: number): Promise<void> {
  await api.delete(`/attendanceRecords/${id}`)
}

export function attendanceRecordsError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (isObject(data) && typeof data.message === 'string') {
      return data.message
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Retrieve the record before retrying a change.'
    }
    return 'Unable to reach attendance records. Check that the backend is running.'
  }

  if (error instanceof Error) {
    return error.message
  }
  return 'Unable to complete the attendance-record request.'
}