# NAAC FMS — Demo Script (5 Minutes)

> Video walkthrough script for judges. Each section is timed to fit a 5-minute demo.

---

## Minute 0:00 – 1:00 | Teacher Login & Dashboard

1. **Open browser** → Navigate to `http://localhost:5173`
2. **Show Login Page** — "This is the NAAC File Management System login page. Teachers and HODs authenticate with JWT-based security."
3. **Login as Teacher**: `anita.sharma@naac.edu` / `Teacher@123`
4. **Dashboard Overview** — "The teacher dashboard shows:
   - 7 NAAC criteria cards with progress percentages
   - Color-coded status indicators (draft/submitted/verified/needs revision)
   - Overall completion percentage
   - Quick-access notification bell with unread count"
5. **Point out** the sidebar navigation: Dashboard, Criteria 1-7, Documents, Notifications

---

## Minute 1:00 – 2:00 | Fill Research Form & Upload Document

1. **Click Criterion 3** (Research, Innovations and Extension)
2. **Show Sub-criteria** — "Each criterion is broken into sub-criteria matching NAAC's Key Indicators"
3. **Click Sub-criterion 3.1** (Promotion of Research)
4. **Fill the form** — Add a research entry:
   - Research Grant: "DST-SERB Project"
   - Amount: "15,00,000"
   - Year: "2023-24"
5. **Click Save as Draft** — "Data is saved without submission"
6. **Upload a document** — Drag-and-drop or click to upload a PDF
   - "The system validates file type (PDF, DOC, XLSX, images) and enforces a 10MB size limit"
7. **Click Submit** — "Now the form is locked and sent to the HOD for review"

---

## Minute 2:00 – 3:00 | Teacher Export & Notifications

1. **Navigate to Documents page** — "Teachers can view all their uploaded documents in one place, filtered by criterion"
2. **Click Export Excel** — "Teachers can download their own submitted data as an Excel workbook, organized by criteria"
3. **Open the downloaded Excel** briefly to show structure
4. **Click Notification Bell** — "Teachers receive notifications for:
   - HOD reminders
   - Submission verifications
   - Revision requests with HOD comments
   - Upcoming deadline alerts"
5. **Logout** from teacher account

---

## Minute 3:00 – 4:00 | HOD Dashboard & Review

1. **Login as HOD**: `hod@naac.edu` / `HOD@2024`
2. **Show HOD Dashboard** — "The HOD gets a consolidated view:
   - Total teachers, submissions pending review, verified count
   - Overall department completion percentage
   - Teacher progress matrix showing each teacher's status across all 7 criteria"
3. **Click on a teacher row** to view their submissions
4. **Review a submission** — Click a submitted form:
   - Read the teacher's data
   - View uploaded documents
   - **Verify**: Click "Verify" with comment "Excellent documentation"
   - "The teacher is automatically notified of the verification"
5. **Request Revision** on another submission:
   - Add comment: "Please add citation details for research paper #3"
   - "The teacher sees this in their notifications and can re-submit"

---

## Minute 4:00 – 5:00 | HOD Export & Audit Trail

1. **Click Export Consolidated** — "HOD can download a consolidated Excel report covering all teachers across all 7 criteria"
2. **Show the Excel structure** — Multiple sheets, one per criterion
3. **Navigate to Audit Logs** — "Every action is tracked for accountability:
   - Login events
   - Form submissions
   - Document uploads
   - Review decisions
   - Notification dispatches"
4. **Show filter options** — Filter by user, action type, date range
5. **Closing statement**: "The NAAC FMS provides a complete, secure, role-based workflow for NAAC accreditation data collection, review, and export — all with a modern, responsive UI and comprehensive audit trail."

---

## Key Points to Highlight

| Feature | Where to Show |
|---------|--------------|
| Role-based access control | HOD vs Teacher dashboards |
| Real-time notifications | Bell icon with unread count |
| Document management | Upload zone with drag-drop |
| Data validation | Form fields with inline errors |
| Security | Rate limiting, XSS protection, JWT auth |
| Export system | Excel + PDF generation |
| Audit trail | Activity logs with timestamps |
| Responsive design | Resize browser to show mobile layout |
