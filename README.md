# NAAC File Management System

A web portal for Indian colleges to manage NAAC accreditation documentation digitally.

## 🏗️ Project Structure

```
inovatex/
├── client/                     # React frontend (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── layouts/            # Layout wrappers (Sidebar, Header, etc.)
│   │   ├── pages/              # Page-level components
│   │   ├── services/
│   │   │   └── api.js          # Axios instance with JWT interceptors
│   │   ├── App.jsx             # Root component
│   │   ├── App.css
│   │   ├── index.css           # Tailwind CSS entry
│   │   └── main.jsx            # React entry point
│   ├── vite.config.js          # Vite config with Tailwind + API proxy
│   └── package.json
│
├── server/                     # Express.js backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (User, Criterion, etc.)
│   │   └── seed.js             # Seed script for initial data
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # Prisma PostgreSQL connection
│   │   │   ├── jwt.js          # JWT configuration
│   │   │   └── multer.js       # File upload configuration
│   │   ├── controllers/        # Route handler logic
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # JWT verify + role authorization
│   │   ├── routes/             # Express route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── criteria.routes.js
│   │   │   ├── upload.routes.js
│   │   │   └── export.routes.js
│   │   ├── services/           # Business logic layer
│   │   └── index.js            # Express entry point
│   ├── uploads/                # File storage directory
│   ├── .env.example
│   └── package.json
│
├── .env.example                # Root environment template
├── .gitignore
├── package.json                # Root scripts (concurrently)
└── README.md
```

## 🛠️ Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | React.js + Vite + Tailwind CSS v4   |
| Backend        | Node.js + Express.js                |
| Database       | PostgreSQL                          |
| ORM            | Prisma                              |
| Authentication | JWT + bcrypt                        |
| File Uploads   | Multer (local filesystem)           |
| PDF Export     | Puppeteer                           |
| Excel Export   | ExcelJS                             |
| HTTP Client    | Axios                               |

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **PostgreSQL** v14+ running locally or remotely

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url> inovatex
cd inovatex

# Install all dependencies (root + client + server)
npm run install:all
```

### 2. Configure Environment Variables

```bash
# Copy the template
cp server/.env.example server/.env

# Edit server/.env with your values:
#   DATABASE_URL=postgresql://username:password@localhost:5432/naac_db
#   JWT_SECRET=<generate-a-strong-secret>
```

### 3. Set Up the Database

```bash
# Create the PostgreSQL database
createdb naac_db

# Run Prisma migrations to create tables
cd server
npx prisma migrate dev --name init

# Generate the Prisma client
npx prisma generate

# Seed initial data (admin user + 7 NAAC criteria)
npm run seed
```

**Default admin credentials after seeding:**
- Email: `admin@naac.edu`
- Password: `admin123`

### 4. Run the Development Servers

```bash
# From root — starts both client (port 5173) and server (port 5000)
npm run dev
```

Or run them separately:

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

### 5. Verify

- **Frontend:** http://localhost:5173
- **Backend health check:** http://localhost:5000/api/health
- **Prisma Studio (DB viewer):** `cd server && npx prisma studio`

## 📊 Database Schema

```
users (teacher | hod)
  ├──1:N──▶ form_submissions ◀──N:1── sub_criteria ──N:1──▶ criteria
  ├──1:N──▶ uploaded_documents ◀──N:1── sub_criteria
  │                             ◀──N:0..1── form_submissions
  ├──1:N──▶ activity_logs
  └──1:N──▶ notifications (recipient / sender)
```

**7 Tables:** `users`, `criteria`, `sub_criteria`, `form_submissions`,
`uploaded_documents`, `activity_logs`, `notifications`

**Schema files:**
- Raw SQL: `server/database/schema.sql` + `server/database/seed.sql`
- Prisma ORM: `server/prisma/schema.prisma` + `server/prisma/seed.js`

## 🔐 User Roles

| Role      | Description                                   |
| --------- | --------------------------------------------- |
| `teacher` | Can fill forms and upload files                |
| `hod`     | Super user — manage all data, users, exports   |

**Default credentials (after seeding):**
- HOD: `hod@naac.edu` / `HOD@2024`
- Teacher: `anita.sharma@naac.edu` / `Teacher@123`
- Teacher: `vikram.patel@naac.edu` / `Teacher@123`
- Teacher: `meera.desai@naac.edu` / `Teacher@123`

## 📁 API Routes

| Method | Endpoint                       | Status | Description            |
| ------ | ------------------------------ | ------ | ---------------------- |
| POST   | `/api/auth/register`           | ✅     | Register teacher       |
| POST   | `/api/auth/login`              | ✅     | Login (rate-limited)   |
| GET    | `/api/auth/me`                 | ✅     | Get current profile    |
| PUT    | `/api/auth/profile`            | ✅     | Update own profile     |
| GET    | `/api/criteria`                | 501    | List all criteria      |
| GET    | `/api/criteria/:id`            | 501    | Get single criterion   |
| GET    | `/api/criteria/:id/sub`        | 501    | Get sub-criteria       |
| POST   | `/api/upload`                  | 501    | Upload a file          |
| GET    | `/api/upload/:id`              | 501    | Download a file        |
| DELETE | `/api/upload/:id`              | 501    | Delete a file          |
| GET    | `/api/export/pdf/:criterionId` | 501    | Export as PDF          |
| GET    | `/api/export/excel/:criterionId` | 501  | Export as Excel        |
| GET    | `/api/health`                  | ✅     | Server health check    |

## 📝 License

ISC
