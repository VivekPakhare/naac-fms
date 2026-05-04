const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Seed the database with initial reference data:
 *   1. Pre-seeded HOD (Super User) account
 *   2. 3 Sample teacher accounts for testing
 *   3. 7 NAAC Criteria with max_marks
 *   4. 20 Sub-criteria across all 7 criteria
 */
async function main() {
  console.log('🌱 Seeding NAAC database...\n');

  // ══════════════════════════════════════════════════════════
  // 1. PRE-SEEDED HOD ACCOUNT
  // ══════════════════════════════════════════════════════════

  const hodPassword = await bcrypt.hash('HOD@2024', SALT_ROUNDS);

  const hod = await prisma.user.upsert({
    where: { email: 'hod@naac.edu' },
    update: { passwordHash: hodPassword },
    create: {
      fullName: 'Dr. Rajesh Kumar',
      email: 'hod@naac.edu',
      passwordHash: hodPassword,
      role: 'hod',
      department: 'Computer Science',
      designation: 'Head of Department',
      isActive: true,
    },
  });

  console.log(`✅ HOD created: ${hod.email} (role: ${hod.role})`);

  // ══════════════════════════════════════════════════════════
  // 2. SAMPLE TEACHER ACCOUNTS (3 teachers)
  // ══════════════════════════════════════════════════════════

  const teacherPassword = await bcrypt.hash('Teacher@123', SALT_ROUNDS);

  const teachers = [
    {
      fullName: 'Prof. Anita Sharma',
      email: 'anita.sharma@naac.edu',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      subjectsTaught: 'Data Structures, Algorithms, Database Management Systems',
    },
    {
      fullName: 'Prof. Vikram Patel',
      email: 'vikram.patel@naac.edu',
      department: 'Information Technology',
      designation: 'Associate Professor',
      subjectsTaught: 'Computer Networks, Operating Systems, Cloud Computing',
    },
    {
      fullName: 'Prof. Meera Desai',
      email: 'meera.desai@naac.edu',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      subjectsTaught: 'Machine Learning, Artificial Intelligence, Python Programming',
    },
  ];

  for (const t of teachers) {
    const created = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        ...t,
        passwordHash: teacherPassword,
        role: 'teacher',
        isActive: true,
      },
    });
    console.log(`✅ Teacher created: ${created.email}`);
  }

  // ══════════════════════════════════════════════════════════
  // 3. CRITERIA — 7 NAAC Criteria
  // ══════════════════════════════════════════════════════════

  const criteriaData = [
    { id: 1, code: 'C1', name: 'Curricular Aspects',                      maxMarks: 150 },
    { id: 2, code: 'C2', name: 'Teaching-Learning and Evaluation',         maxMarks: 200 },
    { id: 3, code: 'C3', name: 'Research, Innovations and Extension',      maxMarks: 150 },
    { id: 4, code: 'C4', name: 'Infrastructure and Learning Resources',    maxMarks: 100 },
    { id: 5, code: 'C5', name: 'Student Support and Progression',          maxMarks: 100 },
    { id: 6, code: 'C6', name: 'Governance, Leadership and Management',    maxMarks: 100 },
    { id: 7, code: 'C7', name: 'Institutional Values and Best Practices',  maxMarks: 100 },
  ];

  for (const c of criteriaData) {
    await prisma.criterion.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log(`✅ ${criteriaData.length} NAAC Criteria seeded`);

  // ══════════════════════════════════════════════════════════
  // 4. SUB-CRITERIA — 20 entries across 7 criteria
  // ══════════════════════════════════════════════════════════

  const subCriteriaData = [
    // ── C1: Curricular Aspects (4) ─────────────────────────
    { id: 1,  criteriaId: 1, code: '1.1', name: 'Curricular Planning and Implementation',
      description: 'Effective curriculum delivery through structured planning, adequate teaching-learning resources, and well-organized academic calendar.' },
    { id: 2,  criteriaId: 1, code: '1.2', name: 'Academic Flexibility',
      description: 'Range of program options, choice-based credit systems, credit transfer policies, and interdisciplinary/multidisciplinary courses offered.' },
    { id: 3,  criteriaId: 1, code: '1.3', name: 'Curriculum Enrichment',
      description: 'Integration of cross-cutting issues (gender, environment, sustainability, human values) and value-added courses beyond the syllabus.' },
    { id: 4,  criteriaId: 1, code: '1.4', name: 'Feedback System',
      description: 'Feedback on curriculum from students, teachers, employers, and alumni. Action Taken Reports (ATR) on feedback.' },

    // ── C2: Teaching-Learning and Evaluation (5) ───────────
    { id: 5,  criteriaId: 2, code: '2.1', name: 'Student Enrollment and Profile',
      description: 'Demand ratio, student diversity, reserved category admissions, and enrollment trends over the assessment period.' },
    { id: 6,  criteriaId: 2, code: '2.2', name: 'Catering to Student Diversity',
      description: 'Strategies for advanced learners and slow learners, student mentoring, bridge courses, remedial coaching, and language labs.' },
    { id: 7,  criteriaId: 2, code: '2.3', name: 'Teaching-Learning Process',
      description: 'Student-centric pedagogies, experiential learning, participative learning, ICT-enabled teaching, and innovative practices.' },
    { id: 8,  criteriaId: 2, code: '2.4', name: 'Teacher Quality',
      description: 'Percentage of full-time teachers with PhD/NET/SET, faculty development programs, awards, and recognition received.' },
    { id: 9,  criteriaId: 2, code: '2.5', name: 'Evaluation Process and Reforms',
      description: 'Continuous Internal Evaluation reforms, pass percentage analysis, student performance tracking, and result transparency.' },

    // ── C3: Research, Innovations and Extension (5) ────────
    { id: 10,  criteriaId: 3, code: '3.1', name: 'Promotion of Research and Facilities',
      description: 'Research grants received, seed money for research, teachers recognized as research guides, and research facilities.' },
    { id: 11,  criteriaId: 3, code: '3.2', name: 'Resource Mobilization for Research',
      description: 'Grants from government and non-government agencies, industry-sponsored research, and consultancy revenue.' },
    { id: 12, criteriaId: 3, code: '3.3', name: 'Innovation Ecosystem',
      description: 'Innovation and start-up support, incubation centres, MoUs with industry, and technology transfer activities.' },
    { id: 13, criteriaId: 3, code: '3.4', name: 'Extension Activities',
      description: 'NSS, NCC, community service programs, outreach activities, and social responsibility initiatives.' },
    { id: 14, criteriaId: 3, code: '3.5', name: 'Collaboration',
      description: 'Functional MOUs, faculty/student exchange, collaborative research, and linkages with industry and institutions.' },

    // ── C4: Infrastructure and Learning Resources (3) ──────
    { id: 15, criteriaId: 4, code: '4.1', name: 'Physical Facilities',
      description: 'Availability and adequacy of classrooms, laboratories, library, sports facilities, ICT-enabled facilities, and other infrastructure.' },
    { id: 16, criteriaId: 4, code: '4.2', name: 'Library as a Learning Resource',
      description: 'Library automation, subscription to e-journals/e-books, usage statistics, and annual expenditure on library resources.' },
    { id: 17, criteriaId: 4, code: '4.3', name: 'IT Infrastructure',
      description: 'Internet bandwidth, Wi-Fi facilities, student-computer ratio, ICT-enabled classrooms, and smart campus initiatives.' },

    // ── C5: Student Support and Progression (3) ────────────
    { id: 18, criteriaId: 5, code: '5.1', name: 'Student Support',
      description: 'Scholarships, freeships, capability enhancement schemes, career counseling, competitive exam guidance, and grievance redressal.' },
    { id: 19, criteriaId: 5, code: '5.2', name: 'Student Progression',
      description: 'Placement records, higher education progression, qualifying in state/national/international examinations, and alumni contributions.' },
    { id: 20, criteriaId: 5, code: '5.3', name: 'Student Participation and Activities',
      description: 'Alumni engagement, alumni events, student clubs and associations, and co-curricular activities.' },

    // ── C6: Governance, Leadership and Management (3) ──────
    { id: 21, criteriaId: 6, code: '6.1', name: 'Institutional Vision and Leadership',
      description: 'Governance and leadership reflecting institutional vision, decentralization and participative management practices.' },
    { id: 22, criteriaId: 6, code: '6.2', name: 'Strategy Development and Deployment',
      description: 'Perspective/strategic plan, institutional development, functioning of IQAC, and implementation of quality initiatives.' },
    { id: 23, criteriaId: 6, code: '6.3', name: 'Faculty Empowerment Strategies',
      description: 'Professional development programs, performance appraisal system, financial support for conferences, and welfare measures.' },

    // ── C7: Institutional Values and Best Practices (2) ────
    { id: 24, criteriaId: 7, code: '7.1', name: 'Institutional Values and Social Responsibilities',
      description: 'Gender equity, environmental consciousness, waste management, green campus initiatives, and divyangjan-friendly facilities.' },
    { id: 25, criteriaId: 7, code: '7.2', name: 'Best Practices and Institutional Distinctiveness',
      description: 'Documentation of two best practices and one area of institutional distinctiveness contributing to academic excellence.' },
  ];

  for (const sc of subCriteriaData) {
    await prisma.subCriterion.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  console.log(`✅ ${subCriteriaData.length} Sub-criteria seeded`);

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════

  const userCount = await prisma.user.count();
  const criteriaCount = await prisma.criterion.count();
  const subCount = await prisma.subCriterion.count();

  console.log('\n────────────────────────────────────────');
  console.log('📊 Seed Summary:');
  console.log(`   Users:         ${userCount} (1 HOD + ${userCount - 1} Teachers)`);
  console.log(`   Criteria:      ${criteriaCount}`);
  console.log(`   Sub-criteria:  ${subCount}`);
  console.log('────────────────────────────────────────');
  console.log('\n📌 Test Credentials:');
  console.log('   HOD:      hod@naac.edu / HOD@2024');
  console.log('   Teacher:  anita.sharma@naac.edu / Teacher@123');
  console.log('   Teacher:  vikram.patel@naac.edu / Teacher@123');
  console.log('   Teacher:  meera.desai@naac.edu / Teacher@123');
  console.log('\n🎉 Database seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
