# Creative Intelligence Platform — Feature Scope

**Version 1.1 — December 2025**

---

## Authentication & User Management (M3)

### Google SSO Login

Users authenticate via Google identity provider through Cognito. No username/password flow. Session tokens issued on successful auth, used for all subsequent API calls.

### User Provisioning

New users are invited by email. On first login, the user is associated with the inviting organization. A user belongs to exactly one organization (MVP constraint).

### Role Assignment

Users are assigned one of four roles: Viewer, Editor, Admin, or Staff. Role determines API-level access control. Role changes take effect immediately.

---

## Organization Management (M2, M5)

### Organization CRUD (M2)

Organizations are created, updated, and listed via API. An organization represents a single client account (e.g., Toyota, Lidl). All other entities are scoped to an organization.

### Hubspot Sync (M5)

Organizations can be linked to a Hubspot CRM record. The link is stored as a reference ID. No bi-directional sync—Hubspot remains the CRM source of truth.

---

## Workspace Management (M2, M4, M5, M6)

### Workspace CRUD (M2)

Workspaces are containers for jobs and assets within an organization. A workspace represents a recurring creative production context (e.g., "Toyota Social Campaign Q1"). Workspaces store configuration and links to external resources.

### Data Core Link (M4)

A workspace is linked to a Google Drive folder that serves as the primary asset repository. On job creation, the system automatically creates a subfolder structure in Drive. Folder structure defined during M4 implementation.

### Training Core Link (M5)

A workspace can be linked to one or more HuggingFace repositories containing trained models or training data. Links are stored as references; the platform does not manage HuggingFace content directly.

### Request Agent Prompt (M6)

Each workspace has a configurable prompt that controls the behavior of the Request Agent during job intake. The prompt is dynamically augmented with workspace context and historical job data at runtime.

---

## Job Management (M2, M5, M6, M7)

### Job Listing & Viewing (M2)

Jobs within a workspace can be listed and viewed. A job represents a single creative project request. Jobs contain metadata and links to external systems.

### Job Creation via Request Agent (M6)

Jobs are created exclusively through a conversational intake flow with the Request Agent. The agent asks clarifying questions based on workspace context and historical data. The conversation concludes with a structured job record.

### External Links (M5)

Jobs can be linked to external project management and review tools:

- **Airtable:** project tracking reference (URL only, no sync)
- **Frame.io:** review tool reference
- **Figma:** design review reference

These are stored as metadata; the platform does not interact with these systems beyond storing the reference.

### Bubble Project Link (M7)

Jobs are linked to a project in app.kartel.ai (Bubble CMS). This link enables visibility into project milestones, deliverables, and conversations. When production starts, the system creates the Bubble project programmatically (requires Airdev API).

---

## Asset Management (M4)

### File Upload

Files are uploaded to a workspace's storage (S3 or Google Drive). Each upload creates an Upload entity with:

- Platform-agnostic URI reference
- Extracted metadata (file type, dimensions, duration, etc.)
- Generated embeddings for vector search

Supported file types: images, videos, PDFs, documents, spreadsheets, workflow.json, model files.

### Metadata Extraction

On upload, the system extracts metadata appropriate to file type. For images: dimensions, format, EXIF data. For documents: page count, text extraction. For video: duration, resolution.

### Embedding Generation

Uploaded files are processed to generate vector embeddings. Embeddings are indexed in OpenSearch for semantic search. Processing is asynchronous; upload completes before embedding finishes.

### Asset Search

Vector search endpoint allows querying assets within a workspace by semantic similarity. Used by the Request Agent for RAG and by users for asset discovery.

### Automatic Folder Structure

When a job is created, the system creates a standardized folder structure in the linked Google Drive. Structure defined during M4 implementation.

---

## Deliverables (M7)

### Deliverable Intake

Final outputs need to be captured and linked to jobs. Two possible intake paths (decision pending):

**Option A: Bubble Milestone Sync**
Deliverables attached to milestones in app.kartel.ai are automatically imported when a milestone completes. Requires webhook/polling, file transfer to S3, and milestone-to-job mapping. Avoids duplicate uploads but adds integration complexity.

**Option B: Manual Upload**
Production team uploads deliverables directly via API, specifying the target job. Simple to implement but adds a manual step.

**Hybrid Approach**
Both paths could coexist—automatic sync as primary, manual upload as fallback.

### Deliverable Storage

Deliverables are stored separately from working assets with a distinct storage path. Files are immutable after upload (versioning only). Retention policy TBD.

### Deliverable Access

Clients can list and download deliverables for jobs in their organization. Access is logged as an audit event. Deliverables are read-only for clients.

---

## Production Queue (M7)

### Queue View

Pending jobs across all organizations are visible in a production queue. Jobs can be filtered by workspace or organization.

### Start Production

Initiating production on a job triggers creation of a project in app.kartel.ai (via Airdev API). Audit event logged.

### Complete Job

Marking a job complete logs an audit event. Deliverables should be uploaded before completion.

### Integrity Validation

On job creation, the system validates that all required links exist (Drive folder, HuggingFace repo if applicable). Missing links block job creation or flag for manual resolution.

---

## Audit Trail (M2)

### Automatic Logging

Every mutating API request creates an AuditEvent. Events capture: timestamp, user, organization, action, affected resource, and request details.

### Audit Feed

Users can query audit events scoped to their organization. The feed surfaces activity relevant to clients: uploads, job creation, deliverables added.

### Full Audit Access

Staff can query unfiltered audit logs across all organizations for debugging and compliance.

---

## Request Agent (M6)

### Conversational Intake

Multi-turn conversation API for job creation. The agent:

1. Greets user with workspace-specific context
2. Asks clarifying questions based on workspace requirements
3. References historical jobs and assets via RAG
4. Collects all required information
5. Creates job record on completion

### Dynamic Prompt Generation

The agent's system prompt is assembled at runtime from:

- Base prompt template
- Workspace-specific configuration
- Organization context
- Recent job history summaries

### Learning Loop

Completed jobs feed back into the prompt refinement process. Mechanism TBD—likely periodic prompt updates based on job patterns rather than real-time learning.
