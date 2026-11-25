import RecordTable from './RecordTable'
import type { Section } from './facultyApi'

type Row = Section & { department?: string; instructor?: string }

export default function SectionScheduleTable({ sections, caption, showManagement = false }: {
  sections: Row[]; caption: string; showManagement?: boolean
}) {
  const columns = ['Section', 'Course', 'Days', 'Time', 'Location', 'Enrolled']
  if (showManagement) columns.splice(2, 0, 'Department', 'Instructor')
  return (
    <RecordTable caption={caption} regionLabel={showManagement ? 'Section directory' : 'Weekly teaching schedule'} columns={columns}>
      {sections.map((section) => (
        <tr key={section.id}>
          <th scope="row">{section.id}</th><td>{section.title}</td>
          {showManagement && <><td>{section.department}</td><td>{section.instructor}</td></>}
          <td>{section.meetingDays}</td><td>{section.startsAt}–{section.endsAt}</td>
          <td>{section.location}</td><td>{section.studentCount}</td>
        </tr>
      ))}
    </RecordTable>
  )
}
