//Unused version of gpa calculator. The react version is the current version being used.

const gradePoints = {A: 4, B: 3, C: 2, D: 1, F: 0};

let grades = [];

function addGrade() {
  const input = document.getElementById("grades-input");
  const grade = input.value.trim().toUpperCase();

  if (!gradePoints.hasOwnProperty(grade)) {
    alert("Enter A, B, C, D, or F.");
    return;
  }

  grades.push(grade);

  document.querySelector("#grade-list").innerHTML = grades
    .map((enteredGrade, index) =>
      `<li>Grade ${index + 1}: ${enteredGrade} (${gradePoints[enteredGrade]} points)</li>`
    )
    .join("");

  input.value = "";
  input.focus();
}

function calculateGPA() {
  if (grades.length === 0) {
    document.querySelector("#gpa-result").textContent = "Add a grade first";
    return;
  }

  const totalPoints = grades.reduce(
    (total, grade) => total + gradePoints[grade],
    0
  );

  const gpa = totalPoints / grades.length;
  document.querySelector("#gpa-result").textContent = gpa.toFixed(2);
}

function resetGrades() {
  grades.length = 0;
  document.querySelector("#grade-list").innerHTML = "";
  document.querySelector("#gpa-result").textContent = "Not calculated";
}

window.addGrade = addGrade;
window.calculateGPA = calculateGPA;
window.resetGrades = resetGrades;
