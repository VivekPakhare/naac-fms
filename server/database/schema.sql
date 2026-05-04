-- ============================================================================
-- NAAC FILE MANAGEMENT SYSTEM — PostgreSQL Database Schema
-- ============================================================================
--
-- Entity-Relationship Diagram
-- ============================
--
--  ┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
--  │   criteria    │1──────*│  sub_criteria     │1──────*│ form_submissions │
--  │──────────────│        │──────────────────│        │──────────────────│
--  │ id (PK)      │        │ id (PK)          │        │ id (PK, UUID)    │
--  │ code         │        │ criteria_id (FK) │        │ teacher_id (FK)  │
--  │ name         │        │ code             │        │ sub_criteria_id  │
--  │ max_marks    │        │ name             │        │ form_data (JSONB)│
--  └──────────────┘        │ description      │        │ status           │
--                          └──────────────────┘        │ hod_comment      │
--                                   │                  └──────────────────┘
--                                   │                           │
--                                   │1                         0..1
--                                   │                           │
--                                   ▼                           ▼
--                          ┌──────────────────────────────────────────┐
--                          │          uploaded_documents               │
--                          │──────────────────────────────────────────│
--                          │ id (PK, UUID)                            │
--                          │ teacher_id (FK → users)                  │
--                          │ sub_criteria_id (FK → sub_criteria)      │
--                          │ form_submission_id (FK, nullable)        │
--                          │ original_filename, stored_filename       │
--                          │ file_path, file_type, file_size          │
--                          │ upload_status                            │
--                          └──────────────────────────────────────────┘
--
--  ┌──────────────┐
--  │    users      │1──────*  form_submissions
--  │──────────────│1──────*  uploaded_documents
--  │ id (PK, UUID)│1──────*  activity_logs
--  │ full_name    │1──────*  notifications (as recipient)
--  │ email        │1──────*  notifications (as sender)
--  │ role         │
--  │ department   │
--  │ designation  │
--  └──────────────┘
--
--  ┌──────────────────┐         ┌──────────────────┐
--  │  activity_logs    │         │  notifications    │
--  │──────────────────│         │──────────────────│
--  │ id (PK, UUID)    │         │ id (PK, UUID)    │
--  │ user_id (FK)     │         │ recipient_id(FK) │
--  │ action           │         │ sender_id (FK)   │
--  │ target_type      │         │ message          │
--  │ target_id        │         │ type             │
--  │ description      │         │ is_read          │
--  │ ip_address       │         │ created_at       │
--  │ created_at       │         └──────────────────┘
--  └──────────────────┘
--
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('teacher', 'hod');

CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'verified', 'needs_revision');

CREATE TYPE upload_status AS ENUM ('pending', 'uploaded', 'verified');

CREATE TYPE notification_type AS ENUM ('reminder', 'revision_request', 'verified');

-- ============================================================================
-- 2. USERS
-- ============================================================================

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'teacher',
    department      VARCHAR(255),
    designation     VARCHAR(255),
    subjects_taught TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Partial index: only active users queried in most operations
