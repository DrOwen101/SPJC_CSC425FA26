import axios from 'axios'
import { apiBaseUrl } from './apiBaseUrl'

export type DashboardRecord = Record<string, string | number | boolean | null>
export type Option = { value: string; label: string }
export type Field = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'checkbox' | 'select'
  options?: Option[]
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  immutable?: boolean
}
export const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
export const gradePoints: Record<string, number> = { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 }
export const options = (values: string[]): Option[] => values.map((value) => ({ value, label: value }))
export const dashboardApi = axios.create({ baseURL: apiBaseUrl, timeout: 15000 })

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please retry.'
    return 'Unable to reach the API. Check that the backend and PostgreSQL are running, then retry.'
  }
  return error instanceof Error ? error.message : 'The request failed. Please retry.'
}
export function readRecords(value: unknown, key = 'records'): DashboardRecord[] {
  if (typeof value !== 'object' || value === null || !(key in value)) throw new Error('Unexpected API response.')
  const rows = (value as Record<string, unknown>)[key]
  if (!Array.isArray(rows) || !rows.every((row: unknown) => typeof row === 'object' && row !== null
    && ('id' in row || 'studentID' in row)
    && Object.values(row).every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v)))) {
    throw new Error('Unexpected API records.')
  }
  return rows as DashboardRecord[]
}
