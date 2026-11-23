import axios from 'axios'

const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const api = axios.create({
  baseURL: `${origin}/api`,
  timeout: 10000,
})

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function verifyInstructorCode(code: string): Promise<boolean> {
  try {
    const response = await api.post<unknown>('/auth/instructor-code', { code })
    if (!isObject(response.data) || typeof response.data.valid !== 'boolean') {
      throw new Error('The server returned an unexpected instructor-code response.')
    }
    return response.data.valid
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return false
    }
    throw error
  }
}
