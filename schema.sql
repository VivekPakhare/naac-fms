-- ============================================================================
-- NAAC FILE MANAGEMENT SYSTEM — Complete Database Schema
-- ============================================================================
-- PostgreSQL 14+
-- Usage: psql -U postgres -d naac_db -f schema.sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enum Types ──────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('teacher', 'hod');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'verified', 'needs_revision');
CREATE TYPE upload_status AS ENUM ('pending', 'uploaded', 'verified');
CREATE TYPE notification_type AS ENUM ('reminder', 'revision_request', 'verified', 'deadline');

-- ── Users Table ─────────────────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'teacher',
    department      VARCHAR(255),
    designation     VARCHAR(255),
    subjects_taught TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Criteria Table ──────────────────────────────────────────────────────────

CREATE TABLE criteria (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(10) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    max_marks   INTEGER NOT NULL DEFAULT 100,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sub-Criteria Table ──────────────────────────────────────────────────────

CREATE TABLE sub_criteria (
    id              SERIAL PRIMARY KEY,
    criteria_id     INTEGER NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    code            VARCHAR(10) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_criteria_code ON sub_criteria(code);

-- ── Form Submissions Table ──────────────────────────────────────────────────

CREATE TABLE form_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sub_criteria_id INTEGER NOT NULL REFERENCES sub_criteria(id) ON DELETE CASCADE,
    form_data       JSONB NOT NULL DEFAULT '{}',
    status          submission_status NOT NULL DEFAULT 'draft',
    hod_comment     TEXT,
    submitted_at    TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    verified_by     UUID,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_teacher_subcriteria UNIQUE (teacher_id, sub_criteria_id)
);

CREATE INDEX idx_form_sub_teacher ON form_submissions(teacher_id);
CREATE INDEX idx_form_sub_subcriteria ON form_submissions(sub_criteria_id);

-- ── Uploaded Documents Table ────────────────────────────────────────────────

CREATE TABLE uploaded_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sub_criteria_id     INTEGER NOT NULL REFERENCES sub_criteria(id) ON DELETE CASCADE,
    form_submission_id  UUID REFERENCES form_submissions(id) ON DELETE SET NULL,
    original_filename   VARCHAR(500) NOT NULL,
    stored_filename     VARCHAR(500) NOT NULL,
    file_path           TEXT NOT NULL,
    file_type           VARCHAR(20) NOT NULL,
    file_size           INTEGER NOT NULL,
    upload_status       upload_status NOT NULL DEFAULT 'pending',
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_teacher ON uploaded_documents(teacher_id);
CREATE INDEX idx_doc_sub_criteria ON uploaded_documents(sub_criteria_id);
CREATE INDEX idx_doc_form_submission ON uploaded_documents(form_submission_id);
CREATE INDEX idx_doc_upload_status ON uploaded_documents(upload_status);
CREATE INDEX idx_doc_uploaded_at ON uploaded_documents(uploaded_at);

-- ── Activity Logs Table ─────────────────────────────────────────────────────

CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    description TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_user_id ON activity_logs(user_id);
CREATE INDEX idx_log_action ON activity_logs(action);
CREATE INDEX idx_log_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_log_created_at ON activity_logs(created_at);

-- ── Notifications Table ─────────────────────────────────────────────────────

CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    message      TEXT NOT NULL,
    type         notification_type NOT NULL DEFAULT 'reminder',
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id);
CREATE INDEX idx_notif_sender ON notifications(sender_id);
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_created_at ON notifications(created_at);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
