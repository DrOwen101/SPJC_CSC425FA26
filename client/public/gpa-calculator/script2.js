// OBJECT
// Stores each letter grade and its GPA point value
const gradePoints = {
  "A+": 4.0,
  "A": 4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D": 1.0,
  "D-": 0.7,
  "F": 0.0
};

// ARRAY
// Stores the grades entered by the user
let grades = [];

// FUNCTION: Add a grade
function addGrade() {
  let grade = document.getElementById("grade-entry").value;
  grade = grade.trim().toUpperCase();

  if (gradePoints[grade] !== undefined) {
    grades.push(grade);
    displayGrades();
    document.getElementById("grade-entry").value = "";
  } else {
    alert("Please enter a valid letter grade.");
  }
}

// FUNCTION: Display all grades
function displayGrades() {
  let output = "";

  for (let i = 0; i < grades.length; i++) {
    output += "<li>" +
      grades[i] +
      " = " +
      gradePoints[grades[i]] +
      " points</li>";
  }
  document.getElementById("grade-list").innerHTML = output;
}

// FUNCTION: Clear entered grades and calculated GPA
function clearGrades() {
  grades = [];
  document.getElementById("grade-list").innerHTML = "";
  document.getElementById("gpa-value").textContent = "--";
  document.getElementById("gpa-warning").textContent = "";
  document.getElementById("grade-entry").value = "";
}

// FUNCTION: Calculate the GPA
function calculateGPA() {
  let totalPoints = 0;

  for (let i = 0; i < grades.length; i++) {
    totalPoints = totalPoints + gradePoints[grades[i]];
  }

  let gpa = totalPoints / grades.length;
  document.getElementById("gpa-value").textContent = gpa.toFixed(2);

  // Show a warning message based on the calculated GPA
  const warningElement = document.getElementById("gpa-warning");
  if (gpa < 2.0) {
    warningElement.textContent = "Warning: GPA below 2.0 may affect academic standing.";
  } else if (gpa < 2.5) {
    warningElement.textContent = "Note: GPA is below 2.5.";
  } else {
    warningElement.textContent = "";
  }
}