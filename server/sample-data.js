/**
 * college accreditation & document workflow platform — Sample Data Generator
 * Populates the system with realistic demo data for judges.
 * 
 * Usage: node sample-data.js
 * Requires: Server running with seeded database
 */
const http = require('http');

const BASE = 'http://localhost:5000/api';

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: null }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const SAMPLE_FORMS = {
  '1.1': { entries: [
    { program: 'B.Tech Computer Science', delivery_mode: 'Semester', academic_calendar: 'Published on website', revision_year: '2023' },
    { program: 'M.Tech AI/ML', delivery_mode: 'Semester', academic_calendar: 'Published on website', revision_year: '2024' },
  ]},
  '1.2': { entries: [
    { elective_courses: 12, cbcs_implemented: 'Yes', credit_transfer: 'Available for 3 universities', interdisciplinary: 5 },
  ]},
  '1.3': { entries: [
    { value_added_course: 'Soft Skills Development', duration: '30 hours', students_enrolled: 120 },
    { value_added_course: 'Digital Marketing', duration: '45 hours', students_enrolled: 85 },
    { value_added_course: 'Entrepreneurship', duration: '40 hours', students_enrolled: 95 },
  ]},
  '2.1': { entries: [
    { year: '2023-24', sanctioned_seats: 300, admitted: 285, demand_ratio: '3.2:1', reserved_category_pct: '49%' },
  ]},
  '2.2': { entries: [
    { strategy: 'Bridge courses for slow learners', beneficiaries: 45 },
    { strategy: 'Advanced lab sessions for meritorious', beneficiaries: 30 },
    { strategy: 'Peer tutoring program', beneficiaries: 60 },
  ]},
  '2.3': { entries: [
    { pedagogy: 'Flipped Classroom', courses_using: 8 },
    { pedagogy: 'Project-Based Learning', courses_using: 12 },
    { pedagogy: 'ICT-Enabled Teaching', courses_using: 25 },
  ]},
  '2.4': { entries: [
    { total_faculty: 45, phd_holders: 28, net_set: 38, fdp_attended: 42, awards: 5 },
  ]},
  '3.1': { entries: [
    { grant_name: 'DST-SERB Core Research Grant', amount: 1500000, year: '2023', agency: 'DST' },
    { grant_name: 'AICTE RPS', amount: 800000, year: '2023', agency: 'AICTE' },
    { grant_name: 'UGC Minor Research Project', amount: 300000, year: '2024', agency: 'UGC' },
  ]},
  '3.2': { entries: [
    { source: 'Government Grants', amount: 2500000 },
    { source: 'Industry Consultancy', amount: 850000 },
    { source: 'International Collaboration', amount: 400000 },
  ]},
  '3.3': { entries: [
    { initiative: 'Innovation Cell established', year: '2022', startups_incubated: 3 },
    { initiative: 'MoU with TCS for research', year: '2023', students_benefited: 50 },
  ]},
  '4.1': { entries: [
    { facility: 'Smart Classrooms', count: 25, condition: 'Excellent' },
    { facility: 'Research Labs', count: 8, condition: 'Good' },
    { facility: 'Sports Complex', count: 1, condition: 'Excellent' },
  ]},
  '4.2': { entries: [
    { total_books: 52000, e_journals: 3500, e_books: 8000, annual_expenditure: 1200000, automation: 'Koha ILMS' },
  ]},
  '4.3': { entries: [
    { bandwidth: '1 Gbps', wifi_coverage: '100%', student_computer_ratio: '3:1', smart_classrooms: 25 },
  ]},
  '5.1': { entries: [
    { scholarship_type: 'Merit-based', beneficiaries: 150, amount: 500000 },
    { scholarship_type: 'SC/ST/OBC', beneficiaries: 120, amount: 800000 },
    { scholarship_type: 'Sports Quota', beneficiaries: 25, amount: 150000 },
  ]},
  '5.2': { entries: [
    { year: '2023-24', placed_students: 180, higher_education: 45, competitive_exams: 12, placement_pct: '82%' },
  ]},
  '6.1': { entries: [
    { governance_model: 'Participative Management', meetings_per_year: 12, bodies: 'Academic Council, BOS, IQAC' },
  ]},
  '6.2': { entries: [
    { strategic_plan: '2022-2027 Vision Document', iqac_meetings: 6, quality_initiatives: 'NBA accreditation, ISO 9001' },
  ]},
  '6.3': { entries: [
    { fdp_count: 15, conference_support: 'Up to Rs. 30,000 per faculty', welfare: 'Health insurance, LTC' },
  ]},
  '7.1': { entries: [
    { initiative: 'Solar Power Plant 100KW', category: 'Green Campus', year: '2023' },
    { initiative: 'Rainwater Harvesting', category: 'Environment', year: '2022' },
    { initiative: 'Gender Sensitization Cell', category: 'Gender Equity', year: '2021' },
  ]},
  '7.2': { entries: [
    { practice: 'Industry-Integrated Curriculum', description: 'All programs have 20% industry-designed modules' },
    { practice: 'Community Outreach Program', description: 'Annual rural technology camps benefiting 500+ villagers' },
  ]},
};

