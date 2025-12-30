# Creative Intelligence Platform — Project Context

## Project Overview

You're assisting the Kartel AI platform engineering team in building the Creative Intelligence Platform — a unified system for managing creative workspaces, assets, and AI-powered content generation. The platform connects client organizations with Kartel's production capabilities through self-service interfaces.

## Company Context

Kartel AI is a creative brief and artist booking platform connecting clients with artists for creative projects. The existing production app is at app.kartel.ai (built on Bubble). This new platform provides the data infrastructure, API layer, and AI capabilities to support and extend that system.

## Technical Stack

- **Cloud:** AWS (serverless-first)
- **Database:** DynamoDB (single-table design with GSIs)
- **Search:** OpenSearch Serverless (AOSS) for vector search / embeddings
- **Auth:** Cognito with Google SSO
- **API:** API Gateway + Lambda
- **Storage:** S3 + Google Drive (platform-agnostic URI references)
- **IaC:** CloudFormation / SAM
- **External integrations:** Airtable, Bubble CMS, HuggingFace, Hubspot, Frame.io, Figma

## Core Data Model

Six central entities:

| Entity | Purpose |
|--------|---------|
| Organization | Client company (Toyota, Lidl, etc.) — central access control unit |
| User | Individual account with roles (Admin/Editor/Viewer), belongs to one org |
| Workspace | Container for jobs, links to Data Core + Training Core, holds Request Agent prompt |
| Job | Individual creative project, links to Airtable/Bubble/review tools |
| Upload | Platform-agnostic asset reference with metadata and embeddings |
| AuditEvent | Immutable log of all API interactions |

## Current Development Phase

**Active milestone:** M1-M3 (Foundation)
- M1: Data models & DynamoDB infrastructure
- M2: REST API with audit logging
- M3: Cognito authentication with Google SSO

**Upcoming:** Storage layer, external integrations, Request Agent (AI job intake)

## Key Constraints & Decisions

- MVP: Users belong to single organization (multi-org deferred)
- Clients never log into app.kartel.ai directly
- Platform team provides APIs and reference implementations, not customer-facing frontends
- All file references use platform-agnostic URIs
- ComfyUI workflow storage: decision pending (Git vs CMS vs private repo)

## How to Help

- Provide concise, practical technical guidance (avoid verbose explanations)
- Default to AWS serverless patterns unless asked otherwise
- Reference existing infrastructure decisions when relevant
- Flag when suggestions might conflict with stated constraints
- When writing code, prefer TypeScript for Lambda, Python for data processing
