/**
 * Form field configurations for NAAC Criteria sub-criteria.
 *
 * Each sub-criterion key maps to:
 *   - label: Display name
 *   - fields: Array of field definitions
 *   - fileUpload: file upload requirements
 *   - multiRecord: whether multiple entries are supported
 *
 * Field types: text, number, dropdown, radio, checkbox, date, textarea, multiselect, year
 */

const ACADEMIC_YEARS = ['2016-17', '2017-18', '2018-19', '2019-20', '2020-21'];

export const formConfigs = {
  // ═══════════════════════════════════════════════════════════
  // CRITERION 1 — Curricular Aspects
  // ═══════════════════════════════════════════════════════════
  '1.1': {
    label: 'Curricular Planning & Implementation',
    multiRecord: true,
    fields: [
      { name: 'programme_name', label: 'Programme Name', type: 'text', required: true },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
      { name: 'new_programme', label: 'New Programme Introduced?', type: 'radio', options: ['Yes', 'No'], required: true },
      { name: 'bos_member_name', label: 'BoS Member Name', type: 'text' },
      { name: 'bos_nomination_date', label: 'BoS Nomination Date', type: 'date' },
    ],
    fileUpload: {
      label: 'Upload BoS/Academic Council order',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
      required: false,
    },
    conditionalUpload: {
      field: 'new_programme',
      value: 'Yes',
      label: 'Upload approval document for new programme',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
    },
  },

  '1.2': {
    label: 'Academic Flexibility',
    multiRecord: true,
    fields: [
      { name: 'course_type', label: 'Course Type', type: 'dropdown', options: ['Core', 'Elective', 'Practical', 'Open', 'Audit'], required: true },
      { name: 'course_name', label: 'Course Name', type: 'text', required: true },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
      { name: 'is_relevant', label: 'Is Gender/Environment/Ethics relevant?', type: 'checkbox' },
      { name: 'audit_course_name', label: 'Audit Course Name', type: 'text' },
    ],
    fileUpload: {
      label: 'Upload Course syllabus document',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
      required: false,
    },
  },

  '1.3': {
    label: 'Curriculum Enrichment',
    multiRecord: true,
    fields: [
      { name: 'field_project_title', label: 'Field Project Title', type: 'text', required: true },
      { name: 'student_name', label: 'Student Name', type: 'text', required: true },
      { name: 'internship_org', label: 'Internship Organisation', type: 'text' },
      { name: 'duration_weeks', label: 'Duration (weeks)', type: 'number', min: 1 },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
    ],
    fileUpload: {
      label: 'Upload Certificate',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
  },

  '1.4': {
    label: 'Feedback System',
    multiRecord: true,
    fields: [
      { name: 'value_added_course', label: 'Value Added Course Name', type: 'text', required: true },
      { name: 'number_of_hours', label: 'Number of Hours', type: 'number', min: 1, required: true },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
      { name: 'feedback_collected', label: 'Feedback Collected?', type: 'radio', options: ['Yes', 'No'], required: true },
    ],
    fileUpload: {
      label: 'Upload Feedback forms or ATR',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
      required: false,
    },
    conditionalUpload: {
      field: 'feedback_collected',
      value: 'Yes',
      label: 'Upload ATR document',
      accept: '.pdf,.docx',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 2 — Teaching-Learning & Evaluation
  // ═══════════════════════════════════════════════════════════
  '2.1': {
    label: 'Student Enrolment & Profile',
    multiRecord: true,
    fields: [
      { name: 'student_name', label: 'Student Full Name', type: 'text', required: true },
      { name: 'roll_number', label: 'Roll Number', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'dropdown', options: ['General', 'OBC', 'SC', 'ST', 'PH'], required: true },
      { name: 'year_of_admission', label: 'Year of Admission', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'], required: true },
    ],
    fileUpload: {
      label: 'Upload Category certificate (if not General)',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: false,
    },
  },

  '2.2': {
    label: 'Catering to Student Diversity',
    multiRecord: true,
    fields: [
      { name: 'faculty_name', label: 'Faculty Name', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'dropdown', options: ['Professor', 'Asst. Professor', 'Guest Faculty'], required: true },
      { name: 'highest_qualification', label: 'Highest Qualification', type: 'dropdown', options: ['UG', 'PG', 'M.Phil', 'Ph.D'], required: true },
      { name: 'publications', label: 'Number of Publications', type: 'number', min: 0 },
      { name: 'ict_tools', label: 'ICT Tools Used', type: 'multiselect', options: ['PPT', 'LMS', 'Videos', 'CDs', 'Software'] },
      { name: 'slow_learner_strategies', label: 'Special Strategies for Slow Learners', type: 'textarea', maxLength: 500 },
    ],
    fileUpload: {
      label: 'Upload Faculty profile document',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
      required: false,
    },
  },

  '2.3': {
    label: 'Teaching-Learning Process',
    multiRecord: true,
    fields: [
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
      { name: 'course_name', label: 'Course Name', type: 'text', required: true },
      { name: 'ia_marks', label: 'Internal Assessment Marks', type: 'number', min: 0, max: 100, required: true },
      { name: 'grievance_redressed', label: 'Grievance Redressed', type: 'textarea' },
    ],
    fileUpload: {
      label: 'Upload IA document (PDF)',
      accept: '.pdf',
      required: true,
    },
  },

  '2.4': {
    label: 'Teacher Quality',
    multiRecord: true,
    fields: [
      { name: 'programme_outcome', label: 'Programme Outcome', type: 'textarea', required: true },
      { name: 'course_outcome', label: 'Course Outcome', type: 'textarea' },
      { name: 'attainment_level', label: 'Attainment Level', type: 'dropdown', options: ['Level 1', 'Level 2', 'Level 3'], required: true },
      { name: 'research_guide', label: 'Research Guide Recognised?', type: 'radio', options: ['Yes', 'No'] },
    ],
    fileUpload: {
      label: 'Upload Outcome attainment file',
      accept: '.pdf,.jpg,.jpeg,.png,.docx',
      required: false,
    },
  },

  '2.5': {
    label: 'Evaluation Process & Reforms',
    multiRecord: true,
    fields: [
      { name: 'course_name', label: 'Course Name', type: 'text', required: true },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS, required: true },
      { name: 'pass_percentage', label: 'Pass Percentage', type: 'number', min: 0, max: 100, step: 0.01, required: true },
      { name: 'total_students', label: 'Total Students', type: 'number', min: 0 },
      { name: 'students_passed', label: 'Students Passed', type: 'number', min: 0 },
    ],
    fileUpload: {
      label: 'Upload Result statistics file (PDF)',
      accept: '.pdf',
      required: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 3 — Research, Innovations & Extension
  // ═══════════════════════════════════════════════════════════
  '3.1': {
    label: 'Resource Mobilisation for Research',
    multiRecord: true,
    fields: [
      { name: 'project_title', label: 'Research Project Title', type: 'text', required: true },
      { name: 'principal_investigator', label: 'Principal Investigator', type: 'text', required: true },
      { name: 'co_investigators', label: 'Co-Investigators', type: 'text' },
      { name: 'funding_agency', label: 'Funding Agency', type: 'text', required: true },
      { name: 'agency_type', label: 'Agency Type', type: 'dropdown', options: ['Government', 'Non-Government'], required: true },
      { name: 'grant_amount', label: 'Grant Amount INR', type: 'number', min: 0, required: true },
      { name: 'start_date', label: 'Project Start Date', type: 'date' },
      { name: 'end_date', label: 'Project End Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'dropdown', options: ['Ongoing', 'Completed'] },
      { name: 'phd_scholar_name', label: 'PhD Scholar Name', type: 'text' },
      { name: 'phd_awarded_year', label: 'PhD Awarded Year', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
    ],
    fileUpload: {
      label: 'Upload Sanction letter or project order',
      accept: '.pdf',
      required: true,
    },
  },

  '3.2': {
    label: 'Innovation Ecosystem',
    multiRecord: true,
    fields: [
      { name: 'event_name', label: 'Workshop/Seminar Name', type: 'text', required: true },
      { name: 'event_type', label: 'Event Type', type: 'dropdown', options: ['Workshop', 'Seminar', 'Conference', 'FDP'], required: true },
      { name: 'organising_body', label: 'Organising Body', type: 'text' },
      { name: 'event_date', label: 'Event Date', type: 'date' },
      { name: 'participants_count', label: 'Participants Count', type: 'number', min: 0 },
      { name: 'industry_partner', label: 'Industry Partner', type: 'text' },
    ],
    fileUpload: {
      label: 'Upload Brochure or certificate',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
  },

  '3.3': {
    label: 'Research Publications & Awards',
    multiRecord: true,
    fields: [
      { name: 'paper_title', label: 'Journal Paper Title', type: 'text', required: true },
      { name: 'journal_name', label: 'Journal Name', type: 'text', required: true },
      { name: 'ugc_listed', label: 'UGC Listed?', type: 'radio', options: ['Yes', 'No'] },
      { name: 'issn_number', label: 'ISSN Number', type: 'text', placeholder: 'XXXX-XXXX' },
      { name: 'publication_year', label: 'Year of Publication', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'], required: true },
      { name: 'publication_type', label: 'Publication Type', type: 'dropdown', options: ['Journal', 'Conference', 'Book Chapter', 'Book'], required: true },
      { name: 'book_title', label: 'Book/Chapter Title', type: 'text' },
      { name: 'publisher_name', label: 'Publisher Name', type: 'text' },
    ],
    fileUpload: {
      label: 'Upload Paper/Book copy',
      accept: '.pdf',
      required: true,
    },
  },

  '3.4': {
    label: 'Extension Activities',
    multiRecord: true,
    fields: [
      { name: 'activity_name', label: 'Extension Activity Name', type: 'text', required: true },
      { name: 'activity_type', label: 'Activity Type', type: 'dropdown', options: ['NSS', 'NCC', 'Community Service', 'Outreach'], required: true },
      { name: 'activity_date', label: 'Date of Activity', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'students_participated', label: 'Number of Students Participated', type: 'number', min: 1 },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 300 },
    ],
    fileUpload: {
      label: 'Upload Activity report or photographs',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: false,
    },
  },

  '3.5': {
    label: 'Collaboration',
    multiRecord: true,
    fields: [
      { name: 'collaboration_type', label: 'Collaboration Type', type: 'dropdown', options: ['Faculty Exchange', 'Student Exchange', 'Internship', 'Field Trip', 'OJT', 'Research'], required: true },
      { name: 'partner_institution', label: 'Partner Institution/Industry', type: 'text', required: true },
      { name: 'person_name', label: 'Faculty/Student Name', type: 'text' },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 2 weeks' },
      { name: 'year', label: 'Year', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
      { name: 'outcome', label: 'Outcome', type: 'textarea' },
    ],
    fileUpload: {
      label: 'Upload MOU or agreement document',
      accept: '.pdf',
      required: false,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 4 — Infrastructure & Learning Resources
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    label: 'Physical Facilities',
    multiRecord: true,
    fields: [
      { name: 'facility_type', label: 'Facility Type', type: 'dropdown', options: ['Classroom', 'Lab', 'Computer Lab', 'Research Facility', 'Library'], required: true },
      { name: 'room_name', label: 'Room Number/Name', type: 'text', required: true },
      { name: 'area_sqft', label: 'Area in sq ft', type: 'number', min: 1 },
      { name: 'seating_capacity', label: 'Seating Capacity', type: 'number', min: 0 },
      { name: 'num_systems', label: 'Number of Systems', type: 'number', min: 0 },
      { name: 'equipment_name', label: 'Equipment Name', type: 'text' },
      { name: 'equipment_model', label: 'Equipment Make & Model', type: 'text' },
      { name: 'year_of_purchase', label: 'Year of Purchase', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
      { name: 'cost_inr', label: 'Cost INR', type: 'number', min: 0 },
      { name: 'condition', label: 'Condition', type: 'dropdown', options: ['Good', 'Average', 'Needs Repair'] },
    ],
    fileUpload: {
      label: 'Upload Facility photographs or equipment inventory',
      accept: '.jpg,.jpeg,.png,.pdf,.docx',
      required: true,
    },
  },

  '4.2': {
    label: 'Library as Learning Resource',
    multiRecord: false,
    fields: [
      { name: 'total_books', label: 'Total Book Holdings', type: 'number', min: 0 },
      { name: 'e_resources', label: 'E-Resources Subscribed', type: 'multiselect', options: ['JSTOR', 'IEEE', 'Elsevier', 'Springer', 'NPTEL', 'Other'] },
      { name: 'annual_budget', label: 'Annual Budget INR', type: 'number', min: 0 },
      { name: 'budget_utilised', label: 'Budget Utilised INR', type: 'number', min: 0 },
      { name: 'annual_footfall', label: 'Annual Footfall', type: 'number', min: 0 },
    ],
    fileUpload: {
      label: 'Upload Library usage statistics & budget utilisation',
      accept: '.pdf',
      required: false,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 5 — Student Support & Progression
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    label: 'Student Support — Scholarships & Awards',
    multiRecord: true,
    fields: [
      { name: 'entry_type', label: 'Entry Type', type: 'dropdown', options: ['Scholarship', 'Award/Medal'], required: true },
      // Scholarship fields
      { name: 'scholarship_name', label: 'Scholarship / Award Name', type: 'text', required: true },
      { name: 'awarding_body', label: 'Awarding Body', type: 'text', required: true },
      { name: 'beneficiary_name', label: 'Student Name', type: 'text' },
      { name: 'category', label: 'Category', type: 'dropdown', options: ['SC', 'ST', 'OBC', 'Minority', 'Merit', 'Sports', 'Cultural', 'Academic'] },
      { name: 'amount_inr', label: 'Amount INR', type: 'number', min: 0 },
      { name: 'level', label: 'Level', type: 'dropdown', options: ['State', 'National', 'International'] },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS },
      { name: 'year', label: 'Year', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
    ],
    fileUpload: {
      label: 'Upload Scholarship sanction letter or Award certificate',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: false,
    },
  },

  '5.2': {
    label: 'Student Progression — Placements, Higher Ed & Exams',
    multiRecord: true,
    fields: [
      { name: 'entry_type', label: 'Entry Type', type: 'dropdown', options: ['Placement', 'Higher Education', 'Competitive Exam'], required: true },
      // Common
      { name: 'student_name', label: 'Student Name', type: 'text', required: true },
      // Placement
      { name: 'company', label: 'Placement Company', type: 'text' },
      { name: 'job_role', label: 'Job Role/Designation', type: 'text' },
      { name: 'package_lpa', label: 'Package LPA', type: 'number', min: 0, step: 0.01 },
      // Higher Ed
      { name: 'current_programme', label: 'Current Programme', type: 'text' },
      { name: 'higher_ed_institution', label: 'Higher Education Institution', type: 'text' },
      { name: 'programme_pursued', label: 'Programme Pursued', type: 'text' },
      // Competitive Exam
      { name: 'exam_name', label: 'Exam Name', type: 'dropdown', options: ['NET', 'SLET', 'GATE', 'UPSC', 'PSC', 'CAT', 'GRE', 'TOEFL', 'GMAT'] },
      { name: 'rank_score', label: 'Rank/Score', type: 'text' },
      // Common
      { name: 'year', label: 'Year', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
    ],
    fileUpload: {
      label: 'Upload Offer letter or Score card',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: false,
    },
  },

  '5.3': {
    label: 'Student Participation & Activities',
    multiRecord: true,
    fields: [
      { name: 'event_name', label: 'Alumni Event Name', type: 'text', required: true },
      { name: 'event_date', label: 'Alumni Event Date', type: 'date' },
      { name: 'attendees_count', label: 'Attendees Count', type: 'number', min: 0 },
      { name: 'agenda', label: 'Agenda Description', type: 'textarea' },
    ],
    fileUpload: {
      label: 'Upload Meeting minutes & Photographs',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 6 — Governance, Leadership & Management
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    label: 'Institutional Vision & Leadership (FDP)',
    multiRecord: true,
    fields: [
      { name: 'fdp_name', label: 'FDP Programme Name', type: 'text', required: true },
      { name: 'organising_institution', label: 'Organising Institution', type: 'text', required: true },
      { name: 'duration_days', label: 'Duration in Days', type: 'number', min: 1, required: true },
      { name: 'mode', label: 'Mode', type: 'dropdown', options: ['Online', 'Offline', 'Hybrid'], required: true },
      { name: 'faculty_name', label: 'Faculty Member Name', type: 'text', required: true },
      { name: 'date_of_attendance', label: 'Date of Attendance', type: 'date' },
      { name: 'domain', label: 'Domain/Subject Area', type: 'text' },
    ],
    fileUpload: {
      label: 'Upload FDP completion certificate',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
  },

  '6.2': {
    label: 'Strategy Development & Deployment (PBAS)',
    multiRecord: true,
    fields: [
      { name: 'faculty_name', label: 'Faculty Member Name', type: 'text', required: true },
      { name: 'assessment_year', label: 'Assessment Year', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'], required: true },
      { name: 'pbas_score', label: 'PBAS Score', type: 'number', min: 0, max: 100, step: 0.01, required: true },
      { name: 'teaching_score', label: 'Teaching-Learning Score', type: 'number', min: 0, step: 0.01 },
      { name: 'research_score', label: 'Research Score', type: 'number', min: 0, step: 0.01 },
      { name: 'extension_score', label: 'Extension/Co-curricular Score', type: 'number', min: 0, step: 0.01 },
      { name: 'api_category', label: 'API Category', type: 'dropdown', options: ['Category I', 'Category II', 'Category III'] },
    ],
    fileUpload: {
      label: 'Upload PBAS file',
      accept: '.pdf',
      required: true,
    },
  },

  '6.3': {
    label: 'Faculty Empowerment & Fund Generation',
    multiRecord: true,
    fields: [
      { name: 'activity_name', label: 'Fund Generation Activity Name', type: 'text', required: true },
      { name: 'source_of_funds', label: 'Source of Funds', type: 'text', placeholder: 'e.g. Alumni, Industry, Grants' },
      { name: 'amount_generated', label: 'Amount Generated INR', type: 'number', min: 0 },
      { name: 'academic_year', label: 'Academic Year', type: 'dropdown', options: ACADEMIC_YEARS },
      { name: 'purpose', label: 'Purpose/Utilisation', type: 'textarea' },
    ],
    fileUpload: {
      label: 'Upload Supporting receipts or sanction letters',
      accept: '.pdf',
      required: false,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // CRITERION 7 — Institutional Values & Best Practices
  // ═══════════════════════════════════════════════════════════
  '7.1': {
    label: 'Institutional Values & Social Responsibilities',
    multiRecord: true,
    fields: [
      { name: 'entry_type', label: 'Entry Type', type: 'dropdown', options: ['Green Initiative', 'Disabled-Friendly Facility', 'Gender Equity Activity'], required: true },
      // Green Initiatives
      { name: 'initiative_name', label: 'Initiative / Facility / Activity Name', type: 'text', required: true },
      { name: 'initiative_type', label: 'Initiative Type', type: 'dropdown', options: ['Energy Conservation', 'Water Conservation', 'E-Waste Management', 'Plastic-Free Campus', 'Tree Plantation', 'Ramps', 'Braille', 'Lift', 'Other'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'year_implemented', label: 'Year Implemented/Installed', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
      // Gender Equity
      { name: 'activity_date', label: 'Activity Date', type: 'date' },
      { name: 'organising_body', label: 'Organising Body', type: 'text' },
      { name: 'participants_count', label: 'Participants Count', type: 'number', min: 0 },
      { name: 'impact', label: 'Impact/Outcome/Description', type: 'textarea', maxLength: 300 },
    ],
    fileUpload: {
      label: 'Upload Evidence document or photograph',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: false,
    },
  },

  '7.2': {
    label: 'Best Practices',
    multiRecord: true,
    minEntries: 2,
    minEntriesMessage: 'Minimum 2 best practices required for submission',
    fields: [
      { name: 'title', label: 'Best Practice Title', type: 'text', required: true, maxLength: 100 },
      { name: 'objective', label: 'Objective', type: 'textarea', required: true, maxLength: 500, placeholder: 'State the goals and aims...' },
      { name: 'context', label: 'Context', type: 'textarea', required: true, maxLength: 500, placeholder: 'Describe the background and need...' },
      { name: 'description', label: 'Practice Description', type: 'textarea', required: true, maxLength: 1000, placeholder: 'Step-by-step description of implementation...' },
      { name: 'evidence_of_success', label: 'Evidence of Success', type: 'textarea', required: true, maxLength: 500, placeholder: 'Outcomes, impact, numbers achieved...' },
      { name: 'problems_encountered', label: 'Problems Encountered', type: 'textarea', maxLength: 500 },
      { name: 'resources_required', label: 'Resources Required', type: 'textarea', maxLength: 300, placeholder: 'Human, financial, physical resources' },
      { name: 'year_implemented', label: 'Year Implemented', type: 'dropdown', options: ['2016', '2017', '2018', '2019', '2020', '2021'] },
    ],
    fileUpload: {
      label: 'Upload Evidence document, PDF report & photographs',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
  },
};

/**
 * Get form config for a given sub-criterion code.
 */
export function getFormConfig(code) {
  return formConfigs[code] || null;
}

/**
 * Get all sub-criterion codes for a criterion number.
 */
export function getSubCriteriaForCriterion(criterionId) {
  const prefix = `${criterionId}.`;
  return Object.keys(formConfigs).filter((k) => k.startsWith(prefix));
}
