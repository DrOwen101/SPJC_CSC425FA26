import EnrollmentTrends from './Enrollmenttrends.png'

function ADashboard() {
  return (
    <>
      <header className="section">
        <h1>Admin Dashboard</h1>
        <p>University Admin Portal</p>

        <nav aria-label="Admin navigation">
          <ul className="section-sub">
            <li><a href="#enrollmentTrends">Enrollment Trends</a></li>
            <li><a href="#AttendanceConcerns">Attendance Concerns</a></li>
            <li><a href="#SSI">Student success indicators</a></li>
            <li><a href="#FinancialSummaries"> Financial Summaries</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="section" id="enrollmentTrends">
          <h2 className="section-title">Enrollment Trends</h2>
          <img className="section-sub" src={EnrollmentTrends} alt="EnrollmentTrend" width="fit-content" height="350px"></img>
        </section>
        
        <section className="section" id="AttendanceConcerns">
          <h2 className="section-title">Attendance Concerns</h2>
          <ul className="section-sub"> 
            <li><p> Remote Colleges</p></li>
            <li><p> Cost</p></li>
            <li><p> Perceived Value</p></li>
            <li><p> Health Problems</p></li>
          </ul>
        </section>

        <section className="section" id="SSI">
          <h2 className="section-title">Student success indicators</h2>
          <ul className="section-sub">
            <li><p>Academic Performance</p></li>
              <ul>
                <li><p>Rate at which students are earning credits</p></li>
              </ul>
            <li><p>Student Engagement</p></li>
              <ul>
                <li><p>How connected a student is with campus communitys</p></li>
              </ul>
            <li><p>Support Services Utilization</p></li>
              <ul>
                <li><p>How often a student connects with campus services (acadmeic advisor, career services, wellnes center) </p></li>
              </ul>
          </ul>
        </section>

        <section className="section" id="FinancialSummaries">
          <h2 className="section-title">Financial Summaries</h2>
          <ul className="section-sub">
            <li><p>Estimated Total Cost</p></li>
            <ul>
              <li><p>Tution, Housing, Food</p></li>
            </ul>
            <li><p>Grants & Scholarships</p></li>
            <ul>
              <li><p>Gift aid that doesnt get paid back</p></li>
            </ul>
            <li><p>Student Loan Eligibility</p></li>
            <ul>
              <li><p>Federal student loans</p></li>
            </ul>
            <li><p>Out of Pocket</p></li>
            <ul>
              <li><p>Balance to be paid via savings or payment plan</p></li>
            </ul>
          </ul>
        </section>
      </main>
    </>
  )
}

export default ADashboard
