import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="admin-dashboard">
      <header>
        <div className="logo">SPJC Admin Portal</div>
        <h1>System Administration</h1>
      </header>

      <main>
        <section id="admin-management">
          <h2>User Management</h2>
          <article>
            <h3>Account Controls</h3>
            <p>Manage student, faculty, and staff role permissions</p>
          </article>
        </section>

        <section id="system-settings">
          <h2>System Operations</h2>
          <article>
            <h3>Course Catalogs</h3>
            <p>Active term semester schedules and listings</p>
          </article>
          <article>
            <h3>System Status</h3>
            <p>All core services operational</p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;