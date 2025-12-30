# Creative Intelligence Platform — Development Milestones

**Version 2.1 — December 2025**

---

## Development Tracks

The work is organized into three parallel tracks that can progress concurrently after initial foundation work.

| Track | Focus | Milestones |
|-------|-------|------------|
| **Track A: Core Platform** | Data layer, API, Auth | M1 → M2 → M3 |
| **Track B: Storage & Assets** | File handling, embeddings, search | M4 |
| **Track C: Integrations & AI** | External systems, Request Agent | M5 → M6 |
| **Track D: Production** | Queue, delivery, automation | M7 |

---

## Dependency Graph

```
M1 (Data Models)
 │
 └──► M2 (REST API)
       │
       ├──► M3 (Auth)
       │     │
       │     ├──► M4 (Storage)
       │     │
       │     └──► M5 (External Integrations)
       │
       ├──► M6 (Request Agent)
       │
       └──► M7 (Production Queue)
```

**Critical Path:** M1 → M2 → M7

**Parallel Opportunities:**
- After M2 completes, M3/M4/M5/M6/M7 can all proceed in parallel
- M4 storage design can begin during M2

---

## Milestone Definitions

### M1: Data Models

**Objective:** Design and implement the data layer for all platform entities.

**Scope:**

- DynamoDB single-table schema design for all six entities (Organization, User, Workspace, Job, Upload, AuditEvent)
- GSI design for access patterns (org lookup, user lookup, workspace jobs, audit trails)
- Platform-agnostic URI specification for asset references
- Entity validation schemas

**Out of Scope:**

- API endpoint implementation (M2)
- File storage adapters (M4)
- External service connections (M5)

**Deliverables:**

1. DynamoDB table(s) deployed to dev environment
2. URI specification document
3. Data model documentation with access patterns

**Dependencies:** None (starting point)

**Blocks:** M2, M4 (schema design)

---

### M2: REST API

**Objective:** Implement API endpoints for all resource operations with automatic audit logging.

**Scope:**

- CRUD endpoints for all six entities
- Audit logging middleware — AuditEvent created on every mutating request
- Request validation and error handling
- OpenAPI/Swagger documentation generation

**Out of Scope:**

- Authentication/authorization (M3)
- File upload handling (M4)
- External service webhooks (M5)

**Deliverables:**

1. Working API endpoints for all entities (unauthenticated)
2. Automatic audit trail generation verified
3. OpenAPI specification published
4. Integration test suite

**Dependencies:** M1 (data layer must exist)

**Blocks:** M3, M5

---

### M3: Authentication & Authorization

**Objective:** Implement Google SSO login flow and role-based access control.

**Scope:**

- Google identity provider configuration in Cognito
- Organization-scoped access control — users see only their org's data
- Role-based permissions (Admin, Editor, Viewer) enforced at API layer
- User provisioning flow (invite, first login, org assignment)
- Session management

**Out of Scope:**

- Multi-org user support (deferred per MVP constraint)
- Custom identity providers beyond Google
- Fine-grained resource-level permissions

**Deliverables:**

1. Working Google SSO login flow
2. Role permissions enforced on API endpoints
3. User management API endpoints
4. Auth documentation

**Dependencies:** M2 (API must exist to secure)

**Blocks:** M4 (authenticated uploads), M5 (authenticated integrations)

---

### M4: Storage & Asset Management

**Objective:** Implement unified storage layer with multiple backends and vector search.

**Scope:**

- S3 storage adapter with URI generation following spec from M1
- Google Drive integration for Data Core workspaces
- Upload processing pipeline: receive file → store → extract metadata → generate embeddings
- Embeddings indexing in OpenSearch
- Vector search endpoint for RAG queries
- Automatic folder structure creation on Job creation
- Upload entity management (create, list, delete, metadata update)

**Out of Scope:**

- HuggingFace model storage (M5)
- Training data organization UI (M5)
- Embedding model selection/tuning (M6)

**Deliverables:**

