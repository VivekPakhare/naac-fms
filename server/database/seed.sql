-- ============================================================================
-- NAAC FILE MANAGEMENT SYSTEM — Seed Data
-- ============================================================================
-- Run after schema.sql to populate reference data.
-- Usage:  psql -U <user> -d naac_db -f seed.sql
-- ============================================================================

-- ============================================================================
-- 1. DEFAULT HOD (Super User) ACCOUNT
-- ============================================================================
-- Password: HOD@2024  (bcrypt hash with 12 salt rounds)
-- Generate new hash: node -e "require('bcryptjs').hash('HOD@2024',12).then(console.log)"

INSERT INTO users (full_name, email, password_hash, role, department, designation, is_active)
VALUES (
    'Dr. Rajesh Kumar',
    'hod@naac.edu',
    '$2b$12$eVpf4W7aNPQ1ZA3ycoab9Ovsr6yibfOAx4lutsGjR1iYtRsizVexu',
    'hod',
    'Computer Science',
    'Head of Department',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. CRITERIA — 7 NAAC Criteria
-- ============================================================================
-- Max marks based on NAAC accreditation framework weightage.

INSERT INTO criteria (id, code, name, max_marks) VALUES
    (1, 'C1', 'Curricular Aspects',                      150),
    (2, 'C2', 'Teaching-Learning and Evaluation',         200),
    (3, 'C3', 'Research, Innovations and Extension',      150),
    (4, 'C4', 'Infrastructure and Learning Resources',    100),
    (5, 'C5', 'Student Support and Progression',          100),
    (6, 'C6', 'Governance, Leadership and Management',    100),
    (7, 'C7', 'Institutional Values and Best Practices',  100)
ON CONFLICT (code) DO NOTHING;

-- Reset sequence to avoid PK conflicts on future inserts
SELECT setval('criteria_id_seq', 7, true);

-- ============================================================================
-- 3. SUB-CRITERIA — 20 entries across 7 criteria
-- ============================================================================
-- Based on NAAC Key Indicators (KIs) for affiliated/autonomous colleges.

INSERT INTO sub_criteria (id, criteria_id, code, name, description) VALUES

    -- ── C1: Curricular Aspects (3 sub-criteria) ─────────────────────────
    (1,  1, '1.1', 'Curricular Planning and Implementation',
        'Effective curriculum delivery through structured planning, adequate teaching-learning resources, and well-organized academic calendar.'),
    (2,  1, '1.2', 'Academic Flexibility',
        'Range of program options, choice-based credit systems, credit transfer policies, and interdisciplinary/multidisciplinary courses offered.'),
    (3,  1, '1.3', 'Curriculum Enrichment',
        'Integration of cross-cutting issues (gender, environment, sustainability, human values) and value-added courses beyond the syllabus.'),

    -- ── C2: Teaching-Learning and Evaluation (4 sub-criteria) ───────────
    (4,  2, '2.1', 'Student Enrollment and Profile',
        'Demand ratio, student diversity, reserved category admissions, and enrollment trends over the assessment period.'),
    (5,  2, '2.2', 'Catering to Student Diversity',
        'Strategies for advanced learners and slow learners, student mentoring, bridge courses, remedial coaching, and language labs.'),
    (6,  2, '2.3', 'Teaching-Learning Process',
        'Student-centric pedagogies, experiential learning, participative learning, ICT-enabled teaching, and innovative practices.'),
    (7,  2, '2.4', 'Teacher Quality',
        'Percentage of full-time teachers with PhD/NET/SET, faculty development programs, awards, and recognition received.'),

    -- ── C3: Research, Innovations and Extension (3 sub-criteria) ────────
    (8,  3, '3.1', 'Promotion of Research and Facilities',
        'Research grants received, seed money for research, teachers recognized as research guides, and research facilities.'),
    (9,  3, '3.2', 'Resource Mobilization for Research',
        'Grants from government and non-government agencies, industry-sponsored research, and consultancy revenue.'),
    (10, 3, '3.3', 'Innovation Ecosystem',
        'Innovation and start-up support, incubation centres, MoUs with industry, and technology transfer activities.'),

    -- ── C4: Infrastructure and Learning Resources (3 sub-criteria) ──────
    (11, 4, '4.1', 'Physical Facilities',
        'Availability and adequacy of classrooms, laboratories, library, sports facilities, ICT-enabled facilities, and other infrastructure.'),
    (12, 4, '4.2', 'Library as a Learning Resource',
        'Library automation, subscription to e-journals/e-books, usage statistics, and annual expenditure on library resources.'),
    (13, 4, '4.3', 'IT Infrastructure',
        'Internet bandwidth, Wi-Fi facilities, student-computer ratio, ICT-enabled classrooms, and smart campus initiatives.'),

    -- ── C5: Student Support and Progression (2 sub-criteria) ────────────
    (14, 5, '5.1', 'Student Support',
        'Scholarships, freeships, capability enhancement schemes, career counseling, competitive exam guidance, and grievance redressal.'),
    (15, 5, '5.2', 'Student Progression',
        'Placement records, higher education progression, qualifying in state/national/international examinations, and alumni contributions.'),

    -- ── C6: Governance, Leadership and Management (3 sub-criteria) ──────
    (16, 6, '6.1', 'Institutional Vision and Leadership',
        'Governance and leadership reflecting institutional vision, decentralization and participative management practices.'),
    (17, 6, '6.2', 'Strategy Development and Deployment',
        'Perspective/strategic plan, institutional development, functioning of IQAC, and implementation of quality initiatives.'),
    (18, 6, '6.3', 'Faculty Empowerment Strategies',
        'Professional development programs, performance appraisal system, financial support for conferences, and welfare measures.'),

    -- ── C7: Institutional Values and Best Practices (2 sub-criteria) ────
    (19, 7, '7.1', 'Institutional Values and Social Responsibilities',
        'Gender equity, environmental consciousness, waste management, green campus initiatives, and divyangjan-friendly facilities.'),
    (20, 7, '7.2', 'Best Practices and Institutional Distinctiveness',
        'Documentation of two best practices and one area of institutional distinctiveness contributing to academic excellence.')

ON CONFLICT (code) DO NOTHING;

-- Reset sequence
SELECT setval('sub_criteria_id_seq', 20, true);

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify after running:
-- SELECT c.code, c.name, c.max_marks, COUNT(sc.id) AS sub_count
-- FROM criteria c
-- LEFT JOIN sub_criteria sc ON sc.criteria_id = c.id
-- GROUP BY c.id ORDER BY c.id;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
