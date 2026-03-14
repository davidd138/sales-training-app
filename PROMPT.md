# PROMPT.md — Sales Training App: Ralph Loop Master Plan

You are an expert **sales training platform architect**, **commercial sales methodology specialist**, and **AI prompt engineer**. You are building a production-grade sales training application for commercial salespeople (energy sector, Spain). You must act as both **project owner** and **technical lead**, making expert decisions about sales methodology, AI behavior, and platform features.

## Your Identity & Expertise

You are simultaneously:
1. **Sales Training Expert** — Deep knowledge of SPIN Selling, Challenger Sale, Sandler Method, MEDDIC, Solution Selling. You understand what makes a great commercial salesperson: active listening, need discovery, value proposition alignment, objection handling, consultative closing.
2. **AI Prompt Engineer** — You craft system prompts that make LLMs behave like realistic humans, not robots. You understand persona design, emotional modeling, conversation dynamics, and voice interaction UX.
3. **Full-Stack Architect** — AWS CDK, Next.js, AppSync, Lambda, DynamoDB, Cognito, OpenAI Realtime API.

## Current State

- **Repo**: `/Users/davidperezmartinez/claude_code/claude_code/sales-training-app`
- **Production URL**: `https://d37iyzx8veabdy.cloudfront.net`
- **AWS Account**: `890742600627`, Region: `eu-west-1`, IAM user: `claude_code`
- **Cognito Pool**: `eu-west-1_lp5QJAgf1`, Client: `7djdf4vlvrlfr30la9bad24q7s`
- **AppSync**: `https://zyorp7bunvdffah5b6hxlarpge.appsync-api.eu-west-1.amazonaws.com/graphql`
- **GitHub**: `davidd138/sales-training-app`, branch: `main`
- **CI/CD**: AWS CodePipeline (auto-deploys on push to main)

The app currently works as a demo: anyone can register, no admin validation, basic analysis prompts, limited scenario personas, no role-based access.

---

## PHASE 1: Admin System & User Validation (HIGHEST PRIORITY)

### 1.1 Cognito Admin Group
- Create a Cognito group called `admins` in user pool `eu-west-1_lp5QJAgf1`
- Create admin users (professors) directly via AWS CLI/SDK in Cognito and add them to the `admins` group
- Create at least one admin user: `david@admin.com` (or use existing user and promote to admin)

### 1.2 User Validation Flow
- **Registration**: Users register normally (email + password + name). After email verification, their account exists but is **disabled/pending**.
- **Pending state**: Add a `status` field to the `users` DynamoDB table: `pending | active | suspended | expired`
- **Access period**: Add `validFrom` and `validUntil` ISO date fields to the `users` table
- **Admin validation**: Admin users can see a list of pending users and approve/reject them, setting the access period
- **Authorization**: ALL resolvers (except syncUser) must check:
  1. User exists in users table
  2. User status is `active`
  3. Current date is within `validFrom`–`validUntil` range
  4. If any check fails, return "Access denied: account pending approval" or "Access expired"
- **Frontend**: Non-admin users who are pending see a "Your account is pending approval" screen instead of the dashboard. Expired users see "Your access has expired, contact your professor."

### 1.3 Admin Dashboard (New Frontend Section)
- New route group `(admin)` with admin-only pages
- **Admin guard**: Check if user is in `admins` group (from Cognito token claims `cognito:groups`)
- **Pages**:
  - `/admin/users` — List all users with status, approve/reject pending users, set/extend access periods, suspend users
  - `/admin/scenarios` — Create/edit/delete scenarios with full persona configuration (move existing /scenarios creation here)
  - `/admin/clients` — Create and customize AI client personas (personality, voice, emotional profile, behavior patterns)
  - `/admin/criteria` — Manage analysis criteria and scoring rubrics (replaces current basic guidelines)
  - `/admin/analytics` — View all users' performance, not just own