CREATE INDEX idx_users_email           ON users (email);
CREATE INDEX idx_users_role            ON users (role);
CREATE INDEX idx_users_department      ON users (department);
CREATE INDEX idx_users_active          ON users (is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 3. CRITERIA (7 NAAC Criteria — seed data)
-- ============================================================================

CREATE TABLE criteria (
    id              SERIAL          PRIMARY KEY,
    code            VARCHAR(10)     NOT NULL UNIQUE,  -- e.g. 'C1'
    name            VARCHAR(255)    NOT NULL,
    max_marks       INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SUB-CRITERIA (20 entries — seed data)
-- ============================================================================

CREATE TABLE sub_criteria (
    id              SERIAL          PRIMARY KEY,
    criteria_id     INT             NOT NULL,
    code            VARCHAR(10)     NOT NULL UNIQUE,  -- e.g. '1.1', '2.3'
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sub_criteria_criteria
        FOREIGN KEY (criteria_id)
        REFERENCES criteria (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sub_criteria_criteria_id ON sub_criteria (criteria_id);
CREATE INDEX idx_sub_criteria_code        ON sub_criteria (code);

-- ============================================================================
-- 5. FORM SUBMISSIONS
-- ============================================================================

CREATE TABLE form_submissions (
    id                UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id        UUID                NOT NULL,
    sub_criteria_id   INT                 NOT NULL,
    form_data         JSONB               NOT NULL DEFAULT '{}',
    status            submission_status   NOT NULL DEFAULT 'draft',
    hod_comment       TEXT,
    submitted_at      TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_form_sub_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_form_sub_sub_criteria
        FOREIGN KEY (sub_criteria_id)
        REFERENCES sub_criteria (id)
        ON DELETE CASCADE,

    -- One draft/submission per teacher per sub-criterion at a time
    CONSTRAINT uq_teacher_subcriteria
        UNIQUE (teacher_id, sub_criteria_id)
);

CREATE INDEX idx_form_sub_teacher      ON form_submissions (teacher_id);
CREATE INDEX idx_form_sub_subcriteria  ON form_submissions (sub_criteria_id);
CREATE INDEX idx_form_sub_status       ON form_submissions (status);
CREATE INDEX idx_form_sub_submitted_at ON form_submissions (submitted_at);

-- GIN index for efficient JSONB queries on form_data
CREATE INDEX idx_form_sub_form_data    ON form_submissions USING GIN (form_data);

-- ============================================================================
-- 6. UPLOADED DOCUMENTS
-- ============================================================================

CREATE TABLE uploaded_documents (
    id                   UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id           UUID            NOT NULL,
    sub_criteria_id      INT             NOT NULL,
    form_submission_id   UUID,                              -- nullable: file may exist before submission
    original_filename    VARCHAR(500)    NOT NULL,
    stored_filename      VARCHAR(255)    NOT NULL UNIQUE,   -- UUID-based name on disk
    file_path            VARCHAR(1000)   NOT NULL,          -- server path, NOT public URL
    file_type            VARCHAR(20)     NOT NULL,
    file_size            INT             NOT NULL,
    upload_status        upload_status   NOT NULL DEFAULT 'pending',
    uploaded_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_doc_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doc_sub_criteria
        FOREIGN KEY (sub_criteria_id)
        REFERENCES sub_criteria (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doc_form_submission
        FOREIGN KEY (form_submission_id)
        REFERENCES form_submissions (id)
        ON DELETE SET NULL,

    -- Restrict allowed file types
    CONSTRAINT chk_file_type
        CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc', 'xlsx', 'xls')),

    -- File size must be positive and ≤ 50 MB (52428800 bytes)
    CONSTRAINT chk_file_size
        CHECK (file_size > 0 AND file_size <= 52428800)
);

CREATE INDEX idx_doc_teacher           ON uploaded_documents (teacher_id);
CREATE INDEX idx_doc_sub_criteria      ON uploaded_documents (sub_criteria_id);
CREATE INDEX idx_doc_form_submission   ON uploaded_documents (form_submission_id);
CREATE INDEX idx_doc_upload_status     ON uploaded_documents (upload_status);
CREATE INDEX idx_doc_uploaded_at       ON uploaded_documents (uploaded_at);

-- ============================================================================
-- 7. ACTIVITY LOGS
-- ============================================================================

CREATE TABLE activity_logs (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL,
    action          VARCHAR(100)    NOT NULL,     -- e.g. 'UPLOADED_FILE', 'SUBMITTED_FORM'
    target_type     VARCHAR(50),                  -- e.g. 'form_submission', 'document'
    target_id       UUID,
    description     TEXT,
    ip_address      VARCHAR(45),                  -- supports IPv6 (max 45 chars)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_log_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_log_user_id       ON activity_logs (user_id);
CREATE INDEX idx_log_action        ON activity_logs (action);
CREATE INDEX idx_log_target        ON activity_logs (target_type, target_id);
CREATE INDEX idx_log_created_at    ON activity_logs (created_at);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    UUID                NOT NULL,
    sender_id       UUID,                                    -- nullable: system notifications
    message         TEXT                NOT NULL,
    type            notification_type   NOT NULL DEFAULT 'reminder',
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notif_recipient
        FOREIGN KEY (recipient_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notif_sender
        FOREIGN KEY (sender_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_notif_recipient       ON notifications (recipient_id);
CREATE INDEX idx_notif_sender          ON notifications (sender_id);
CREATE INDEX idx_notif_is_read         ON notifications (is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_type            ON notifications (type);
CREATE INDEX idx_notif_created_at      ON notifications (created_at);

-- ============================================================================
-- 9. AUTO-UPDATE updated_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
