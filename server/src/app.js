import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { checkDatabase } from './db.js'
import { createStudentRecordsRouter } from './studentRecordsRoutes.js'
import { createAcademicRouter } from './academicRoutes.js'

export const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use('/api', createAcademicRouter())
app.use('/api/dashboard', createStudentRecordsRouter())
app.use(express.json())

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description: 'Student records and transcripts stored in PostgreSQL.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1',
      transcriptQuery: '/api/transcripts?name=Avery%20Morgan',
      status: '/api/status',
      databaseHealth: '/api/health',
      studentRecords: '/api/dashboard/students',
      majors: '/api/dashboard/majors',
    },
  })
})

app.get('/api/health', async (_request, response) => {
  try {
    const database = await checkDatabase()
    response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
  } catch (error) {
    console.error('Database health check failed:', error.code || error.name)
    response.status(503).json({ status: 'error', database: 'disconnected', message: 'Database unavailable. Check the server database configuration.' })
  }
})
