# Creative Intelligence Platform — Data Models

**Version 1.1 — December 2025**

---

## Overview

The platform uses DynamoDB with a multi-table design — one table per entity type. This provides clear separation of concerns, independent scaling, and simpler schema evolution.

**Tables:**
- `organizations`
- `users`
- `workspaces`
- `jobs`
- `uploads`
- `audit_events`

---

## Entity Relationships

```
┌──────────────────┐
│   Organization   │
└────────┬─────────┘
         │
         │ has_many
         ▼
┌──────────────────┐       ┌──────────────────┐
│      User        │       │    Workspace     │
└──────────────────┘       └────────┬─────────┘
                                    │
                                    │ has_many
                                    ▼
                           ┌──────────────────┐
                           │       Job        │
                           └────────┬─────────┘
                                    │
                                    │ has_many
                                    ▼
                           ┌──────────────────┐
                           │      Upload      │
                           └──────────────────┘

┌──────────────────┐
│   AuditEvent     │ ──── logs activity on all entities
└──────────────────┘
```

---

## Entity Definitions

### Organization

The root entity representing a client company. All other entities are scoped to an organization.

**Relationships:**
- has_many: User
- has_many: Workspace
- links_to: Hubspot (external CRM)

**Table: `organizations`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | Purpose |
|-----|-----|---------|
| `slug-index` | `slug` | Lookup by URL-safe identifier |
| `hubspot-index` | `hubspotId` | Lookup by Hubspot company ID |

---

### User

An individual account with authenticated access to the platform.

**Relationships:**
- belongs_to: Organization (single org per user in MVP)

**Roles:** `VIEWER`, `EDITOR`, `ADMIN`

**Auth:** Google SSO via Cognito

**Table: `users`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | SK | Purpose |
|-----|-----|-----|---------|
| `org-index` | `organizationId` | `createdAt` | List users by organization |
| `email-index` | `email` | — | Lookup by email (login flow) |
| `google-index` | `googleSubjectId` | — | Lookup by Google SSO subject |

---

### Workspace

A container for jobs and assets representing a recurring creative production context.

**Relationships:**
- belongs_to: Organization
- has_many: Job
- has_many: Upload
- links_to: Data Core (Google Drive folder)
- links_to: Training Core (HuggingFace repositories)

**Contains:** Request Agent prompt (dynamically generated based on workspace context)

**Table: `workspaces`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | SK | Purpose |
|-----|-----|-----|---------|
| `org-index` | `organizationId` | `createdAt` | List workspaces by organization |

---

### Job

A single creative project request within a workspace.

**Relationships:**
- belongs_to: Workspace
- belongs_to: Organization (denormalized)
- has_many: Upload
- links_to: Airtable (project tracking)
- links_to: Bubble CMS / app.kartel.ai (KartelProjectBrief)
- links_to: Frame.io (review tool)
- links_to: Figma (design review)

**Created via:** Request Agent conversation

**Table: `jobs`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | SK | Purpose |
|-----|-----|-----|---------|
| `workspace-index` | `workspaceId` | `createdAt` | List jobs by workspace |
| `org-index` | `organizationId` | `createdAt` | List all jobs for an org |
| `queue-index` | `status` | `requestedAt` | Production queue view |

---

### Upload

A platform-agnostic reference to a stored file with metadata and embeddings.

**Relationships:**
- belongs_to: Workspace
- belongs_to: Organization (denormalized)
- belongs_to: Job (optional)
- links_to: S3 or Google Drive (storage backend)

**Contains:**
- Platform-agnostic URI reference
- Extracted metadata
- Vector embeddings (indexed in OpenSearch)

**Table: `uploads`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | SK | Purpose |
|-----|-----|-----|---------|
| `workspace-index` | `workspaceId` | `createdAt` | List uploads by workspace |
| `job-index` | `jobId` | `createdAt` | List uploads by job |

---

### AuditEvent

An immutable log entry for API interactions.

**Relationships:**
- belongs_to: Organization
- belongs_to: User (or `SYSTEM` for automated actions)
- references: Any entity that was affected

**Created:** Automatically on every mutating API request

**Table: `audit_events`**

| Key | Attribute |
|-----|-----------|
| PK | `id` |

| GSI | PK | SK | Purpose |
|-----|-----|-----|---------|
| `org-index` | `organizationId` | `timestamp` | Org audit feed |
| `user-index` | `userId` | `timestamp` | User activity log |
| `resource-index` | `resourceType#resourceId` | `timestamp` | Resource history |

---

## External System Links

| Entity | External System | Link Type |
|--------|-----------------|-----------|
| Organization | Hubspot | CRM reference |
| Workspace | Google Drive | Data Core folder |
| Workspace | HuggingFace | Training Core repositories |
| Job | Airtable | Project tracking |
| Job | app.kartel.ai (Bubble) | KartelProjectBrief |
| Job | Frame.io | Review tool |
| Job | Figma | Design review |
| Upload | S3 | File storage |
| Upload | Google Drive | File storage |

---

## Data Integrity

DynamoDB does not enforce foreign keys. The application layer validates:

1. User.organizationId → existing Organization
2. Workspace.organizationId → existing Organization
3. Job.workspaceId → existing Workspace
4. Job.organizationId matches parent Workspace's organizationId
5. Upload.workspaceId → existing Workspace
6. Upload.jobId (when present) → existing Job in same Workspace

**Integrity check on job creation:** Required external links (Drive folder, HuggingFace repo) must exist before job can proceed to production.
