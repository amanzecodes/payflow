Apparently I got disqualified because I submitted a form that was requred to move on and they didn't see the submission

# PayFlow

> **Give every member their own dedicated payment account. Every transfer reconciles itself.**

PayFlow is a recurring collections engine built for Nigerian estates, cooperatives, gyms, schools, and any group that collects money from members on a schedule. Every member gets a unique Nomba virtual account number. When they pay, the system identifies them instantly, reconciles the charge, and updates the dashboard in real time — no manual tracking, no shared accounts, no "who just sent this?" confusion.

Built for the **Nomba × DevCareer Hackathon 2026 — Infrastructure Track**.

---

## The Problem

Nigeria has an estimated 40 million cooperative and estate members paying recurring dues. The typical collection process looks like this:

- Admin shares one bank account number with all 80 members
- Members transfer and add their name or flat number in the narration
- Admin manually checks the account, reads narrations, and ticks names off a spreadsheet
- Disputes arise constantly — wrong amounts, missing narrations, wrong names
- EFCC records show recurring payment disputes escalate to litigation in 12–18% of Nigerian estate management cases

The root cause is simple: there is no deterministic link between a bank transfer and the person who sent it.

---

## The Solution

PayFlow assigns every member a permanent, dedicated Nomba virtual account. When Mrs Okoro from Flat 3B transfers ₦25,000, it lands on **her** account number — not a shared pool. Nomba fires a webhook. PayFlow reconciles the payment to her charge record in under two seconds. Her status flips from PENDING to PAID on the dashboard. No human involved.

```
Member transfers → Nomba VA receives → Webhook fires → PayFlow reconciles → Dashboard updates live
```

---

## Demo

**Live backend:** `https://payflow-production-d059.up.railway.app`

**Health check:** `GET /health`

**WhatsApp bot:** Text the Twilio sandbox number to onboard via WhatsApp

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PayFlow System                          │
│                                                                 │
│  WhatsApp Bot          Web Dashboard         Nomba API          │
│  (Twilio / Twilio)     (Next.js 16)          Integration        │
│       │                      │                    │             │
│       ▼                      ▼                    ▼             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Express + TypeScript Backend            │        │
│  │                                                     │        │
│  │  Auth    Orgs    Members    Collections    Payouts  │        │
│  │                                                     │        │
│  │  Webhook Handler (idempotent, HMAC-verified)        │        │
│  │  Reconciliation Engine (under/overpayment aware)    │        │
│  │  Socket.io (live dashboard updates)                 │        │
│  │  Cron Jobs (cycle opening, overdue detection)       │        │
│  └─────────────────────────────────────────────────────┘        │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  PostgreSQL  │                              │
│                    │  (Neon)      │                              │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nomba Integration

PayFlow uses four Nomba APIs across the entire product surface:

| API | Endpoint | Usage |
|-----|----------|-------|
| Auth | `POST /v1/auth/token/issue` | OAuth2 client credentials |
| Auth Refresh | `POST /v1/auth/token/refresh` | Token refresh at 25-minute mark |
| Virtual Accounts | `POST /v1/accounts/virtual` | One VA per member at registration |
| Bank Lookup | `POST /v1/transfers/bank/lookup` | Verify payout account before transfer |
| Bank Transfer | `POST /v2/transfers/bank` | Admin payouts and overpayment refunds |
| Bank List | `GET /v1/transfers/banks` | Populated bank picker in onboarding |
| Webhooks | `payment_success`, `payout_success`, `payout_refund` | Real-time reconciliation |

### Webhook Security

Every incoming webhook is verified using HMAC-SHA256 against the shared secret before any processing occurs. Verification uses constant-time comparison via `crypto.timingSafeEqual` to prevent timing attacks. Webhook payloads are written to the database before processing so no event is ever lost.

### Reconciliation Logic

