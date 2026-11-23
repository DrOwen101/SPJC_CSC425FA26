const columns = `s.course_id,
    s.term_id,
    s.section_number,
    s.instructor_id,
    s.grading_scheme_id,
    s.course_code_snapshot,
    s.title_snapshot,
    s.capacity,
    s.delivery_mode`

const courseTable = 'student_dashboard.course_sections s'

export function createCourse(database) {
    return {
        async listCourses() {
            const result = await database.query(
                `SELECT ${columns} FROM ${courseTable}
                ORDER BY s.course_id`)
            return result.rows
        },

        async getCourse(id) {
            const result = await database.query(
                `SELECT ${columns} FROM ${courseTable} WHERE s.id = $1`,
                [id]
            )
            return result.rows[0]
        }
    }
}