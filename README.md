# SmartMedChart — Clinical Medication Management System

> HIPAA-compliant ICU-grade eMAR, CPOE, and 5-Rights bedside verification platform.

---

## 🚀 Quick Start

### Prerequisites

**Option A — Docker (Recommended)**
```bash
# Install Docker Desktop first, then:
docker compose up -d          # Start PostgreSQL
npm run db:migrate            # Apply schema migrations
npm run db:seed               # Seed ICU demo data
npm run dev                   # Start frontend + backend
```

**Option B — Local PostgreSQL**
1. Install [PostgreSQL 15+](https://www.postgresql.org/download/)
2. Create database:
   ```sql
   CREATE USER smartmed WITH PASSWORD 'smartmed123';
   CREATE DATABASE smartmedchart OWNER smartmed;
   GRANT ALL PRIVILEGES ON DATABASE smartmedchart TO smartmed;
   ```
3. Then run:
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend (port 5173) + backend (port 3001) together |
| `npm run dev:frontend` | Start Vite React dev server only |
| `npm run dev:backend` | Start Express API server only |
| `npm run db:migrate` | Run Prisma migrations (create/update DB schema) |
| `npm run db:seed` | Seed demo ICU data |
| `npm run db:reset` | Reset database and re-seed |
| `npm run db:studio` | Open Prisma Studio (visual DB explorer) |
| `npm run docker:up` | Start PostgreSQL via Docker |
| `npm run docker:down` | Stop Docker containers |
| `npm run build` | Build production frontend bundle |

---

## 🔐 Login Credentials (after seeding)

All accounts use password: **SmartMed@2024**

| Role | Email | Access |
|------|-------|--------|
| 👨‍⚕️ Doctor | `sharma.md@metrohealth.org` | Doctor dashboard, CPOE, all patients |
| 👩‍⚕️ Doctor | `rchen.phd@metrohealth.org` | Doctor dashboard, CPOE |
| 👩‍⚕️ Nurse | `priya.rn@metrohealth.org` | Nurse dashboard, eMAR, bedside scan |
| 💊 Pharmacist | `dave.pharm@metrohealth.org` | Prescriptions, pharmacy verify |
| 🔧 Admin | `elena.admin@metrohealth.org` | User management, audit logs |

---

## 🏗️ Architecture

```
SmartMedChart/
├── src/                    # React 18 + TypeScript frontend
│   ├── api/                # Axios client with JWT interceptors
│   ├── components/         # Sidebar, shared components
│   ├── hooks/              # useAuth context
│   ├── layouts/            # AppLayout
│   ├── pages/              # All page components
│   ├── routes/             # ProtectedRoute
│   ├── services/           # API service functions
│   ├── App.tsx             # Routes
│   └── main.tsx            # React entry
│
├── server/                 # Express + TypeScript backend
│   ├── config/             # Prisma singleton
│   ├── controllers/        # Auth, Patient, Prescription, Schedule
│   ├── middleware/         # JWT auth, error handler
│   ├── routes/             # All Express routes
│   ├── services/           # Safety (allergy), Scheduling
│   ├── utils/              # HMAC, Audit logger
│   └── server.ts           # Express app entry
│
├── prisma/
│   ├── schema.prisma       # Complete DB schema (15 models)
│   └── seed.ts             # ICU demo data seed
│
├── docker-compose.yml      # PostgreSQL container
├── .env                    # Environment variables
└── package.json            # All scripts
```

### Data Flow

```
React Frontend (port 5173)
       ↓  Axios + JWT Bearer
Express REST API (port 3001)
       ↓  Business Logic + RBAC + Zod Validation
Business Services (safety.service, scheduling.service)
       ↓  Prisma ORM
PostgreSQL (port 5432)
```

---

## ✨ Features

1. **Authentication** — HIPAA bedside auth, JWT + refresh tokens, 15min idle timeout
2. **Role-Based Access** — Doctor / Nurse / Pharmacist / Admin RBAC
3. **Doctor Dashboard** — CPOE overview, patient list, pending co-signs, critical alerts
4. **Nurse Dashboard** — Live ward schedule, DUE NOW / STAT cards, shift progress
5. **Patient Management** — Active patients, isolation flags, allergy banners
6. **Patient eMAR** — Scheduled, held, continuous, PRN medications with status timeline
7. **Digital Prescriptions (CPOE)** — Formulary search, dose/route/frequency, STAT workflow
8. **Automatic Scheduling** — Generates dose schedules based on frequency codes (Q8H, BID, etc.)
9. **STAT Workflow** — Urgent single-dose orders with pharmacist notification
10. **Medication Administration** — eMAR sign-off with 5-Rights verification
11. **QR Wristband Scan** — Simulate patient wristband scan for identity verification
12. **5-Rights Verification** — Right Patient/Drug/Dose/Route/Time with barcode scanning
13. **Safety Alerts** — Cross-allergy detection, high-alert medication flags, SAFETY INTERCEPT modal
14. **Notifications** — Per-user real-time notifications (STAT, DUE, CO-SIGN) with unread badge
15. **Reports** — Recharts analytics: compliance, ADR by type, barcode scan rate
16. **Analytics** — 7-day trends, shift metrics, dose completion rates
17. **AI/Predictive Risk** — Bayesian rule-based ward risk index + ADR prevention score
18. **Audit Logs** — SHA-256 HMAC cryptographic audit trail for every action
19. **User Management** — Admin CRUD for staff, role assignment, deactivate accounts
20. **PostgreSQL Persistence** — All data stored in PostgreSQL via Prisma ORM

---

## 🔒 Security

- JWT access tokens (15 min) + refresh tokens (8 hours)
- bcrypt password hashing (12 rounds)
- RBAC middleware on all routes
- Rate limiting (500 req/15min general, 20 req/15min auth)
- Helmet.js security headers
- SHA-256 HMAC audit trail (immutable, ISO 27799 / 21 CFR Part 11)
- HIPAA-compliant session management

---

## 🔧 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DATABASE_URL="postgresql://smartmed:smartmed123@localhost:5432/smartmedchart"
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3001
VITE_API_URL=http://localhost:3001/api
```
