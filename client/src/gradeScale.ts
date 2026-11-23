// Shared by the student GPA card and the faculty Section GPA Summary (Lab 12),
// so both use the same letter-grade scale and the same averaging.

// Each letter grade maps to its value on a standard 4.0 GPA scale.
export const gradePoints: Record<string, number> = {
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

export const letterGrades = Object.keys(gradePoints)

// Equal-weight average of letter grades. Returns null when there are none.
export function averageGpa(grades: string[]): number | null {
  if (grades.length === 0) return null
  const totalPoints = grades.reduce((total, grade) => total + gradePoints[grade], 0)
  return totalPoints / grades.length
}
