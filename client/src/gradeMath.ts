/** Shared letter-grade mapping for Student GPA and faculty grade summary. */
export const gradePoints: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0,
}

export function averageGradePoints(grades: string[]): number | null {
  if (grades.length === 0) return null
  return grades.reduce((sum, grade) => sum + gradePoints[grade], 0) / grades.length
}

// Demonstration rule, not an institutional grading policy.
export function letterFromPercent(percent: number): string {
  if (percent >= 90) return 'A'
  if (percent >= 80) return 'B'
  if (percent >= 70) return 'C'
  if (percent >= 60) return 'D'
  return 'F'
}
