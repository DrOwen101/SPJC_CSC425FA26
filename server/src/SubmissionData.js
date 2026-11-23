const assignmentColumns=`s.id
s.assignment_id AS "assignmentID", 
s.enrollment_id AS "enrollmentID", 
s.section_id AS "sectionID", 
s.submitted_at AS "submittedAt", 
s.submission_text AS "submissionText",
s.attachment_key AS "attachmentKey", 
s.points_awared AS "pointsAwarded",
s.feedback AS "feedback",
s.graded_by AS "gradedBy",
s.graded_at AS "gradedAt"`

const submissionTable = 'student_dashboard.submissions s '

export function createSubmissionData(database){
    return{
        async listSubmissions(){
            const result = await database.query(
                `SELECT ${columns} FROM ${submissionTable}
                ORDER BY s.assignmentID`
            )
            return result.rows
        },

        async listSubmissions(section_id){
            const result = await database.query(
                `SELECT ${columns} FROM ${submissionTable} WHERE s.section_id = $1`,
                [section_id]
            )
            return result.rows
        },
        
        async getAssignment(id){
            const result = await database.query(
                `SELECT ${columns} FROM ${submissionTable} WHERE s.id = $1`,
                [id]
            )
            return result.rows
        },

        async createAssignment(submission){
            const result = await database.query(`WITH saved AS (
                INSERT INTO student_dashboard.submission
                (section_id, title, instructions, due_at, max_points, is_published)
                VALUES($1, $2, $3, $4, $5, $6) RETURNING *)
                SELECT ${columns} FROM saved s`,
                [submission.assignmentID, submission.enrollmentID, submission.sectionID, submission.submittedAt, submission.submissionText, submission.attachementKey, submission.pointsAwarded, submission.feedback, submission.gradedBy, submission.gradedAt])
            return result.row[0]
        },
        
        async updateAssignment(id, submission){
            const result = await database.query(`WITH saved AS (
                UPDATE student_dashboard.assignments
                SET section_id=$1, title = $2, instructions = $3, 
                due_at = $4,max_points = $5, is_published = $6, updated_at = clock_timestamp()
                WHERE id= $8 RETURNING *)
                SELECT ${columns} FROM saved s`,
                [submission.assignmentID, submission.enrollmentID, submission.sectionID, submission.submittedAt, submission.submissionText, submission.attachementKey, submission.pointsAwarded, submission.feedback, submission.gradedBy, submission.gradedAt, id])
                return result.row[0]
        },

        async deleteAssignment(id){
            const result = await database.query(
                `DELETE FROM student_dashboard.submission
                WHERE id=$1
                RETURNING id`,
                [id],)
            return result.rowCount>0
        },
    }
}