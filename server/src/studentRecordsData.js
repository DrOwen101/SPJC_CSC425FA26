const columns = `s.studentid AS "studentID", s.firstname AS "firstName",
  s.lastname AS "lastName", s.major, s.courseid AS "courseID",
  s.email, s.enrollmentyear AS "enrollmentYear", s.isactive AS "isActive"`

const table = 'public.students s'

export function createStudentRecordsData(database) {
  return {
    async listStudents() {
      const result = await database.query(
        `SELECT ${columns} FROM ${table} ORDER BY s.studentid`,
      )
      return result.rows
    },
    async getStudent(id) {
      const result = await database.query(
        `SELECT ${columns} FROM ${table} WHERE s.studentid = $1`,
        [id],
      )
      return result.rows[0]
    },
    async createStudent(student) {
      const result = await database.query(
        `INSERT INTO public.students
          (firstname, lastname, major, courseid, email, enrollmentyear, isactive)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING studentid AS "studentID", firstname AS "firstName",
          lastname AS "lastName", major, courseid AS "courseID", email,
          enrollmentyear AS "enrollmentYear", isactive AS "isActive"`,
        [student.firstName, student.lastName, student.major, student.courseID,
          student.email, student.enrollmentYear, student.isActive],
      )
      return result.rows[0]
    },
    async updateStudent(id, student) {
      const result = await database.query(
        `UPDATE public.students
        SET firstname = $1, lastname = $2, major = $3, courseid = $4,
          email = $5, enrollmentyear = $6, isactive = $7
        WHERE studentid = $8
        RETURNING studentid AS "studentID", firstname AS "firstName",
          lastname AS "lastName", major, courseid AS "courseID", email,
          enrollmentyear AS "enrollmentYear", isactive AS "isActive"`,
        [student.firstName, student.lastName, student.major, student.courseID,
          student.email, student.enrollmentYear, student.isActive, id],
      )
      return result.rows[0]
    },
    async deleteStudent(id) {
      const result = await database.query(
        'DELETE FROM public.students WHERE studentid = $1 RETURNING studentid',
        [id],
      )
      return result.rowCount > 0
    },
  }
}
