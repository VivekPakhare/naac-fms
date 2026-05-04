const ExcelJS = require('exceljs');
const { prisma } = require('../config/db');

// Fetch HOD for signature on all exports
async function getHod() {
  return prisma.user.findFirst({ where: { role: 'hod' }, select: { fullName: true, department: true, designation: true } });
}

const NAAC_BLUE = '003580';
const HEADER_BG = 'E8F0FE';
const ALT_ROW = 'F8F9FF';
const RED = 'FFCCCC';
const YELLOW = 'FFF3CD';
const GREEN = 'D4EDDA';
const GREY = 'E9ECEF';

function styleSummaryHeader(row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAAC_BLUE}` } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin' } };
  });
}

function styleDataHeader(row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${HEADER_BG}` } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
  });
}

function altRow(row, idx) {
  if (idx % 2 === 1) {
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ALT_ROW}` } };
    });
  }
}

// ═══════════════════════════════════════════════════════════
// TEACHER EXCEL EXPORT
// ═══════════════════════════════════════════════════════════
async function generateTeacherExcel(teacherId) {
  const user = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!user) throw new Error('User not found');

  const criteria = await prisma.criterion.findMany({
    orderBy: { id: 'asc' },
    include: { subCriteria: { orderBy: { code: 'asc' } } },
  });

  const submissions = await prisma.formSubmission.findMany({
    where: { teacherId },
    include: { subCriterion: true, documents: true },
  });

  const subMap = {};
  submissions.forEach((s) => { subMap[s.subCriteriaId] = s; });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NAAC File Management System';
  wb.created = new Date();
  wb.properties.title = `NAAC Documentation — ${user.fullName}`;

  // ── Sheet 1: Summary ─────────────────────────────────────
  const summary = wb.addWorksheet('Summary', { properties: { tabColor: { argb: `FF${NAAC_BLUE}` } } });
  summary.mergeCells('A1:G1');
  const titleCell = summary.getCell('A1');
  titleCell.value = `NAAC Documentation Summary — ${user.fullName}`;
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${NAAC_BLUE}` } };
  titleCell.alignment = { horizontal: 'center' };
  summary.getRow(1).height = 36;

  summary.getRow(2).values = ['Criterion', 'Name', 'Max Marks', 'Forms Completed', 'Docs Uploaded', 'Status', 'Completion %'];
  styleSummaryHeader(summary.getRow(2));

  summary.columns = [
    { width: 12 }, { width: 40 }, { width: 12 },
    { width: 18 }, { width: 16 }, { width: 14 }, { width: 16 },
  ];

  criteria.forEach((c, idx) => {
    const total = c.subCriteria.length;
    const completed = c.subCriteria.filter((sc) => {
      const s = subMap[sc.id];
      return s && ['submitted', 'verified'].includes(s.status);
    }).length;
    const docs = c.subCriteria.reduce((sum, sc) => {
      const s = subMap[sc.id];
      return sum + (s?.documents?.length || 0);
    }, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const status = completed === total && total > 0 ? '✓ Done' : completed > 0 ? 'In Progress' : 'Not Started';

    const row = summary.addRow([c.code, c.name, c.maxMarks, `${completed}/${total}`, docs, status, `${pct}%`]);
    altRow(row, idx);

    // Conditional color on completion %
    const pctCell = row.getCell(7);
    const bg = pct > 66 ? GREEN : pct > 33 ? YELLOW : RED;
    pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
  });

  // ── Sheets 2-8: Per Criterion ─────────────────────────────
  const shortNames = ['Curriculum', 'Teaching', 'Research', 'Infrastructure', 'Student Support', 'Governance', 'Values'];

  criteria.forEach((c, ci) => {
    const ws = wb.addWorksheet(`C${c.id} ${shortNames[ci]}`, {
      properties: { tabColor: { argb: ci < 3 ? 'FF4CAF50' : ci < 5 ? 'FF2196F3' : 'FFFF9800' } },
    });

    ws.mergeCells('A1:F1');
    const hdr = ws.getCell('A1');
    hdr.value = `Criterion ${c.id}: ${c.name} (${c.maxMarks} Marks)`;
    hdr.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAAC_BLUE}` } };
    hdr.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.getRow(2).values = ['Field Name', 'Value', 'Sub-Criterion', 'Document Name', 'Upload Date', 'Status'];
    styleDataHeader(ws.getRow(2));
    ws.columns = [{ width: 28 }, { width: 36 }, { width: 18 }, { width: 28 }, { width: 16 }, { width: 14 }];

    ws.views = [{ state: 'frozen', ySplit: 2 }];
    ws.autoFilter = { from: 'A2', to: 'F2' };

    let rowIdx = 0;
    c.subCriteria.forEach((sc) => {
      const sub = subMap[sc.id];
      const entries = sub?.formData?.entries || [];
      const docs = sub?.documents || [];

      if (entries.length === 0 && docs.length === 0) {
        const r = ws.addRow(['(No data)', '', sc.code, '', '', sub?.status || 'Not Started']);
        altRow(r, rowIdx++);
        return;
      }

      entries.forEach((entry) => {
        Object.entries(entry).forEach(([key, val]) => {
          const r = ws.addRow([
            key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            Array.isArray(val) ? val.join(', ') : String(val || ''),
            sc.code, '', '', sub?.status || '',
          ]);
          altRow(r, rowIdx++);
        });
      });

      docs.forEach((doc) => {
        const r = ws.addRow([
          '', '', sc.code,
          doc.originalFilename,
          doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '',
          doc.uploadStatus,
        ]);
        altRow(r, rowIdx++);
      });
    });
  });

  // ── Signature Sheet ──────────────────────────────────────
  const hod = await getHod();
  const sigSheet = wb.addWorksheet('Declaration', { properties: { tabColor: { argb: 'FF9C27B0' } } });
  sigSheet.columns = [{ width: 30 }, { width: 40 }];

  sigSheet.mergeCells('A1:B1');
  const sigTitle = sigSheet.getCell('A1');
  sigTitle.value = 'Declaration & Verification';
  sigTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  sigTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAAC_BLUE}` } };
  sigTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  sigSheet.getRow(1).height = 36;

  sigSheet.mergeCells('A3:B3');
  sigSheet.getCell('A3').value = 'This is to certify that the information provided in this NAAC documentation report is accurate and complete.';
  sigSheet.getCell('A3').font = { size: 11 };
  sigSheet.getCell('A3').alignment = { wrapText: true };
  sigSheet.getRow(3).height = 40;

  sigSheet.mergeCells('A4:B4');
  sigSheet.getCell('A4').value = 'All data entries and supporting documents have been reviewed and verified by the Head of Department.';
  sigSheet.getCell('A4').font = { size: 11 };
  sigSheet.getCell('A4').alignment = { wrapText: true };
  sigSheet.getRow(4).height = 40;

  const exportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  sigSheet.addRow([]);
  sigSheet.addRow(['Teacher Name:', user.fullName]).font = { size: 11 };
  sigSheet.addRow(['Designation:', user.designation || 'Faculty']).font = { size: 11 };
  sigSheet.addRow(['Department:', user.department || '']).font = { size: 11 };
  sigSheet.addRow(['Signature:', '_________________________']);
  sigSheet.addRow([]);
  sigSheet.addRow(['HOD Name:', hod?.fullName || 'Head of Department']).font = { bold: true, size: 11 };
  sigSheet.addRow(['Department:', hod?.department || user.department || '']).font = { size: 11 };
  sigSheet.addRow(['Signature:', '_________________________']);
  sigSheet.addRow([]);
  sigSheet.addRow(['Date:', exportDate]).font = { size: 11 };
  sigSheet.addRow(['Place:', '_________________________']).font = { size: 11 };
  sigSheet.addRow([]);
  sigSheet.addRow(['', '(Official Stamp / Seal)']).font = { italic: true, color: { argb: 'FF999999' } };

  return wb;
}

