import { useState } from 'react'
import './calculator.css'

const gradePoints = {
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
  F: 0.0,
}

function Calculator() {
  const [grade, setGrade] = useState('')
  const [grades, setGrades] = useState([])
  const [gpa, setGpa] = useState(null)
  const [error, setError] = useState('')

  function addGrade(event) {
    event.preventDefault()
    const newGrade = grade.trim().toUpperCase()

    if (gradePoints[newGrade] === undefined) {
      setError('Please enter a valid letter grade.')
      return
    }

    setGrades([...grades, newGrade])
    setGrade('')
    setGpa(null)
    setError('')
  }

  function calculateGpa() {
    if (grades.length === 0) {
      setError('Add at least one grade first.')
      return
    }

    const totalPoints = grades.reduce((total, currentGrade) => {
      return total + gradePoints[currentGrade]
    }, 0)

    setGpa((totalPoints / grades.length).toFixed(2))
    setError('')
  }

  const lowGpa = gpa !== null && Number(gpa) < 2.0

  return (
    <div className="calculator">
      <form className="calculator-form" onSubmit={addGrade}>
        <label htmlFor="grade-entry">Enter a letter grade</label>
        <div className="calculator-entry">
          <input
            id="grade-entry"
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
          />
          <button type="submit">Add Grade</button>
        </div>
      </form>

      {error && <p className="calculator-error">{error}</p>}

      {grades.length > 0 && (
        <ul className="grade-list">
          {grades.map((currentGrade, index) => (
            <li key={`${currentGrade}-${index}`}>
              <span>{currentGrade}</span>
              <span>{gradePoints[currentGrade]} points</span>
            </li>
          ))}
        </ul>
      )}

      <button className="calculate-button" type="button" onClick={calculateGpa}>
        Calculate GPA
      </button>

      <p className="calculator-result">GPA: {gpa ?? '--'}</p>
      {lowGpa && <p className="calculator-warning">Warning: Your GPA is low.</p>}
    </div>
  )
}

export default Calculator
