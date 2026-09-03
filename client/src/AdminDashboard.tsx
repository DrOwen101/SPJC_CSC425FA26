import SPJCLogo from './assets/SPJCLogo.jpg'

function AdminDashboard() {
  return (
    <>
      <header>
        <img
          src={SPJCLogo}
          width="100"
          alt="SPJC logo"
        />
        <h1>Admin Dashboard</h1>
      </header>

      <main>
        <section>
          <h2>Courses</h2>

          <article>
            <h3>User Management</h3>
            <p>User management information will appear here.</p>
          </article>

          <article>
            <h3>System Settings</h3>
            <p>System settings will appear here.</p>
          </article>

          <article>
            <h3>Reports</h3>
            <p>Administrative reports will appear here.</p>
          </article>
        </section>
      </main>
    </>
  )
}

export default AdminDashboard