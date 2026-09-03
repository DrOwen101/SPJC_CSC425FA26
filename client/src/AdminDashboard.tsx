function AdminDashboard() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>SPJC Admin Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#student_management">Student Management</a>
          <a href="#course_management">Course Management</a>
          <a href="#enrollment">Enrollment</a>
          <a href="#attendance_concerns">Attendance Concerns</a>
          <a href="#financial_summary">Financial Summary</a>
        </nav>
      </header>

      <main>
        <section id="student_management">
          <h2>Student Management</h2>
          <p>Create, update, search, and view student records.</p>
        </section>

        <section id="course_management">
          <h2>Course Management</h2>
          <p>View courses, create sections, and assign instructors.</p>
        </section>

        <section id="enrollment">
          <h2>Enrollment</h2>
          <p>View student enrollment and current course registration.</p>
        </section>

        <section id="attendance_concerns">
          <h2>Attendance Concerns</h2>
          <p>View students who may have excessive absences.</p>
        </section>

        <section id="financial_summary">
          <h2>Financial Summary</h2>
          <p>View tuition charges, payments, scholarships, and outstanding balances.</p>
        </section>
      </main>
    </>
  )
}

export default AdminDashboard