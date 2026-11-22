import axios from 'axios'

export type AttendanceRecord = {
  id: number
  studentId: string
  studentName: string
  date: string
  status: 'present' | 'absent' | 'late'
}

export const attendanceApi = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  timeout: 10000,
})
