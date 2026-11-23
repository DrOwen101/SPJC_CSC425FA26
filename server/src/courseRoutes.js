import express from 'express'
import { pool } from './db.js'
import {createCourse} from './courseData.js'

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 })
}

export function createCourseRouter(database=pool){
    const router = express.Router()
    const data = createCourse(database)
    router.get('/status', async (_request, response) => {
        const courses = await data.listCourses()
        response.json({ status: 'ok', service: 'Student database API', courseCount: courses.length })
    })
  router.get('/course_sections', async (_request, response) => {
        response.json({ courses: await data.listCourses() })
    })
  router.get('/course_sections/:id', async (request, response) => {
        if (!/^\d+$/.test(request.params.id)) throw invalid('Course section ID must be a positive integer.')
        const course = await data.getCourse(Number(request.params.id))
        if (!course) return response.status(404).json({ error: 'NOT_FOUND', message: 'Course section not found.' })
        response.json({ course })
    })
  router.use((error, _request, response, _next) => {
        if (error.status === 400) return response.status(400).json({ error: 'INVALID_INPUT', message: error.message })
        console.error('Academic database request failed:', error.code || error.name)
        response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Course data is unavailable. Check PostgreSQL and run database setup.' })
    })
  return router
}
