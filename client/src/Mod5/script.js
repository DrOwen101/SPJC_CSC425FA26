let grades = [];

function takeGrades() {
    const gradePoints = {
        'A+': 4.0,
        'A': 4.0,
        'A-': 3.7,
        'B+': 3.3,
        'B': 3.0,
        'B-': 2.7,
        'C+': 2.3,
        'C': 2.0,
        'C-': 1.7,
        'D+': 1.3,
        'D': 1.0,
        'D-': 0.7,
        'F': 0.0
    };

    let grade = document.getElementById('grades-input').value;
    grade = grade.trim().toUpperCase();

    console.log(`Input grade: ${grade}`);

    if (gradePoints.hasOwnProperty(grade)) {
        grades.push(gradePoints[grade]);
        console.log(grades);
        document.getElementById("grades-input").value = "";
    }

    else {
        console.log(`Invalid grade: ${grade}`);
        document.getElementById("grades-input").value = "";
        document.getElementById("grades-input").placeholder = "Invalid grade. Enter: (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)";
    }


    return grades;
}

function calculateGPA() {
    let calcGpa = 0;

    for (let i = 0; i < grades.length; i++) {
        calcGpa += grades[i];
    }

    console.log(`Total grade points: ${calcGpa}`);
    const gpa = calcGpa / grades.length;
    console.log(`Calculated GPA: ${gpa.toFixed(2)}`);

    if (gpa <= 2.5) {
        document.getElementById("gpa-result").innerText = `GPA results: ${gpa.toFixed(2)} - your grades suck, man.`;
    }
    else if (gpa > 2.5 && gpa <= 3.5) {
        document.getElementById("gpa-result").innerText = `GPA results: ${gpa.toFixed(2)} - you're doing okay, but you can do better.`;
    }
    else {
        document.getElementById("gpa-result").innerText = `GPA results: ${gpa.toFixed(2)} - you're doing great!`;
    }

}
