# SalesPulse AI - Project Status

## Brand

- **Name**: SalesPulse AI
- **Tagline**: "Entrena. Practica. Cierra."
- **Colors**: Gradient blue (#3B82F6) to cyan (#06B6D4), dark slate backgrounds
- **Logo**: SVG pulse/heartbeat motif with gradient
- **Production URL**: https://d37iyzx8veabdy.cloudfront.net

---

## Completed Phases

### Phase 1: Admin System & User Validation

- Cognito `admins` group configured; admin users created via `setup_admin.py`
- User validation flow with statuses: pending, active, suspended, expired
- Temporal access control with `validFrom` / `validUntil` fields
- Admin dashboard pages: `/admin/users`, `/admin/scenarios`, `/admin/guidelines`, `/admin/analytics`
- Schema updated with `status`, `validFrom`, `validUntil`, `voice`, `UserStatus` enum
- Authorization enforced on all resolvers via `auth_helpers.py` (status + time window checks)
- AuthGuard: branded screens for pending, suspended, and expired users with Logo
- Toast notifications for all admin CRUD operations
- Audit logging (CloudWatch structured JSON) for admin actions

### Phase 2: Expert Sales Analysis System

- Research-based 6-category scoring framework:
  - Rapport Building (15%), Discovery/SPIN Questions (25%), Value Presentation (20%), Objection Handling (20%), Closing Techniques (10%), Communication Skills (10%)
- Complete rewrite of `analyze_conversation.py` with multi-step analysis pipeline
- Claude 3.5 Sonnet via Amazon Bedrock (us-east-1) with Amazon Nova Pro as automatic fallback
- Coach persona: Alejandro Mendez (20+ years experience)
- Integrates SPIN Selling, Challenger Sale, Sandler, and MEDDIC frameworks
- Subcriteria per category with behavioral indicators
- Calibrated scoring rubric (0-100) with evidence-based scoring using transcript quotes
- Spanish business culture context throughout
- Server-side weighted score recalculation
- Admin-configurable evaluation criteria via guidelines CRUD
- Re-analyze button with animated loading steps

### Phase 3: Realistic AI Client Personas

- Deep persona system prompt with emotional dynamics and 7 reaction rules
- Voice selection per persona (8 OpenAI Realtime voices with admin voice selector)
- 8 expert scenarios seeded across difficulty levels (2 easy, 3 medium, 3 hard)
- Admin client creator with full persona configuration form
- Natural Spanish speech patterns (muletillas, onomatopoeia)
- Personality-specific phone greetings; AI client answers the call first

### Phase 4: Frontend Excellence

- Modern SalesPulse AI branding with responsive design
- ARIA labels, skeleton loaders, error boundary, empty states
- Pre-call briefing, real-time visual feedback, call timer, quick notes
- Post-call summary with self-reflection prompts
- Student/admin navigation separation, breadcrumbs, admin badge, mobile hamburger menu
- Full component library: Logo, StatsCard, EmptyState, SkeletonLoader, Toast, ErrorBoundary, Card, Badge
- Custom animations, glass-morphism, gradient text, branded 404 page, branded loading screen

### Phase 5: Infrastructure & Security

- Auth checks enforced on all Lambda resolvers
- Audit logging for admin actions (CloudWatch structured JSON)
- WAFv2 rate limiting (1,000 requests per 5 minutes per IP)
- CDK stack with Bedrock permissions and CloudFront security headers (HSTS, CSP)
- Backward-compatible schema field additions with graceful missing-field handling

### Phase 6: Testing

- **222 total tests** across backend and frontend
- Backend: unit tests for auth, validation, analysis prompt, category weights, frameworks, conversations, analytics, audit helpers, and E2E integration
- Frontend: component tests (Logo, EmptyState, StatsCard, Toast, SkeletonLoader, Card, Badge), page tests (scenarios, analysis, training, analysis-flow), hook tests (useGraphQL), and library tests (achievements, achievements-extended)
- Frontend build verified (Next.js 15 static export, 17 pages)
- CI/CD auto-deploys on push to main via CodePipeline

---

## Improvements Summary

### Conversations
- AI client answers the phone first for a realistic cold-call experience
- Deep persona system with emotional dynamics and personality-driven reactions
- Natural Spanish muletillas and colloquial speech patterns

### Analysis
- Multi-model support: Claude 3.5 Sonnet (primary) with Amazon Nova Pro (fallback)
- Evidence-based scoring with direct transcript quotes
- Admin-configurable evaluation guidelines and weights

### Gamification
- Achievement system with multiple unlock tiers
- Leaderboard with ranking across users
- Stats cards and progress tracking on dashboard

### Marketing & Onboarding
- Testimonials section, "trusted by" institution badges, feature highlights
- Daily tips and onboarding guide for new users

### Accessibility
- ARIA labels on interactive elements
- Skeleton loaders for perceived performance
- Error boundary with recovery options
- Branded empty states with action prompts

---

## Deployment

- **Region**: eu-west-1
- **Pipeline**: CodePipeline (Source -> Build -> Deploy), auto-triggers on push to `main`
- **Production URL**: https://d37iyzx8veabdy.cloudfront.net
- **Frontend**: Next.js 15 static export -> S3 + CloudFront
- **Backend**: Lambda resolvers (Python 3.11), AppSync GraphQL, DynamoDB, Cognito

---

## Running Tests

```bash
# Backend tests (all)
cd backend && python3 -m pytest tests/ -v

# Backend E2E tests only
cd backend && python3 -m pytest tests/test_e2e.py -v -m e2e

# Frontend tests
cd frontend && npx vitest run
```

## Seeding Data

```bash
cd backend/scripts

# Seed everything (scenarios + guidelines)
python3 seed_all.py

# Seed with clearing existing data first
python3 seed_all.py --clear

# Individual seeds
python3 seed_scenarios.py
python3 seed_guidelines.py
```

---

## Known Configuration Requirements

- **OpenAI API Key**: Stored in AWS Secrets Manager as `dev/openai-api-key`. Required for real-time voice conversation sessions via the OpenAI Realtime API.
- **Amazon Bedrock Access**: Claude 3.5 Sonnet model access must be enabled in the Bedrock console (us-east-1). Requires completing the Anthropic use-case form. Amazon Nova Pro is used automatically as a fallback while access is pending.