- **New GraphQL operations** (admin-only, check `cognito:groups` contains `admins`):
  - `listAllUsers`, `updateUserStatus(userId, status, validFrom, validUntil)`
  - `deleteScenario(id)`, `updateScenario(id, input)`
  - Admin versions of existing mutations with elevated permissions

### 1.4 Schema Changes
Update `backend/schema/schema.graphql`:
- Add `status`, `validFrom`, `validUntil` to `User` type
- Add admin-only queries/mutations
- Add `UserStatus` enum: `pending`, `active`, `suspended`, `expired`
- Add `voice` field to `Scenario` type (for OpenAI voice selection)
- Expand scoring criteria types

---

## PHASE 2: Expert Sales Analysis System (CRITICAL — This is what makes the app valuable)

### 2.1 Research-Based Analysis Criteria

Replace the current simplistic 5-category scoring with a comprehensive, research-backed framework. You MUST research and implement proper sales methodology:

**Core Categories (weighted scoring)**:
1. **Opening & Rapport (15%)** — First impression, warm-up, finding common ground, building trust, professional tone, matching client energy
2. **Need Discovery / SPIN (25%)** — Situation questions, Problem questions, Implication questions, Need-payoff questions. Quality of questioning technique, active listening signals, summarizing client needs
3. **Value Proposition & Presentation (20%)** — Solution-need alignment, benefit framing (not feature dumping), use of proof points/case studies, ROI articulation, customization to client's specific situation
4. **Objection Handling (20%)** — Acknowledgment of concern, empathy, reframing technique, evidence-based responses, turning objections into opportunities, not being defensive
5. **Closing & Next Steps (10%)** — Trial closes, assumptive closes, clear next steps, commitment obtaining, urgency creation (without pressure), follow-up planning
6. **Communication Skills (10%)** — Clarity, pace, confidence, avoiding filler words, professional vocabulary, adaptability to client's communication style

**Sub-criteria per category** (each scored 0-100 with specific behavioral indicators):
- For each category, define 3-5 sub-criteria with clear "what good looks like" descriptions
- Provide specific examples of behaviors that score 90+, 70-89, 50-69, below 50
- Consider the scenario difficulty when scoring (harder scenarios = more lenient on certain aspects)

### 2.2 Improved Analysis Prompt (analyze_conversation.py)

The current prompt is too basic. Create a comprehensive analysis system:
- Use Claude 3.5 Sonnet via Bedrock (upgrade from nova-micro) for better analysis quality — model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Multi-step analysis: first analyze transcript structure, then score each category with evidence
- Include specific quotes from the transcript as evidence for each score
- Provide actionable, specific improvement suggestions (not generic advice)
- Compare against best practices for the specific scenario type and difficulty
- Consider cultural context (Spanish business culture)
- Score relative to the scenario difficulty (a 70 on a hard scenario is different from a 70 on easy)
- The analysis MUST feel like feedback from a senior sales coach, not a generic AI evaluation

### 2.3 Admin-Configurable Criteria
- Professors can create/edit scoring rubrics from the admin panel
- Each rubric defines: categories, weights, sub-criteria, behavioral indicators
- The analysis Lambda dynamically loads the active rubric
- Default rubric pre-seeded with the expert framework above
- Allow per-scenario rubric overrides

---

## PHASE 3: Realistic AI Client Personas (CRITICAL — This is what makes training effective)

### 3.1 System Prompt Engineering for OpenAI Realtime API

The current system prompt in `useRealtimeTraining.ts` is too simple. Create prompts that produce genuinely human-like interactions:

**Persona Architecture** (each client must have):
- **Demographics**: Name, age range, years in role, background
- **Personality Profile**: Big Five traits (openness, conscientiousness, extraversion, agreeableness, neuroticism) mapped to conversation behaviors
- **Emotional State**: Starting mood, triggers that change mood (positive and negative), stress level
- **Communication Style**: Verbose/concise, formal/informal, uses jargon?, interrupts?, asks counter-questions?
- **Decision-Making Style**: Analytical (needs data), Driver (needs results), Amiable (needs trust), Expressive (needs vision)
- **Hidden Agenda**: What they really want but won't say directly (e.g., "I want to impress my board", "I'm scared of change")
- **Pain Points**: Specific problems they're experiencing (high bills, unreliable service, regulatory pressure)
- **Buying Signals**: What makes them lean in (ROI data, case studies, risk mitigation)
- **Red Lines**: What makes them shut down or get frustrated (pushy selling, not listening, generic pitches)

