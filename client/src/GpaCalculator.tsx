import { useState, type SubmitEvent } from 'react'

// Each letter grade maps to its value on a standard 4.0 GPA scale.
const gradePoints: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    'D-': 0.7,
    F: 0,
}

export default function GpaCalculator(){
    
    const [gradeEntry, setGradeEntry] = useState('')
    const [grades, setGrades] = useState<string[]>([])
    const [gpa, setGpa] = useState<number | null>(null)
    const [gradeError, setGradeError] = useState('')

    function addGrade(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()

        // Removing spaces and capitalizing lets entries such as "b +" become "B+".
        const newGrade = gradeEntry.trim().toUpperCase().replaceAll(' ', '')

        if (!(newGrade in gradePoints)) {
        setGradeError('Enter a valid letter grade from A+ through F.')
        return
        }

        setGrades([...grades, newGrade])
        setGradeEntry('')
        setGradeError('')
        setGpa(null)
  }

  function calculateGpa() {
    const totalPoints = grades.reduce((total, grade) => total + gradePoints[grade], 0)
    setGpa(totalPoints / grades.length)
  }
    
    return(
        <section id="gpa" className="dashboard-card" aria-labelledby="gpa-heading" tabIndex={-1}>
          <h2 id="gpa-heading">GPA</h2>
          <p id="gpa-value" className="metric" aria-live="polite">
            {gpa === null ? '--' : gpa.toFixed(2)}
          </p>
          <p>Calculated GPA · equal weight per grade</p>

          <form className="gpa-form" onSubmit={addGrade} noValidate>
            <label htmlFor="grade-entry">Enter a letter grade</label>
            <div className="gpa-entry-row">
              <input
                id="grade-entry"
                name="grade"
                type="text"
                value={gradeEntry}
                onChange={(event) => setGradeEntry(event.target.value)}
                placeholder="A-"
                maxLength={3}
                autoComplete="off"
                aria-describedby={gradeError ? 'grade-help grade-error' : 'grade-help'}
                aria-invalid={gradeError ? true : undefined}
              />
              <button type="submit">Add Grade</button>
            </div>
            <p id="grade-help" className="field-help">Accepted grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, and F.</p>
            {gradeError && <p id="grade-error" className="field-error" role="alert">{gradeError}</p>}
          </form>

          <div className="grade-list-area">
            <h3>Grades entered</h3>
            {grades.length === 0 ? (
              <p>No grades entered yet.</p>
            ) : (
              <ol className="grade-list">
                {grades.map((grade, index) => (
                  <li key={`${grade}-${index}`}>
                    <span>{grade}</span>
                    <span>{gradePoints[grade].toFixed(1)} points</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <button className="calculate-button" type="button" onClick={calculateGpa} disabled={grades.length === 0}>
            Calculate GPA
          </button>
        </section>
    )
}