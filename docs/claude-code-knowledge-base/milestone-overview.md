# Creative Intelligence Platform — Milestone Overview

## What We're Building

A unified platform to manage creative workspaces, assets, and AI-powered content generation. It connects client organizations with Kartel's production capabilities through APIs and self-service tools.

---

## Development Sequence

```
M1 Data Foundation
     ↓
M2 API Layer
     ↓
     ├──→ M3 Authentication (Google SSO + Roles)
     │
     ├──→ M4 Storage & Assets (Files, Search, Embeddings)
     │
     ├──→ M5 External Integrations (HuggingFace, Hubspot, Review Tools)
     │
     ├──→ M6 Request Agent (AI Job Intake)
     │
     └──→ M7 Production Queue & Delivery
```

**Critical Path:** M1 → M2 → M7

After M2 completes, most remaining work can happen in parallel.

---

## Milestone Summaries

### M1: Data Foundation

**Purpose:** Define how all platform data is structured and stored.

**Business Value:** Creates the underlying data architecture that everything else depends on. Establishes the six core entities: Organizations, Users, Workspaces, Jobs, Uploads, and Audit Events.

---

### M2: API Layer

**Purpose:** Build the interface that all systems use to read and write data.

**Business Value:** Enables programmatic access to all platform capabilities. Includes automatic audit logging so every action is tracked for compliance and debugging.

---

### M3: Authentication & Access Control

**Purpose:** Secure login via Google SSO and role-based permissions.

**Business Value:** Clients and team members can log in securely. Users only see data belonging to their organization. Three permission levels (Viewer, Editor, Admin) control what each person can do.

---

### M4: Storage & Asset Management

**Purpose:** Handle file uploads, metadata extraction, and AI-powered search.

**Business Value:** 
- Unified file handling across S3 and Google Drive
- Automatic metadata extraction (dimensions, duration, page count, etc.)
- Vector search enables finding assets by meaning, not just keywords
- Automatic folder creation when jobs start

---

### M5: External Integrations

**Purpose:** Connect the platform to production tools and external services.

**Business Value:**
- **HuggingFace:** Link AI models and training data to workspaces
- **Hubspot:** Keep organization records in sync with CRM
- **Frame.io / Figma / Airtable:** Store project links for easy access

---

### M6: Request Agent (AI Job Intake)

**Purpose:** AI-powered conversational system for creating new jobs.

**Business Value:** 
- Clients describe what they need through natural conversation
- Agent asks smart follow-up questions based on workspace context
- References past jobs and assets to suggest relevant options
- Reduces back-and-forth and captures complete briefs upfront

---

### M7: Production Queue & Delivery

**Purpose:** Complete workflow from job request to client delivery.

**Business Value:**
- Production queue shows all pending work across clients
- Automatic project creation in app.kartel.ai when production starts
- Secure deliverable storage and client access
- Integrity checks ensure all required links exist before work begins

---

## External Dependencies

| Item | Depends On | Risk Level |
|------|------------|------------|
| M7: Automatic project creation | Airdev API availability | Medium |
| M5: ComfyUI workflow storage | Architecture decision pending | Low |

---

## Summary

The platform builds from data foundations (M1-M2) through security (M3) to the client-facing capabilities: asset management (M4), tool integrations (M5), AI intake (M6), and production delivery (M7). The architecture allows most work to proceed in parallel after the API layer is complete.
