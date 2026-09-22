// An object connects each valid letter grade to points on a 4.0 GPA scale.
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
  F: 0,
}

// These variables connect JavaScript to elements identified by IDs in the HTML.
const gradeForm = document.getElementById('grade-form')
const gradeEntry = document.getElementById('grade-entry')
const gradeError = document.getElementById('grade-error')
const gradeList = document.getElementById('grade-list')
const emptyListMessage = document.getElementById('empty-list-message')
const calculateButton = document.getElementById('calculate-button')
const gpaValue = document.getElementById('gpa-value')

// This array stores every valid grade entered while the page remains open.
const grades = []

// Render means showing the current JavaScript data in the HTML page.
function renderGradeList() {
  gradeList.replaceChildren()

  grades.forEach(function (grade) {
    const listItem = document.createElement('li')
    const gradeText = document.createElement('span')
    const pointsText = document.createElement('span')

    gradeText.textContent = grade
    pointsText.textContent = `${gradePoints[grade].toFixed(1)} points`

    listItem.append(gradeText, pointsText)
    gradeList.append(listItem)
  })

  emptyListMessage.hidden = grades.length > 0
  calculateButton.disabled = grades.length === 0
}

function showError(message) {
  gradeError.textContent = message
  gradeError.hidden = false
  gradeEntry.setAttribute('aria-invalid', 'true')
  gradeEntry.setAttribute('aria-describedby', 'grade-help grade-error')
}

function clearError() {
  gradeError.textContent = ''
  gradeError.hidden = true
  gradeEntry.removeAttribute('aria-invalid')
  gradeEntry.setAttribute('aria-describedby', 'grade-help')
}

// A form's submit event happens when the user presses Enter or clicks Add Grade.
gradeForm.addEventListener('submit', function (event) {
  event.preventDefault()

  const newGrade = gradeEntry.value.trim().toUpperCase().replaceAll(' ', '')

  if (!(newGrade in gradePoints)) {
    showError('Enter a valid letter grade from A+ through F.')
    return
  }

  grades.push(newGrade)
  gradeEntry.value = ''
  gpaValue.textContent = '--'

  clearError()
  renderGradeList()
  gradeEntry.focus()
})

calculateButton.addEventListener('click', function () {
  let totalPoints = 0

  grades.forEach(function (grade) {
    totalPoints += gradePoints[grade]
  })

  const gpa = totalPoints / grades.length
  gpaValue.textContent = gpa.toFixed(2)
})
