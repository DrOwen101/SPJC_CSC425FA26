import express from 'express'
import { pool } from './db.js'
import {createFaculty} from './facultyData.js'

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 })
}

export function createFacultyRouter(database=pool){
  const router = express.Router()
  const data = createFaculty(database)
  router.get('/status', async (_request, response) => {
        const courses = await data.listFaculty()
        response.json({ status: 'ok', service: 'Student database API', courseCount: courses.length })
  })

  router.get('/faculty', async (_request, response) => {
        response.json({ faculty: await data.listFaculty() })
  })
  
  router.get('/faculty/:id', async (request, response) => {
        if (!/^\d+$/.test(request.params.id)) throw invalid('Course section ID must be a positive integer.')
        const faculty = await data.getFaculty(Number(request.params.id))
        if (!faculty) return response.status(404).json({ error: 'NOT_FOUND', message: 'Faculty not found.' })
        response.json({ faculty })
  })
  router.use((error, _request, response, _next) => {
        if (error.status === 400) return response.status(400).json({ error: 'INVALID_INPUT', message: error.message })
        console.error('Academic database request failed:', error.code || error.name)
        response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Faculty data is unavailable. Check PostgreSQL and run database setup.' })
    })
  return router
}