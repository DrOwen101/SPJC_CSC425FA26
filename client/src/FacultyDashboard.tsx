import React from 'react';

export const FacultyDashboard: React.FC = () => {
  return (
    <div className="faculty-dashboard">
      <header>
        <div className="logo">SPJC Faculty Portal</div>
        <h1>Faculty Dashboard</h1>
      </header>

      <main>
        <section id="faculty-courses">
          <h2>Assigned Courses</h2>
          <article>
            <h3>CSC 425 - Web App & Services Dev</h3>
            <p>Enrolled: 28 Students</p>
          </article>
        </section>

        <section id="faculty-actions">
          <h2>Grading & Submissions</h2>
          <article>
            <h3>Pending Lab Submissions</h3>
            <p>12 Assignments awaiting review</p>
          </article>
          <article>
            <h3>Class Roster</h3>
            <p>View and manage active student enrollments</p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default FacultyDashboard;