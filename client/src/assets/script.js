
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

const grades = [];

window.addGrade = function () {
    const input = document.getElementById("grade-entry");
    if (!input) return;

    let grade = input.value.trim().toUpperCase();

    if (gradePoints[grade] !== undefined) {
        grades.push(grade);
        displayGrades();
        input.value = "";
    } else {
        alert("Please enter a valid letter grade.");
    }
};

window.displayGrades = function () {
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

window.calculateGPA = function () {
    let totalPoints = 0;

    for (let i = 0; i < grades.length; i++) {
        totalPoints = totalPoints + gradePoints[grades[i]];
    }

    let gpa = totalPoints / grades.length;
    document.getElementById("gpa-value").textContent = gpa.toFixed(2);
};