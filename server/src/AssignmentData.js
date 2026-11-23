const assignmentColumns = `s.id,
    s.section_id,
    s.title,
    s.instructions,
    s.due_at,
    s.max_points,
    s.is_published`

const assignmentTable = 'student_dashboard.assignments s '

export function createAssignmentData(database){
    return{
        async listAssignments(){
            const result = await database.query(
                `SELECT ${assignmentColumns} FROM ${assignmentTable}
                ORDER BY s.id`
            )
            return result.rows
        },
        
        async getAssignment(id){
            const result = await database.query(
                `SELECT ${assignmentColumns} FROM ${assignmentTable} WHERE s.id = $1`,
                [id]
            )
            return result.rows[0]
        },

        async createAssignment(assignment){
            const result = await database.query(
                `INSERT INTO student_dashboard.assignments
                    (section_id, title, instructions, due_at, max_points, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, section_id, title, instructions, due_at, max_points, is_published`,
                [assignment.section_id, assignment.title, assignment.instructions, assignment.due_at, assignment.max_points, assignment.is_published]
            )
            return result.rows[0]
        },
        
        async updateAssignment(id, assignment){
            const result = await database.query(
                `UPDATE student_dashboard.assignments
                 SET section_id = $1,
                     title = $2,
                     instructions = $3,
                     due_at = $4,
                     max_points = $5,
                     is_published = $6,
                     updated_at = clock_timestamp()
                 WHERE id = $7
                 RETURNING id, section_id, title, instructions, due_at, max_points, is_published`,
                [assignment.section_id, assignment.title, assignment.instructions, assignment.due_at, assignment.max_points, assignment.is_published, id]
            )
            return result.rows[0]
        },

        async deleteAssignment(id){
            const result = await database.query(
                `DELETE FROM student_dashboard.assignments
                WHERE id=$1
                RETURNING id`,
                [id]
            )
            return result.rows.length > 0
        },
    }
}