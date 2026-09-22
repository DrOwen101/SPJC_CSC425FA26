const gradeLetters = {
    "A+": 4.0,"A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "F": 0.0
};
const academicFailure= 2.0;

let grades = [];

function addGrade() {
    let grade = document.getElementById("gradeEntry").value;
    grade=grade.trim().toUpperCase();
    if (gradeLetters[grade] !== undefined) {
        grades.push(grade);
        displayGrades();
        document.getElementById("gradeEntry").value = "";
    } else {
        alert("Please enter a valid letter grade.");
    }
}


function displayGrades() {
    let output = "";
    for (let i = 0; i < grades.length; i++) {
        output += "<li>" + grades[i] +" = " + gradeLetters[grades[i]] +" points</li>";
    }
    document.getElementById("gradeList").innerHTML = output;
}


// FUNCTION: Calculate the GPA
function calculateGPA() {
    let totalPoints = 0;
    for (let i = 0; i < grades.length; i++) {
        totalPoints = totalPoints + gradeLetters[grades[i]];
    }
    let gpa = totalPoints / grades.length;
    document.getElementById("gpaValue").textContent = gpa.toFixed(2);
    academicCheck(gpa)
}

function academicCheck(grade){
    if (grade<=academicFailure){
        alert("You are in low academic standing. Please bring up your GPA.")
    }
}