async function run() {
  console.log('\n=== college accreditation & document workflow platform Sample Data Generator ===\n');

  // Login as HOD
  let r = await req('POST', '/auth/login', { email: 'hod@naac.edu', password: 'HOD@2024' });
  if (r.status !== 200) { console.error('HOD login failed'); process.exit(1); }
  const hodToken = r.data.data.token;
  console.log('  HOD logged in');

  // Login as teachers
  const teachers = [
    { email: 'anita.sharma@naac.edu', password: 'Teacher@123' },
    { email: 'vikram.patel@naac.edu', password: 'Teacher@123' },
    { email: 'meera.desai@naac.edu', password: 'Teacher@123' },
  ];

  const teacherTokens = [];
  for (const t of teachers) {
    r = await req('POST', '/auth/login', { email: t.email, password: t.password });
    if (r.status === 200) {
      teacherTokens.push({ token: r.data.data.token, id: r.data.data.user.id, name: r.data.data.user.fullName });
      console.log(`  ${r.data.data.user.fullName} logged in`);
    }
  }

  // Each teacher fills forms for different criteria
  const criteriaAssignment = [
    ['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '2.4', '3.1'],  // Teacher 1
    ['3.2', '3.3', '4.1', '4.2', '4.3', '5.1', '5.2'],          // Teacher 2
    ['6.1', '6.2', '6.3', '7.1', '7.2'],                         // Teacher 3
  ];

  for (let i = 0; i < teacherTokens.length; i++) {
    const t = teacherTokens[i];
    const codes = criteriaAssignment[i];
    console.log(`\n  Populating data for ${t.name}...`);

    for (const code of codes) {
      const formData = SAMPLE_FORMS[code];
      if (!formData) continue;

      // Save as draft first
      r = await req('POST', `/forms/submit/${code}`, { form_data: formData, action: 'draft' }, t.token);
      if (r.status === 200 || r.status === 201) {
        console.log(`    Draft saved: ${code}`);
      }

      // Submit some (not all, to show mixed states)
      if (Math.random() > 0.3) {
        r = await req('POST', `/forms/submit/${code}`, { form_data: formData, action: 'submit' }, t.token);
        if (r.status === 200 || r.status === 201) {
          console.log(`    Submitted: ${code}`);
        }
      }
    }
  }

  // HOD verifies some submissions
  console.log('\n  HOD reviewing submissions...');
  for (let i = 0; i < teacherTokens.length; i++) {
    const t = teacherTokens[i];
    // Check each criteria
    for (let cId = 1; cId <= 7; cId++) {
      r = await req('GET', `/hod/teacher/${t.id}/data/C${cId}`, null, hodToken);
      if (r.status !== 200) continue;
      const subs = r.data?.data?.sub_criteria || [];
      for (const sub of subs) {
        if (sub.submission?.status === 'submitted' && Math.random() > 0.5) {
          const action = Math.random() > 0.3 ? 'verified' : 'needs_revision';
          const comment = action === 'verified' ? 'Well documented. Approved.' : 'Please add supporting documents.';
          r = await req('PUT', `/hod/review/${sub.submission.id}`, { status: action, comment }, hodToken);
          if (r.status === 200) {
            console.log(`    ${action === 'verified' ? 'Verified' : 'Revision requested'}: ${sub.code}`);
          }
        }
      }
    }
  }

  // Send some reminders
  console.log('\n  Sending reminders...');
  for (const t of teacherTokens) {
    r = await req('POST', `/notifications/send`, {
      recipient_id: t.id,
      message: 'Please complete your pending NAAC submissions before the deadline.',
      type: 'reminder',
    }, hodToken);
    if (r.status === 201) console.log(`    Reminder sent to ${t.name}`);
  }

  console.log('\n=== Sample data populated successfully! ===\n');
  console.log('Login credentials:');
  console.log('  HOD: hod@naac.edu / HOD@2024');
  console.log('  Teacher: anita.sharma@naac.edu / Teacher@123');
  console.log('  Teacher: vikram.patel@naac.edu / Teacher@123');
  console.log('  Teacher: meera.desai@naac.edu / Teacher@123\n');
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

