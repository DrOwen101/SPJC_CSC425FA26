
const grade_lookup = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
}


let grades = []


export function addGrade() {
	const gradeInput = document.getElementById('grade-entry')
    let get_input = gradeInput.value

    if (!get_input || !grade_lookup.hasOwnProperty(get_input)) {
        alert('Please enter a valid grade (A, B, C, D, F).')
        return
    }

	if (gradeInput instanceof HTMLInputElement) {
        //get_input = gradeInput.value
        grades.push(get_input)
		gradeInput.value = ''
	}

	updateGradesList()
}

export function clearList() {
    grades = []
    updateGradesList()
    clearGpa()
}

function clearGpa() {
    const gpaResult = document.getElementById('gpa-result')
    if (gpaResult) {
        gpaResult.textContent = ''
    }
}

function updateGradesList() {
	const gradesList = document.getElementById('grades-list')
    let output = ''
	clearGpa()

    if (gradesList) {
        gradesList.innerHTML = output
    }

    if (grades.length === 0) {
        return
    }

    for (let i = 0; i < grades.length; i++) {
        output += `<li>${grades[i]}</li>`
    }
    if (gradesList) {
        gradesList.innerHTML = output
    }
}

export function calculateGPA() {
    if (grades.length === 0) return
    let total = 0.0

    for (let i = 0; i < grades.length; i++) {
        total += grade_lookup[grades[i]] || 0
    }
    const gpa = total / grades.length
    const gpaResult = document.getElementById('gpa-result')
    if (gpaResult) {
        gpaResult.textContent = `Your GPA is ${gpa.toFixed(2)}`
    }
}
