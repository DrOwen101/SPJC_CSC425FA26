let grades = []


export function addGrade() {
	const gradeInput = document.getElementById('grade-entry')

	if (gradeInput instanceof HTMLInputElement) {
		gradeInput.value = ''
	}

	console.debug('Add Grade button pressed')
}
