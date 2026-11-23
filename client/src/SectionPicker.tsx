import { sectionLabel, type Section } from './facultyApi'

type SectionPickerProps = {
  id: string
  sections: Section[]
  value: number | null
  onChange: (sectionId: number) => void
}

// Lab 12: a dropdown of the signed-in faculty member's own sections,
// shared by the roster, grading, and GPA summary cards.
function SectionPicker({ id, sections, value, onChange }: SectionPickerProps) {
  return (
    <>
      <label htmlFor={id}>Section</label>
      <select id={id} value={value ?? ''} onChange={(event) => onChange(Number(event.target.value))}>
        <option value="" disabled>Choose one of your sections</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>{sectionLabel(section)}</option>
        ))}
      </select>
    </>
  )
}

export default SectionPicker
