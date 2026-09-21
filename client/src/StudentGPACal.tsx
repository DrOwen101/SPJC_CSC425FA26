import { useState } from "react";

function StudentGPACal({ onBack }: { onBack: () => void }) {

    const gradePoints: { [key: string]: number } = {
    "A+": 4.0,
    "A": 3.8,
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
    }
    

    const [grades, setGrades] = useState<string[]>([]);

// FUNCTION: Add a grade
function addGrade() {

    // Get the grade from the HTML input
    let grade = (document.getElementById("grade-entry") as HTMLInputElement).value;

    // Clean up the input
    grade = grade.trim().toUpperCase();

    // Check if the grade is valid
    if (gradePoints[grade] !== undefined) {

        // Add the grade to the array
        setGrades([...grades, grade]);

        // Clear the input box
        (document.getElementById("grade-entry") as HTMLInputElement).value = "";

    } else {

        alert("Please enter a valid letter grade.");
    }
}


// FUNCTION: Calculate the GPA
function calculateGPA() {

    if (grades.length === 0) {
    alert("Please add at least one grade.");
    return;
    }


    let totalPoints = 0;

    // Add the points for each grade
    for (let i = 0; i < grades.length; i++) {

        totalPoints = totalPoints + gradePoints[grades[i]];
    }

    // Calculate the average
    let gpa = totalPoints / grades.length;

    // Display the GPA
    (document.getElementById("gpa-value") as HTMLSpanElement)!.textContent = gpa.toFixed(2);
}

    return (
        <main>
            <button onClick={onBack} style={{ marginBottom: "15px" }}>← Back</button>

            <h1 style={{ fontSize: "40px", margin: "10px 0 15px 0" }}>
             GPA Calculator
            </h1>

            <p>Enter your grades to calculate your GPA.</p>
        <div style={{ marginBottom: "25px" }}>
        <input
           id="grade-entry"
           type="text"
           placeholder="Enter grade (A, B+, C-, etc.)"
           style={{ marginRight: "8px", padding: "8px" }}
        />

       <button onClick={addGrade} style={{ padding: "8px 12px" }}>
           Add Grade
       </button>
       </div>

            <h2>Grades</h2>

            <ul id="grade-list">
                {grades.map((grade, index) => (
                    <li key={index}>
                        {grade} = {gradePoints[grade]} points
                    </li>
                ))}
            </ul>

            <button onClick={calculateGPA}>
                Calculate GPA
            </button>

            <h2>
                GPA: <span id="gpa-value">0.00</span>
            </h2>
        </main>
    );
    
}
export default StudentGPACal;