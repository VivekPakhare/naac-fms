# NAAC File Management System (FMS)

A comprehensive web-based document management system for NAAC (National Assessment and Accreditation Council) accreditation preparation. The system enables teachers to submit criterion-wise data and documents, while HODs can review, verify, and export consolidated reports for institutional accreditation.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 8 |
| Styling | Tailwind CSS | v4 |
| Backend | Express.js | v5 |
| Database | PostgreSQL | v14+ |
| ORM | Prisma | v6 |
| Auth | JWT (jsonwebtoken) | bcryptjs |
| Export | ExcelJS (xlsx), Puppeteer (PDF) |
| Security | Helmet, express-rate-limit, xss-filters |

## Prerequisites

- **Node.js** v18+ (v20 LTS recommended)
- **PostgreSQL** v14+ (or use embedded-postgres for development)
- **npm** v9+

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd naac-fms
```

### 2. Install dependencies
```bash
# Root dependencies (concurrently)
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
cd ..
```

### 3. Configure environment
```bash
cp .env.example server/.env
# Edit server/.env with your database credentials
```

### 4. Database setup
```bash
cd server

# Option A: Use embedded PostgreSQL (recommended for development)
node start-dev.js
# This auto-creates the DB, pushes schema, seeds data, and starts the server.

# Option B: Use external PostgreSQL
npx prisma db push
npx prisma generate
node database/seed.js
npm start
```

### 5. Start development servers
```bash
# From root directory — starts both client and server
npm run dev

# Or individually:
cd server && node start-dev.js    # Backend: http://localhost:5000
cd client && npm run dev          # Frontend: http://localhost:5173
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **HOD** | hod@naac.edu | HOD@2024 |
| Teacher 1 | anita.sharma@naac.edu | Teacher@123 |
| Teacher 2 | vikram.patel@naac.edu | Teacher@123 |
| Teacher 3 | meera.desai@naac.edu | Teacher@123 |

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new teacher | No |
| POST | `/api/auth/login` | Login (rate-limited) | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update own profile | Yes |

### Teacher Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/teacher` | Teacher dashboard data | Teacher |
| GET | `/api/criteria` | List all NAAC criteria | Yes |
| GET | `/api/criteria/:id` | Get criterion with sub-criteria | Yes |
| POST | `/api/forms/submit/:subCriteriaCode` | Save/submit form data | Teacher |
| GET | `/api/forms/:subCriteriaCode` | Get form data | Teacher |

### Document Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/:subCriteriaCode` | Upload document | Teacher |
| DELETE | `/api/upload/:documentId` | Delete document | Teacher |
| GET | `/api/upload/my-documents` | List own documents | Teacher |

### HOD Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/hod/dashboard-stats` | Dashboard statistics | HOD |
| GET | `/api/hod/teachers-progress` | All teachers' progress matrix | HOD |
| GET | `/api/hod/teacher/:id/data/:code` | View teacher's criterion data | HOD |
| PUT | `/api/hod/review/:submissionId` | Verify or request revision | HOD |
| POST | `/api/hod/remind/:teacherId` | Send reminder to teacher | HOD |
| POST | `/api/hod/remind/all` | Bulk remind all teachers | HOD |
| GET | `/api/hod/audit-logs` | View audit trail | HOD |
| GET | `/api/hod/teachers` | List all teacher accounts | HOD |
| POST | `/api/hod/teachers` | Create teacher account | HOD |
| PUT | `/api/hod/teachers/:id/status` | Activate/deactivate teacher | HOD |
| GET | `/api/hod/export/progress-csv` | Export progress as CSV | HOD |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/notifications/send` | Send notification | HOD |
| GET | `/api/notifications/my` | Get own notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes |
| PUT | `/api/notifications/read-all` | Mark all as read | Yes |

### Export
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/export/excel` | Export own data as Excel | Teacher |
| GET | `/api/export/consolidated` | Export all data (consolidated) | HOD |

### System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |

## Project Structure

```
naac-fms/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DocumentUploadZone.jsx
│   │   │   ├── ReviewModal.jsx
│   │   │   └── SubCriterionForm.jsx
│   │   ├── context/           # React context (AuthContext)
│   │   ├── layouts/           # DashboardLayout
│   │   ├── pages/             # Route pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── HodDashboard.jsx
│   │   │   ├── CriterionFormPage.jsx
│   │   │   ├── MyDocuments.jsx
│   │   │   └── NotificationsPage.jsx
│   │   ├── services/          # API client (axios)
│   │   └── config/            # App configuration
│   └── package.json
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, rate-limit, security
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers
│   │   └── index.js           # Server entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── database/
│   │   ├── seed.sql           # SQL seed data
│   │   └── seed.js            # JS seeder script
│   ├── uploads/               # File storage directory
│   ├── test-integration.js    # Integration test suite
│   ├── start-dev.js           # Dev startup script
│   └── package.json
│
├── .env.example               # Environment variables template
├── README.md                  # This file
└── package.json               # Root package (concurrently)
```

## Security Features

- **JWT Authentication** with role-based access control (RBAC)
- **Rate Limiting** — 50 login attempts / 15min, 200 API requests / 15min
- **XSS Sanitization** on all request bodies
- **Helmet** HTTP security headers
- **File Upload Validation** — extension, MIME type, size (10MB max)
- **Path Traversal Prevention** on file uploads
- **Data Isolation** — teachers can only access their own data
- **CORS** restricted to frontend origin
- **Audit Trail** — all significant actions are logged

## Running Tests

```bash
cd server
node test-integration.js
```

The test suite covers: Authentication, Form CRUD, HOD Review workflow, Notifications, Data Isolation (RBAC), Exports, and Audit Trail (32 tests).

## Known Limitations

1. **Embedded PostgreSQL** — Development uses `embedded-postgres` which is not suitable for production. Use a standalone PostgreSQL instance in production.
2. **File Storage** — Files are stored on local disk. For production, integrate with S3 or similar cloud storage.
3. **PDF Export** — Requires Puppeteer (headless Chrome). May need additional system dependencies on Linux servers.
4. **Email Notifications** — Currently in-app only. Email integration (SMTP/SendGrid) is not yet implemented.
5. **Prisma Config** — Uses deprecated `package.json#prisma` config; should migrate to `prisma.config.ts` for Prisma 7+.

## License

MIT
