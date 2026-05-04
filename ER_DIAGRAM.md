# NAAC FMS — Entity Relationship Diagram

## Database Schema Overview

```mermaid
erDiagram
    users ||--o{ form_submissions : "submits"
    users ||--o{ uploaded_documents : "uploads"
    users ||--o{ activity_logs : "generates"
    users ||--o{ notifications : "receives (recipient)"
    users ||--o{ notifications : "sends (sender)"
    
    criteria ||--o{ sub_criteria : "contains"
    sub_criteria ||--o{ form_submissions : "has submissions"
    sub_criteria ||--o{ uploaded_documents : "has documents"
    form_submissions ||--o{ uploaded_documents : "links to"

    users {
        uuid id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        enum role "teacher | hod"
        varchar department
        varchar designation
        text subjects_taught
        boolean is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    criteria {
        serial id PK
        varchar code UK "C1..C7"
        varchar name
        integer max_marks
        timestamptz created_at
    }

    sub_criteria {
        serial id PK
        integer criteria_id FK
        varchar code UK "1.1, 1.2..."
        varchar name
        text description
        timestamptz created_at
    }

    form_submissions {
        uuid id PK
        uuid teacher_id FK
        integer sub_criteria_id FK
        jsonb form_data
        enum status "draft|submitted|verified|needs_revision"
        text hod_comment
        timestamptz submitted_at
        timestamptz verified_at
        uuid verified_by
        timestamptz updated_at
    }

    uploaded_documents {
        uuid id PK
        uuid teacher_id FK
        integer sub_criteria_id FK
        uuid form_submission_id FK
        varchar original_filename
        varchar stored_filename
        text file_path
        varchar file_type
        integer file_size
        enum upload_status "pending|uploaded|verified"
        timestamptz uploaded_at
    }

    activity_logs {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar target_type
        uuid target_id
        text description
        varchar ip_address
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid recipient_id FK
        uuid sender_id FK
        text message
        enum type "reminder|revision_request|verified|deadline"
        boolean is_read
        timestamptz created_at
    }
```

## Table Relationships

| Parent Table | Child Table | Relationship | Foreign Key |
|-------------|-------------|-------------|-------------|
| `users` | `form_submissions` | 1:N | `teacher_id` |
| `users` | `uploaded_documents` | 1:N | `teacher_id` |
| `users` | `activity_logs` | 1:N | `user_id` |
| `users` | `notifications` | 1:N | `recipient_id` |
| `users` | `notifications` | 1:N | `sender_id` |
| `criteria` | `sub_criteria` | 1:N | `criteria_id` |
| `sub_criteria` | `form_submissions` | 1:N | `sub_criteria_id` |
| `sub_criteria` | `uploaded_documents` | 1:N | `sub_criteria_id` |
| `form_submissions` | `uploaded_documents` | 1:N | `form_submission_id` |

## Unique Constraints

- `users.email` — one account per email
- `criteria.code` — unique criterion code (C1-C7)
- `sub_criteria.code` — unique sub-criterion code (1.1, 2.1, etc.)
- `form_submissions(teacher_id, sub_criteria_id)` — one submission per teacher per sub-criterion

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| `form_submissions` | `idx_form_sub_teacher` | `teacher_id` |
| `form_submissions` | `idx_form_sub_subcriteria` | `sub_criteria_id` |
| `uploaded_documents` | `idx_doc_teacher` | `teacher_id` |
| `uploaded_documents` | `idx_doc_form_submission` | `form_submission_id` |
| `activity_logs` | `idx_log_user_id` | `user_id` |
| `activity_logs` | `idx_log_action` | `action` |
| `activity_logs` | `idx_log_created_at` | `created_at` |
| `notifications` | `idx_notif_recipient` | `recipient_id` |
| `notifications` | `idx_notif_type` | `type` |