```
payment_success received
  → verify HMAC signature
  → idempotency check (transactionId + WebhookEvent table)
  → findByVaNumber(aliasAccountNumber) → member
  → findPendingByMember(memberId) → charge
  → compute newPaidSoFar = charge.paidSoFar + receivedAmount

  if newPaidSoFar < expectedAmount:
    → status: UNDERPAID
    → accumulate paidSoFar on charge
    → WhatsApp member: "You still owe ₦X — pay into same account"
    → notify admin dashboard via Socket.io

  if newPaidSoFar > expectedAmount:
    → status: OVERPAID
    → mark charge paid
    → auto-initiate refund of excess via POST /v2/transfers/bank
    → notify admin dashboard via Socket.io

  if newPaidSoFar === expectedAmount:
    → status: PAID
    → atomic prisma.$transaction([charge.update, webhookEvent.update])
    → emit payment:received to dashboard via Socket.io
```

### Idempotency

Nomba retries failed webhooks up to 5 times over 53 minutes using exponential backoff. PayFlow handles this at three levels:

1. **Application check** — `WebhookEvent` table stores every `transactionId`. Duplicates are detected and skipped before any processing.
2. **Database transaction** — charge update and webhook event marking are atomic. No partial state is possible.
3. **Schema constraint** — `@@unique([memberId, cycleId])` on the Charge table prevents duplicate charges at the database level.

---

## Features

### For Admins

- **WhatsApp onboarding** — complete setup in under 5 minutes via conversational bot. No app download, no browser.
- **Web dashboard** — real-time overview of every member's payment status, balance, and activity feed
- **Live payment flip** — dashboard updates the moment a member's transfer lands via Socket.io
- **Automated billing cycles** — monthly, quarterly, yearly, termly, and one-time collections. Cycles open automatically via cron job.
- **Overdue detection** — daily cron marks unpaid charges as overdue when the cycle due date passes
- **Payout on demand** — withdraw collected balance to any Nigerian bank account. Bank account verified via Nomba lookup before transfer.
- **WhatsApp commands** — `status`, `balance`, `payout`, `add` — manage everything from a phone

### For Members

- **Dedicated virtual account** — unique Nomba account number per member, per organisation
- **Pay from any bank** — transfer from GTBank, Access, OPay, Kuda, any Nigerian bank
- **Automatic reconciliation** — no reference numbers, no narrations. The account number is the identity.
- **VARIABLE structure self-enrolment** — members with variable fee plans join via invite code and select their own fee lines
- **WhatsApp notifications** — underpayment alerts sent directly to member's WhatsApp

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL (Neon) via Prisma ORM |
| WhatsApp | Twilio WhatsApp Business API |
| Real-time | Socket.io |
| Auth | JWT + httpOnly cookies, bcrypt |
| Validation | Zod |
| Logging | Winston |
| Scheduler | node-cron |
| Deployment | Railway |
| Frontend | Next.js 16 (App Router), Tailwind CSS, TypeScript |

---

## Security

- **HMAC-SHA256 webhook verification** — every Nomba webhook verified against shared secret before processing. Fails closed — missing secret rejects all webhooks.
- **Timing-safe signature comparison** — `crypto.timingSafeEqual` prevents timing attacks on signature verification
- **Raw body capture** — Express `json({ verify })` callback preserves raw bytes for HMAC computation before parsing
- **httpOnly cookie auth** — JWT stored in httpOnly cookies, never exposed to JavaScript
- **Zod input validation** — every API endpoint validates request body against a typed schema
- **`requireOrgAccess` middleware** — prevents cross-organisation data access on every org-scoped route
- **Token refresh at 25-minute mark** — Nomba access tokens refreshed via refresh token before expiry, client secret never re-sent after initial issue

---

## API Reference

All endpoints are under `/api/v1`.

```
Auth
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

Organisations
POST   /organisations
GET    /organisations/my-orgs
GET    /organisations/:orgId
PUT    /organisations/:orgId/payout-account
GET    /organisations/:orgId/balance
GET    /organisations/:orgId/invite-code

Collections
POST   /organisations/:orgId/collections
GET    /organisations/:orgId/collections
GET    /organisations/:orgId/collections/:collectionId/current-cycle
GET    /organisations/:orgId/collections/:collectionId/cycles

Members
POST   /organisations/:orgId/members
GET    /organisations/:orgId/members
GET    /organisations/:orgId/members/:memberId
PATCH  /organisations/:orgId/members/:memberId/deactivate

Payouts
POST   /organisations/:orgId/payouts
GET    /organisations/:orgId/payout-page

Dashboard
GET    /dashboard/:orgId/overview

Webhooks
POST   /webhooks/nomba

Banks
GET    /banks/list
POST   /banks/verify

WhatsApp
POST   /whatsapp/incoming
```

