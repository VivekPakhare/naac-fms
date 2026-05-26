-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('teacher', 'hod');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('draft', 'submitted', 'verified', 'needs_revision');

-- CreateEnum
CREATE TYPE "upload_status" AS ENUM ('pending', 'uploaded', 'verified');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('reminder', 'revision_request', 'verified', 'deadline');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'teacher',
    "department" VARCHAR(255),
    "designation" VARCHAR(255),
    "subjects_taught" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "reset_otp" TEXT,
    "reset_otp_expires_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "max_marks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_criteria" (
    "id" SERIAL NOT NULL,
    "criteria_id" INTEGER NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "teacher_id" UUID NOT NULL,
    "sub_criteria_id" INTEGER NOT NULL,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "status" "submission_status" NOT NULL DEFAULT 'draft',
    "hod_comment" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "verified_at" TIMESTAMPTZ,
    "verified_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "teacher_id" UUID NOT NULL,
    "sub_criteria_id" INTEGER NOT NULL,
    "form_submission_id" UUID,
    "original_filename" VARCHAR(500) NOT NULL,
    "stored_filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(1000) NOT NULL,
    "file_type" VARCHAR(20) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "upload_status" "upload_status" NOT NULL DEFAULT 'pending',
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" UUID,
    "description" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recipient_id" UUID NOT NULL,
    "sender_id" UUID,
    "message" TEXT NOT NULL,
    "type" "notification_type" NOT NULL DEFAULT 'reminder',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_department" ON "users"("department");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_code_key" ON "criteria"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sub_criteria_code_key" ON "sub_criteria"("code");

-- CreateIndex
CREATE INDEX "idx_sub_criteria_criteria_id" ON "sub_criteria"("criteria_id");

-- CreateIndex
CREATE INDEX "idx_sub_criteria_code" ON "sub_criteria"("code");

-- CreateIndex
CREATE INDEX "idx_form_sub_teacher" ON "form_submissions"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_form_sub_subcriteria" ON "form_submissions"("sub_criteria_id");

-- CreateIndex
CREATE INDEX "idx_form_sub_status" ON "form_submissions"("status");

-- CreateIndex
CREATE INDEX "idx_form_sub_submitted_at" ON "form_submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_teacher_subcriteria" ON "form_submissions"("teacher_id", "sub_criteria_id");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_documents_stored_filename_key" ON "uploaded_documents"("stored_filename");

-- CreateIndex
CREATE INDEX "idx_doc_teacher" ON "uploaded_documents"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_doc_sub_criteria" ON "uploaded_documents"("sub_criteria_id");

-- CreateIndex
CREATE INDEX "idx_doc_form_submission" ON "uploaded_documents"("form_submission_id");

-- CreateIndex
CREATE INDEX "idx_doc_upload_status" ON "uploaded_documents"("upload_status");

-- CreateIndex
CREATE INDEX "idx_doc_uploaded_at" ON "uploaded_documents"("uploaded_at");

-- CreateIndex
CREATE INDEX "idx_log_user_id" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_log_action" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "idx_log_target" ON "activity_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_log_created_at" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_notif_recipient" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "idx_notif_sender" ON "notifications"("sender_id");

-- CreateIndex
CREATE INDEX "idx_notif_type" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "idx_notif_created_at" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "sub_criteria" ADD CONSTRAINT "sub_criteria_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_sub_criteria_id_fkey" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_sub_criteria_id_fkey" FOREIGN KEY ("sub_criteria_id") REFERENCES "sub_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
