function FDashboard() {
  return (
    <>
      <header>
        <h1>Faculty Dashboard</h1>
        <p>University Faculty Portal</p>

        <nav aria-label="Faculty navigation">
          <ul>
            <li><a href="#EnterGrade">Enter Grade</a></li>
            <li><a href="#EnterGrade">Change Grade</a></li>
            <li><a href="#EnterGrade">View Grade</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section id="EnterGrade">
          <h2>Enter Grade</h2>
        <form> 
          <input name="Assignment" /> Assignment Name <br />
          <input max="199" min="1" name="Grade" step="1" type="number" value="100" /> Grade for Assignment <br />
          <label><input name="terms" type="checkbox" value="tandc" /> Finalize</label> <br />
          <input type="submit" value="Submit" />
        </form>
        </section>

        <section>
          <h2>Change Grade</h2>
          <form>
            <select name='Assignment' defaultValue='none'>
              <option value="none">Assignments</option>
              <option value="assninment1"> Assignment1</option>
              <option value="assninment2"> Assignment2</option>
              <option value="assninment3"> Assignment3</option>
            </select><br />
            <input max="199" min="1" name="Grade" step="1" type="number" value="100" /> Grade for Assignment <br />
            <label><input name="terms" type="checkbox" value="tandc" /> Finalize</label> <br />
            <input type="submit" value="Submit" />
          </form>
        </section>

        <section>
          <h2>View Grades</h2>
          <form>
            <select name='Assignment' defaultValue='none'>
              <option value="none">Assignments</option>
              <option value="assninment1"> Assignment1</option>
              <option value="assninment2"> Assignment2</option>
              <option value="assninment3"> Assignment3</option>
            </select><br />
            <label><input name="terms" type="checkbox" value="tandc" /> Check Grade</label> <br />
            <input type="submit" value="Submit" />
          </form>
        </section>
      </main>
    </>
  )
}

export default FDashboard
