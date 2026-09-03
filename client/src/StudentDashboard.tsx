import React from 'react';

export const StudentDashboard: React.FC = () => {
  return (
    <div className="student-dashboard">
      <header>
        <div className="logo">SPJC Student Portal</div>
        <h1>Student Dashboard</h1>
      </header>

      <main>
        <section id="student-overview">
          <h2>Academic Overview</h2>
          <article>
            <h3>Current GPA</h3>
            <p>3.85 Cumulative</p>
          </article>
          <article>
            <h3>Attendance Record</h3>
            <p>96% Present</p>
          </article>
        </section>

        <section id="student-courses">
          <h2>Enrolled Courses</h2>
          <article>
            <h3>CSC 425 - Web App & Services Dev</h3>
            <p>Instructor: Dr. Jason Owen</p>
          </article>
          <article>
            <h3>CSC 310 - Database Management Systems</h3>
            <p>Status: In Progress</p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;