1. Unified upload API supporting S3 and Google Drive backends
2. Metadata extraction working for common file types (images, PDFs, documents)
3. Embeddings pipeline operational
4. Vector search endpoint returning relevant results
5. Automatic Drive folder creation on Job creation

**Dependencies:** 
- M1 (Upload entity schema)
- M3 (authenticated upload endpoints)

**Blocks:** None

**Parallel Note:** Schema design and S3 adapter can begin during M2. Full implementation requires M3.

---

### M5: External Integrations

**Objective:** Connect platform to production tools and external services.

**Scope:**

This milestone covers multiple integration streams that can be worked in parallel:

**5A: Training Core**
- HuggingFace repository linking to Workspaces
- Model registry: list, link, version tracking
- Training data organization within Workspace context

**5B: CRM & Review Tools**
- Hubspot integration for Organization management
- Frame.io / Figma link storage on Jobs (metadata only, not deep integration)
- Airtable link storage on Jobs (URL reference only)

**Out of Scope:**

- Programmatic project creation on app.kartel.ai (M7)
- ComfyUI workflow storage (decision pending — blocked)
- Deep Frame.io/Figma API integration
- Airtable bi-directional sync (deferred)

**Deliverables:**

1. HuggingFace repos linkable to Workspaces
2. Hubspot org sync operational
3. Review tool and Airtable links stored and retrievable

**Dependencies:** M3 (auth required for all integrations)

**Blocks:** None

**Parallel Note:** Sub-streams 5A–5B can be worked concurrently.

**Note:** Bubble CMS data (KartelProjectBrief, milestones, deliverables, conversations) is already replicated to DynamoDB and accessible via the REST API from M2.

---

### M6: Request Agent

**Objective:** Build AI-powered job intake system with context-aware questioning.

**Scope:**

- Migration of existing Creative Brief Agent to new infrastructure
- Dynamic prompt generation based on:
  - Workspace configuration
  - Organization context
  - Historical job data (from DynamoDB)
- Conversational API for job intake
- Admin interface for prompt editing per Workspace
- Learning loop: completed jobs feed back into prompt refinement

**Out of Scope:**

- RAG pipeline with vector search (enhancement, deferred)
- Autonomous job execution
- Multi-modal input processing (images in conversation)
- Real-time collaboration features

**Deliverables:**

1. Conversational job intake API endpoint
2. Prompt management interface (admin)
3. Context-aware clarifying questions demonstrated
4. Learning loop data pipeline operational

**Dependencies:** M2 (API access to job/workspace data)

**Blocks:** None

---

### M7: Production Queue & Delivery

**Objective:** Complete the production workflow from job request to client delivery.

**Scope:**

- Production job queue: list pending jobs, filter by workspace/org
- Programmatic project creation on app.kartel.ai (requires Airdev coordination)
- Deliverable storage: final outputs linked to Jobs
- Client delivery: secure access to deliverables
- Public audit event feed for clients (uploads, status changes, deliverables ready)
- System integrity validation: ensure all required links exist (Drive, HuggingFace)

**Out of Scope:**

- Client-side deliverable approval workflow (TBD, deferred)
- Automated staffing/artist assignment
- Payment/invoicing integration

**Deliverables:**

1. Production queue API and reference UI
2. app.kartel.ai project creation automated (pending Airdev API)
3. Deliverable upload and client access flow
4. Integrity checks running on job creation
5. Audit feed endpoint for clients

**Dependencies:**
- M2 (API)
- Airdev: programmatic project creation API

**Blocks:** None (final milestone)

---

## Open Decisions

These items need resolution before or during development:

| Decision | Impacts | Owner | Target |
|----------|---------|-------|--------|
| ComfyUI workflow storage (Git vs CMS vs private repo) | M5, future workflow management | TBD | Before M5 |
| Client deliverable approval workflow scope | M7 | TBD | During M7 |
| Airdev API availability for programmatic project creation | M7 | Airdev | Before M7 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Airdev API delays | Medium | High | M7 deliverable storage can proceed independently; project creation becomes manual fallback |
| Multi-org requirement emerges during MVP | Low | High | Current schema supports it; auth layer is the constraint |
