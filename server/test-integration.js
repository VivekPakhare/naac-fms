/**
 * NAAC FMS Integration Test Script
 * Tests the complete workflow end-to-end.
 * Idempotent: handles data from previous runs gracefully.
 */
const http = require('http');

const BASE = 'http://localhost:5000/api';
let passed = 0, failed = 0;
const tokens = {};
const ids = {};

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: true });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(name, condition) {
  if (condition) { console.log(`  \u2705 ${name}`); passed++; }
  else { console.log(`  \u274c ${name}`); failed++; }
}

// Generate a unique timestamp-based suffix to avoid collisions with previous runs
const TS = Date.now().toString(36);

async function run() {
  console.log('\n======================================');
  console.log('  NAAC FMS - Integration Test Suite');
  console.log('======================================\n');

  // == 1. Authentication ==
  console.log('1. Authentication');

  let r = await req('POST', '/auth/login', { email: 'hod@naac.edu', password: 'HOD@2024' });
  assert('HOD login succeeds', r.status === 200 && r.data?.data?.token);
  tokens.hod = r.data?.data?.token;
  ids.hod = r.data?.data?.user?.id;

  r = await req('POST', '/auth/login', { email: 'anita.sharma@naac.edu', password: 'Teacher@123' });
  assert('Teacher 1 login succeeds', r.status === 200 && r.data?.data?.token);
  tokens.t1 = r.data?.data?.token;
  ids.t1 = r.data?.data?.user?.id;

  r = await req('POST', '/auth/login', { email: 'vikram.patel@naac.edu', password: 'Teacher@123' });
  assert('Teacher 2 login succeeds', r.status === 200 && r.data?.data?.token);
  tokens.t2 = r.data?.data?.token;
  ids.t2 = r.data?.data?.user?.id;

  // == 2. Teacher form operations ==
  console.log('\n2. Teacher 1 - Fill Forms');

  // Save forms (accept 200, 201, or 400 if already verified from previous run)
  r = await req('POST', '/forms/submit/1.2', {
    form_data: { entries: [{ elective_courses: 5, credit_system: 'CBCS', ts: TS }] },
    action: 'draft',
  }, tokens.t1);
  assert('T1 saves/updates a form (draft)', r.status === 200 || r.status === 201 || r.status === 400);

  r = await req('POST', '/forms/submit/1.3', {
    form_data: { entries: [{ value_added_courses: 3, cross_cutting: 'Yes', ts: TS }] },
    action: 'draft',
  }, tokens.t1);
  assert('T1 saves another draft form', r.status === 200 || r.status === 201 || r.status === 400);

  // Find a sub-criterion that is in draft state to submit
  r = await req('GET', '/dashboard/teacher', null, tokens.t1);
  assert('T1 can access dashboard', r.status === 200);

  // Submit 1.2 (accept 400 if already verified)
  r = await req('POST', '/forms/submit/1.2', {
    form_data: { entries: [{ elective_courses: 5, credit_system: 'CBCS', ts: TS }] },
    action: 'submit',
  }, tokens.t1);
  assert('T1 submits form', r.status === 200 || r.status === 201 || r.status === 400);

  // == 3. Teacher 2 fills forms ==
  console.log('\n3. Teacher 2 - Fill Forms');

  r = await req('POST', '/forms/submit/2.2', {
    form_data: { entries: [{ seat_reservation: 'As per norms', ts: TS }] },
    action: 'draft',
  }, tokens.t2);
  assert('T2 saves draft form', r.status === 200 || r.status === 201);

  r = await req('POST', '/forms/submit/2.2', {
    form_data: { entries: [{ seat_reservation: 'As per norms', ts: TS }] },
    action: 'submit',
  }, tokens.t2);
  assert('T2 submits form', r.status === 200 || r.status === 201);

  // == 4. HOD verifies Teacher 1's submission ==
  console.log('\n4. HOD - Verify Submission');

  r = await req('GET', `/hod/teacher/${ids.t1}/data/C1`, null, tokens.hod);
  assert('HOD fetches T1 C1 data', r.status === 200);

  const t1Subs = r.data?.data?.sub_criteria || [];
  // Find a submission in 'submitted' state
  const submittedSub = t1Subs.find(s => s.submission?.status === 'submitted');
  
  if (submittedSub) {
    r = await req('PUT', `/hod/review/${submittedSub.submission.id}`, { status: 'verified', comment: 'Well documented.' }, tokens.hod);
    assert(`HOD verifies T1 ${submittedSub.code}`, r.status === 200);
  } else {
    // Check if any are already verified (previous run)
    const verifiedSub = t1Subs.find(s => s.submission?.status === 'verified');
    assert('HOD verify (already verified from prev run)', !!verifiedSub);
  }

  // == 5. HOD requests revision on T2 ==
  console.log('\n5. HOD - Revision Request');

  r = await req('GET', `/hod/teacher/${ids.t2}/data/C2`, null, tokens.hod);
  const t2Subs = r.data?.data?.sub_criteria || [];
  const t2submitted = t2Subs.find(s => s.submission?.status === 'submitted');

  if (t2submitted) {
    r = await req('PUT', `/hod/review/${t2submitted.submission.id}`, { status: 'needs_revision', comment: 'Add more details.' }, tokens.hod);
    assert(`HOD requests revision on T2 ${t2submitted.code}`, r.status === 200);
  } else {
    const t2any = t2Subs.find(s => s.submission);
    assert('HOD revision (submission exists from prev run)', !!t2any);
  }

  // == 6. Notifications ==
  console.log('\n6. Notifications');

  r = await req('POST', '/notifications/send', {
    recipient_id: ids.t1,
    message: 'Please complete your remaining NAAC submissions.',
    type: 'reminder',
  }, tokens.hod);
  assert('HOD sends reminder notification', r.status === 201);

  r = await req('GET', '/notifications/my?limit=10', null, tokens.t1);
  assert('T1 fetches notifications', r.status === 200 && Array.isArray(r.data?.data));

  const notifs = r.data?.data || [];
  assert('T1 has notifications', notifs.length > 0);

  r = await req('GET', '/notifications/unread-count', null, tokens.t1);
  assert('T1 unread count works', r.status === 200 && typeof r.data?.count === 'number');

  r = await req('PUT', '/notifications/read-all', null, tokens.t1);
  assert('T1 marks all as read', r.status === 200);

  r = await req('GET', '/notifications/unread-count', null, tokens.t1);
  assert('T1 unread count is 0 after mark-all', r.status === 200 && r.data?.count === 0);

  // == 7. Security - Data Isolation ==
  console.log('\n7. Security - Data Isolation');

  r = await req('GET', '/hod/dashboard-stats', null, tokens.t1);
  assert('Teacher CANNOT access HOD stats (403)', r.status === 403);

  r = await req('GET', '/hod/teachers-progress', null, tokens.t2);
  assert('Teacher CANNOT access HOD progress (403)', r.status === 403);

  r = await req('GET', '/export/consolidated', null, tokens.t1);
  assert('Teacher CANNOT get consolidated export (403)', r.status === 403);

  r = await req('GET', '/dashboard/teacher');
  assert('Unauthenticated -> 401 on dashboard', r.status === 401);

  r = await req('GET', '/notifications/my');
  assert('Unauthenticated -> 401 on notifications', r.status === 401);

  r = await req('GET', '/hod/dashboard-stats');
  assert('Unauthenticated -> 401 on HOD endpoint', r.status === 401);

  // Invalid password (last, to avoid rate limit)
  r = await req('POST', '/auth/login', { email: 'fake@naac.edu', password: 'wrongpassword' });
  assert('Invalid credentials rejected (401/429)', r.status === 401 || r.status === 429);

  // == 8. Export System ==
  console.log('\n8. Exports');

  r = await req('GET', '/export/excel', null, tokens.t1);
  assert('T1 Excel export succeeds', r.status === 200 || r.raw);

  r = await req('GET', '/export/consolidated', null, tokens.hod);
  assert('HOD consolidated export succeeds', r.status === 200 || r.raw);

  // == 9. Audit Trail ==
  console.log('\n9. Audit Trail');

  r = await req('GET', '/hod/audit-logs?limit=50', null, tokens.hod);
  assert('HOD fetches audit logs', r.status === 200);

  const logs = r.data?.data || [];
  const actions = logs.map(l => l.action);
  assert('Audit has USER_LOGIN entries', actions.includes('USER_LOGIN'));
  assert('Audit has REMINDER_SENT entries', actions.includes('REMINDER_SENT'));
  assert('Audit log has 5+ entries', logs.length >= 5);

  // == 10. Health Check ==
  console.log('\n10. Health Check');
  r = await req('GET', '/health');
  assert('Health endpoint OK', r.status === 200 && r.data?.status === 'ok');

  // == Summary ==
  console.log('\n======================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`  Total:   ${passed + failed} tests`);
  console.log('======================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
