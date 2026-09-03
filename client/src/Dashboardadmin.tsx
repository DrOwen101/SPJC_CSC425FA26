function DashboardAdmin() {
  return (
    <>
      <header>
        <h1>Admin Dashboard</h1>
        <p>University Administration Portal</p>

        <nav aria-label="Admin navigation">
          <a href="#enrollment">Enrollment Trends</a>
          <a href="#attendance">Attendance Concerns</a>
          <a href="#success">Student Success</a>
          <a href="#financials">Financial Aid</a>
          <a href="#users">User Management</a>
        </nav>
      </header>

      <main>
        <section id="enrollment">
          <h2>Enrollment Trends</h2>
          <p>View current enrollment trends.</p>
        </section>

        <section id="attendance">
          <h2>Attendance Concerns</h2>
          <p>Review students with excessive absences.</p>
        </section>

        <section id="success">
          <h2>Student Success</h2>
          <p>Track students' academic progress.</p>
        </section>

        <section id="financials">
          <h2>Financial Aid</h2>
          <p>View tuition, payments, scholarships, and balances.</p>
        </section>

        <section id="users">
          <h2>User Management</h2>
          <p>Manage student, faculty, and staff accounts.</p>
        </section>
      </main>
    </>
  )
}

export default DashboardAdmin