// ═══════════════════════════════════════════════════════════
// HOD CONSOLIDATED EXCEL
// ═══════════════════════════════════════════════════════════
async function generateConsolidatedExcel() {
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' },
    orderBy: { fullName: 'asc' },
  });

  const criteria = await prisma.criterion.findMany({
    orderBy: { id: 'asc' },
    include: { subCriteria: { orderBy: { code: 'asc' } } },
  });

  const allSubs = await prisma.formSubmission.findMany({
    include: { subCriterion: true, documents: true, teacher: { select: { fullName: true, department: true } } },
  });

  const allDocs = await prisma.uploadedDocument.findMany({
    include: {
      teacher: { select: { fullName: true } },
      subCriterion: { select: { code: true, name: true, criterion: { select: { code: true } } } },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  // Build lookup
  const subMap = {};
  allSubs.forEach((s) => {
    if (!subMap[s.teacherId]) subMap[s.teacherId] = {};
    subMap[s.teacherId][s.subCriteriaId] = s;
  });

  const dept = teachers[0]?.department || 'Department';
  const dateStr = new Date().toISOString().split('T')[0];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NAAC File Management System';
  wb.properties.title = `NAAC Consolidated Data — ${dept} — ${dateStr}`;

  // ── Sheet 1: Summary ─────────────────────────────────────
  const summary = wb.addWorksheet('Summary', { properties: { tabColor: { argb: `FF${NAAC_BLUE}` } } });

  const cols = ['Teacher Name', 'Department', ...criteria.map((c) => `${c.code}%`), 'Overall%', 'Verified', 'Last Active', 'Status'];
  summary.getRow(1).values = cols;
  styleSummaryHeader(summary.getRow(1));
  summary.columns = [
    { width: 24 }, { width: 20 },
    ...criteria.map(() => ({ width: 10 })),
    { width: 12 }, { width: 10 }, { width: 16 }, { width: 14 },
  ];

  let deptTotals = criteria.map(() => 0);
  let deptOverall = 0;

  teachers.forEach((t, ti) => {
    const tSubs = subMap[t.id] || {};
    const critPcts = criteria.map((c) => {
      const total = c.subCriteria.length;
      const done = c.subCriteria.filter((sc) => {
        const s = tSubs[sc.id];
        return s && ['submitted', 'verified'].includes(s.status);
      }).length;
      return total > 0 ? Math.round((done / total) * 100) : 0;
    });

    const overallTotal = criteria.reduce((s, c) => s + c.subCriteria.length, 0);
    const overallDone = criteria.reduce((s, c) => {
      return s + c.subCriteria.filter((sc) => {
        const sub = tSubs[sc.id];
        return sub && ['submitted', 'verified'].includes(sub.status);
      }).length;
    }, 0);
    const overallPct = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;

    const verified = criteria.reduce((s, c) => {
      return s + c.subCriteria.filter((sc) => tSubs[sc.id]?.status === 'verified').length;
    }, 0);

    const lastActive = t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleDateString('en-IN') : '—';
    const status = overallPct === 100 ? 'Complete' : overallPct > 0 ? 'In Progress' : 'Not Started';

    const row = summary.addRow([t.fullName, t.department || '', ...critPcts.map((p) => `${p}%`), `${overallPct}%`, verified, lastActive, status]);
    altRow(row, ti);

    critPcts.forEach((p, i) => { deptTotals[i] += p; });
    deptOverall += overallPct;
  });

  // Department total row
  if (teachers.length > 0) {
    const avgPcts = deptTotals.map((t) => `${Math.round(t / teachers.length)}%`);
    const avgOverall = `${Math.round(deptOverall / teachers.length)}%`;
    const totalRow = summary.addRow(['DEPARTMENT AVERAGE', '', ...avgPcts, avgOverall, '', '', '']);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${HEADER_BG}` } };
    });
  }

  // ── Sheets 2-8: Per Criterion ─────────────────────────────
  const shortNames = ['Curriculum', 'Teaching', 'Research', 'Infrastructure', 'Student Support', 'Governance', 'Values'];
  const STATUS_COLORS = { verified: GREEN, submitted: YELLOW, needs_revision: RED, draft: GREY };

  criteria.forEach((c, ci) => {
    const ws = wb.addWorksheet(`Criterion ${c.id}`, {
      properties: { tabColor: { argb: ci < 3 ? 'FF4CAF50' : ci < 5 ? 'FF2196F3' : 'FFFF9800' } },
    });

    ws.mergeCells('A1:F1');
    const hdr = ws.getCell('A1');
    hdr.value = `Criterion ${c.id}: ${c.name} (${c.maxMarks} Marks)`;
    hdr.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAAC_BLUE}` } };
    hdr.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // Collect field names from all entries
    const allFieldNames = new Set();
    teachers.forEach((t) => {
      const tSubs = subMap[t.id] || {};
      c.subCriteria.forEach((sc) => {
        const sub = tSubs[sc.id];
        const entries = sub?.formData?.entries || [];
        entries.forEach((e) => Object.keys(e).forEach((k) => allFieldNames.add(k)));
      });
    });

    const fields = [...allFieldNames];
    const headers = ['Teacher Name', 'Sub-Criterion', 'Status', ...fields.map((f) => f.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))];

    ws.getRow(2).values = headers;
    styleDataHeader(ws.getRow(2));
    ws.columns = [
      { width: 24 }, { width: 16 }, { width: 14 },
      ...fields.map(() => ({ width: 22 })),
    ];
    ws.views = [{ state: 'frozen', ySplit: 2 }];
    ws.autoFilter = { from: 'A2', to: ws.getCell(2, headers.length).address };

    let rowIdx = 0;
    teachers.forEach((t) => {
      const tSubs = subMap[t.id] || {};
      c.subCriteria.forEach((sc) => {
        const sub = tSubs[sc.id];
        const entries = sub?.formData?.entries || [];
        const status = sub?.status || 'not_started';

        if (entries.length === 0) {
          const r = ws.addRow([t.fullName, sc.code, status, ...fields.map(() => '')]);
          const bg = STATUS_COLORS[status] || GREY;
          r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
          altRow(r, rowIdx++);
        } else {
          entries.forEach((entry) => {
            const vals = fields.map((f) => {
              const v = entry[f];
              return Array.isArray(v) ? v.join(', ') : String(v || '');
            });
            const r = ws.addRow([t.fullName, sc.code, status, ...vals]);
            const bg = STATUS_COLORS[status] || GREY;
            r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
            altRow(r, rowIdx++);
          });
        }
      });
    });
  });

  // ── Sheet 9: Document Index ──────────────────────────────
  const docSheet = wb.addWorksheet('Document Index', { properties: { tabColor: { argb: 'FFFF5722' } } });
  docSheet.getRow(1).values = ['Teacher Name', 'Criterion', 'Sub-Criterion', 'Document Name', 'File Type', 'Upload Date', 'Status'];
  styleSummaryHeader(docSheet.getRow(1));
  docSheet.columns = [
    { width: 24 }, { width: 10 }, { width: 16 },
    { width: 36 }, { width: 10 }, { width: 16 }, { width: 14 },
  ];

  allDocs.forEach((doc, i) => {
    const r = docSheet.addRow([
      doc.teacher?.fullName || '',
      doc.subCriterion?.criterion?.code || '',
      doc.subCriterion?.code || '',
      doc.originalFilename,
      doc.fileType,
      doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '',
      doc.uploadStatus,
    ]);
    altRow(r, i);
  });

  // ── Signature Sheet ──────────────────────────────────────
  const hod = await getHod();
  const sigSheet = wb.addWorksheet('Declaration', { properties: { tabColor: { argb: 'FF9C27B0' } } });
  sigSheet.columns = [{ width: 30 }, { width: 40 }];

  sigSheet.mergeCells('A1:B1');
  const sigTitle = sigSheet.getCell('A1');
  sigTitle.value = 'Declaration & Verification';
  sigTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  sigTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAAC_BLUE}` } };
  sigTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  sigSheet.getRow(1).height = 36;

  sigSheet.mergeCells('A3:B3');
  sigSheet.getCell('A3').value = 'This is to certify that the consolidated NAAC documentation report for all faculty members is accurate and complete.';
  sigSheet.getCell('A3').font = { size: 11 };
  sigSheet.getCell('A3').alignment = { wrapText: true };
  sigSheet.getRow(3).height = 40;

  sigSheet.mergeCells('A4:B4');
  sigSheet.getCell('A4').value = 'All data entries, supporting documents, and records have been reviewed and verified by the Head of Department.';
  sigSheet.getCell('A4').font = { size: 11 };
  sigSheet.getCell('A4').alignment = { wrapText: true };
  sigSheet.getRow(4).height = 40;

  const exportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  sigSheet.addRow([]);
  sigSheet.addRow(['HOD Name:', hod?.fullName || 'Head of Department']).font = { bold: true, size: 12 };
  sigSheet.addRow(['Department:', hod?.department || dept]).font = { size: 11 };
  sigSheet.addRow(['Signature:', '_________________________']);
  sigSheet.addRow([]);
  sigSheet.addRow(['Total Teachers:', `${teachers.length}`]).font = { size: 11 };
  sigSheet.addRow(['Total Criteria:', '7']).font = { size: 11 };
  sigSheet.addRow([]);
  sigSheet.addRow(['Date:', exportDate]).font = { size: 11 };
  sigSheet.addRow(['Place:', '_________________________']).font = { size: 11 };
  sigSheet.addRow([]);
  sigSheet.addRow(['', '(Official Stamp / Seal)']).font = { italic: true, color: { argb: 'FF999999' } };

  return wb;
}

module.exports = { generateTeacherExcel, generateConsolidatedExcel };