**Behavioral Instructions for OpenAI**:
- NEVER be uniformly polite — real clients get impatient, distracted, skeptical, excited
- Interrupt the salesperson if they monologue too long (after 30+ seconds of talking)
- Show frustration if the salesperson doesn't listen to what was said
- Get excited and engaged when the salesperson addresses a real pain point
- Be evasive about budget unless trust is established
- Mention a competitor if the salesperson doesn't differentiate
- Check phone/get distracted in easy scenarios, be laser-focused in hard ones
- Use realistic filler words, hesitations, and thinking pauses ("mmm", "a ver", "bueno...")
- React to the salesperson's tone — match enthusiasm or pushback on fake excitement
- Have a realistic time constraint ("tengo otra reunión en 15 minutos")

### 3.2 Voice Selection Per Persona
- OpenAI Realtime API voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`
- Map each persona to an appropriate voice (age, gender, energy level)
- Store voice selection in scenario/persona configuration
- Admin can change voice per client persona
- Pass the voice dynamically in the `session.update` message

### 3.3 Pre-Built Expert Scenarios
Create at least 8 diverse scenarios with deep, realistic personas:

1. **Easy — The Enthusiast**: Ana Martín (existing, enhance persona depth significantly)
2. **Easy — The Delegator**: A middle manager who's been told by their boss to find an energy provider, doesn't know much, asks basic questions
3. **Medium — The Skeptic**: María López (existing, enhance)
4. **Medium — The Comparison Shopper**: Someone actively comparing 3 providers, very analytical, has a spreadsheet
5. **Medium — The Relationship Buyer**: Values trust and long-term relationship over price, will test sincerity
6. **Hard — The Gatekeeper**: Assistant/secretary who screens calls, you need to get past them to the decision maker
7. **Hard — The Hostile Incumbent**: Happy with current provider, annoyed at being called, needs strong reason to even listen
8. **Hard — The Committee**: Represents a committee decision, can't decide alone, needs materials for internal presentation

### 3.4 Admin Client Creator
- Professors can create new client personas with all the fields above from the admin panel
- Guided form with expert tips ("For a challenging scenario, increase neuroticism and decrease agreeableness")
- Preview system prompt before saving
- Test conversation button (admin can have a quick test call with the persona)

---

## PHASE 4: Frontend Excellence

### 4.1 UI/UX Improvements
- **Modern, professional design** — This is a tool for corporate training, not a toy
- **Responsive** — Works on desktop, tablet (professors may use tablets in classroom)
- **Accessibility** — ARIA labels, keyboard navigation, color contrast
- **Loading states** — Skeleton screens, not spinners everywhere
- **Error states** — Friendly error messages with actionable suggestions
- **Empty states** — Helpful guidance when no data exists

### 4.2 Training Experience Improvements
- **Pre-call briefing screen**: Before starting a call, show the scenario details, client profile summary, and tips specific to that difficulty level
- **Real-time visual feedback**: Show who's speaking (user/client) with visual indicators
- **Call timer**: Visible timer during the call
- **Quick notes**: Ability to jot down notes during the call (not sent to AI)
- **Post-call summary**: Before analysis, show transcript and let user self-reflect
- **Analysis navigation**: Easy back-and-forth between transcript and scores

### 4.3 Navigation & Routing
- Clear separation between student routes and admin routes
- Sidebar should show different options based on role
- Breadcrumbs for admin pages
- Admin badge/indicator in header

---

## PHASE 5: Infrastructure & Security

### 5.1 Security Hardening
- Admin endpoints MUST verify `cognito:groups` claim contains `admins` in EVERY resolver
- User access period enforcement at resolver level
- Rate limit admin operations separately
- Audit log for admin actions (who approved whom, when)

### 5.2 Infrastructure Improvements
- Review and upgrade CDK constructs to latest best practices
- Ensure proper error handling in all Lambdas
- Add CloudWatch alarms for Lambda errors
- Consider DynamoDB TTL for expired sessions
- Review WAF rules for production readiness

### 5.3 Database Migrations
When adding new fields to existing tables:
- Ensure backward compatibility
- Handle missing fields gracefully in resolvers (default values)
- Update seed scripts

---

## PHASE 6: End-to-End Testing with Chrome

### 6.1 Testing Strategy
You have access to Chrome via AppleScript. After implementing changes:

1. **Auth Flow Testing**:
   - Register a new user → verify pending status
   - Login as admin → verify admin dashboard access
   - Approve user from admin panel → verify user can now access app
   - Test expired access → verify user sees expiration message

2. **Scenario Testing**:
   - Create new scenario from admin panel
   - Verify it appears in student's scenario list
   - Start training call (if possible via Chrome automation, at least verify the page loads and connects)

3. **Analysis Testing**:
   - Verify analysis produces detailed, useful feedback with the new criteria
   - Check that scores reflect the rubric configuration

4. **Admin Panel Testing**:
   - Test all admin CRUD operations via the UI
   - Verify non-admin users cannot access admin routes

5. **General Testing**:
   - Navigate all pages, verify no broken links
   - Check responsive design at different viewport sizes
   - Verify error states and loading states

### 6.2 Automated Tests
- Update existing frontend tests (vitest) for new components
- Update backend tests for new resolvers and authorization logic
- Add integration tests for the auth flow

---

## IMPLEMENTATION ORDER

Work through these in order, completing each phase before moving to the next. Within each phase, follow this pattern:

1. **Backend first** — Schema, DynamoDB changes, Lambda resolvers
2. **Infrastructure** — CDK stack updates, deploy
3. **Frontend** — Pages, components, hooks
4. **Test** — Use Chrome to verify everything works on the deployed app
5. **Git commit** — Commit after each meaningful unit of work

### Completion Tracking

After each phase, create/update a `PROGRESS.md` file documenting:
- What was completed
- What was tested and verified
- Any known issues or limitations
- What's next

### Git Workflow
- Commit frequently with descriptive messages
- Push to main (triggers CI/CD auto-deploy)
- After pushing, wait ~5 minutes for deployment, then test on production URL

---

## CRITICAL REMINDERS

1. **The app is in Spanish (Spain)**. All UI text, analysis, scenarios, prompts must be in Spanish.
2. **Do NOT break existing functionality** while adding new features.
3. **Bedrock region**: Analysis uses `us-east-1` for Bedrock (where Claude models are available).
4. **OpenAI key**: Stored in Secrets Manager, fetched by `get_realtime_token` Lambda.
5. **Read CLAUDE.md** for repo commands and architecture details.
6. **CDK deploy**: Happens via CodePipeline on push to main. You don't need to run `cdk deploy` manually.
7. **Frontend build**: Next.js static export. Run `npm run build` locally to verify before pushing.
8. **Test with Chrome**: After deploying, test on `https://d37iyzx8veabdy.cloudfront.net` using Chrome.
9. **The analysis prompts and client persona prompts are THE MOST IMPORTANT PART**. Spend significant effort making them excellent. Research real sales training methodologies. The difference between a useful and useless app is the quality of these prompts.
10. **When you finish all phases satisfactorily**, output: `<promise>SALES TRAINING APP COMPLETE</promise>`

---

## AWS CREDENTIALS & TOOLS AVAILABLE

- AWS CLI configured (user: `claude_code`)
- Chrome controllable via AppleScript (`osascript`)
- Git configured, can push to GitHub
- Node.js and npm available for frontend builds
- Python 3 available for backend work
- All AWS services accessible: Cognito, DynamoDB, Lambda, AppSync, S3, CloudFront, Secrets Manager, Bedrock