---

## Local Setup

```bash
# clone the repo
git clone https://github.com/your-username/payflow.git
cd payflow

# install dependencies
npm install

# configure environment
cp .env.example .env
# fill in your values — see Environment Variables below

# run database migrations
npx prisma migrate dev

# start development server
npm run dev
```

### Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://...
NODE_ENV=development

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Nomba
PROVIDER=nomba
NOMBA_CLIENT_ID=your_client_id
NOMBA_CLIENT_SECRET=your_client_secret
NOMBA_ACCOUNT_ID=your_account_id
NOMBA_BASE_URL=https://sandbox.nomba.com
NOMBA_WEBHOOK_SECRET=NombaHackathon2026

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# URLs
CLIENT_URL=http://localhost:3000
WEBHOOK_BASE_URL=https://your-railway-url.up.railway.app
```

---

## Testing

Test the full reconciliation flow with the mock provider:

```bash
# 1. register and login
POST /api/v1/auth/register
POST /api/v1/auth/login

# 2. create org and collection
POST /api/v1/organisations
POST /api/v1/organisations/:orgId/collections

# 3. add a member — VA created automatically
POST /api/v1/organisations/:orgId/members
# copy vaNumber from response

# 4. fire a test payment
POST /api/v1/webhooks/nomba/test
{ "vaNumber": "copied_va_number", "amount": 25000 }

# 5. verify reconciliation
GET /api/v1/dashboard/:orgId/overview
# totalCollected should be 25000
# charge should be PAID
```

---

## Roadmap (v2)

- **Direct Debit mandates** — pull-based recurring billing via Nomba's NIBSS e-mandate API. Members authorise a debit once; PayFlow collects automatically each cycle.
- **Instalment tracking** — allow members to pay in multiple instalments with running total display per cycle
- **Multi-organisation admin** — single admin account managing multiple estates or cooperatives with an org switcher on both web and WhatsApp
- **Class-based fee tiers** — for schools, fee lines organised by class level (JSS1–SS3) with automatic fee assignment on enrolment
- **Webhook queue** — BullMQ + Redis for async webhook processing with automatic retry on failure and dead letter queue for failed jobs
- **SMS fallback** — for members without WhatsApp, underpayment alerts delivered via SMS through Termii or Sendchamp

---

## Project Structure

```
src/
  providers/
    PaymentProvider.ts     — interface + Nomba types
    NombaProvider.ts       — full Nomba API implementation
    MockProvider.ts        — test provider
  config/
    env.ts                 — Zod-validated environment
  lib/
    prisma.ts              — singleton client
    logger.ts              — Winston
    socket.ts              — Socket.io singleton
    twilio.ts              — WhatsApp helpers
    bankCache.ts           — Nomba bank list with in-memory cache
  repositories/            — one per Prisma model
  services/                — business logic
  controllers/             — HTTP handlers
  routes/                  — Express routers
  jobs/
    cycle.job.ts           — opens new cycles on 1st of month
    overdue.job.ts         — marks unpaid charges overdue daily
  middleware/
    auth.middleware.ts
    error.middleware.ts
    validate.middleware.ts
  app.ts
  index.ts
```

---

## Hackathon Track

**Nomba × DevCareer 2026 — Infrastructure Track**

PayFlow directly addresses the track brief: a persistent dedicated virtual account system. One account per member, permanent across billing cycles, with deterministic reconciliation at the webhook level. No human intervention required between a member's bank transfer and their charge being marked paid.

---

## Author
Amanze Bruno Chinaenyeze - Software Engineer
Built solo during the Nomba × DevCareer Hackathon 2026 build phase (June 30 – July 7, 2026).
