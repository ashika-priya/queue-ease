# Queue Ease: Smart Queue Management System

A production-grade, full-stack digital queue management platform built upon modern web standards, decoupling queue participation from physical waiting rooms through zero-app QR admission, sub-second WebSocket synchronization, dynamic mathematical wait-time estimation, and atomic anti-duplicate enforcement.

---

## 1. Project Overview & Institutional Details

- **Project Title:** Queue Ease: Smart Queue Management System
- **Candidate:** Ashika Priya M (Register No. 310624104030)
- **Institution:** Easwari Engineering College (Autonomous Institution, Affiliated to Anna University), Chennai
- **Department:** Computer Science and Engineering
- **Academic Course:** Full Stack Development (Academic Year 2026–2027)
- **Supervisor:** Ms. Nagamani Segalla, Assistant Professor, Dept. of CSE

---

## 2. System Architecture & Core Innovations

### Decoupled Three-Tier Architecture
1. **Presentation Tier (Frontend SPA):** React 18.3, Vite 5.x, Tailwind CSS 3.4, Lucide React Icons, Recharts 2.x, Axios, Socket.IO Client.
2. **Application Tier (Node.js & Express API Gateway):** Node.js 20.x, Express 4.19, Socket.IO 4.7, JWT Authentication, bcryptjs 2.4.
3. **Data Tier (MongoDB & Mongoose ODM):** Resilient dual-mode database connector with MongoDB / in-memory Mongoose engine fallback, compound partial unique indexing, and atomic `$inc` sequence counters.

### Core Mathematical Formulations
- **Predictive Wait-Time Engine (M/M/c Queuing Formulation):**
  $$\text{Estimated Wait Time (minutes)} = \frac{\text{Customers Ahead in Line} \times \text{Target Average Service Duration}}{\max(1, \text{Active Open Counters})}$$
- **Adaptive Rolling Moving Average Refinement:**
  $$\text{Rolling Average Service Time} = (0.7 \times \text{Configured Baseline}) + (0.3 \times \text{Last 5 Completed Intervals})$$

### Atomic Anti-Duplicate Protection
Enforced at the database layer via a compound partial unique index on `QueueEntry`:
```javascript
// backend/src/models/QueueEntry.js
queueEntrySchema.index(
  { queueId: 1, customerPhone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['waiting', 'calling'] }
    }
  }
);
```
If a customer attempts to take a second ticket in the same queue while already holding an active ticket, MongoDB immediately rejects the insertion with error code `11000`. Once the ticket is marked `completed` or `cancelled`, the partial filter no longer applies, allowing the patron to rejoin the queue on subsequent visits.

---

## 3. Demo Personas & Development Credentials

| Persona | Name | Role | Email | Password | Primary Assignment / Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer** | Shankar | `customer` | `shankar@example.com` | `secret123` | Active Token: **Q-024** in General Consultation |
| **Staff** | Dr. Sarah Patel | `staff` | `sarah@citycare.com` | `secret123` | Counter 1, General Consultation, CityCare Hospital |
| **Administrator** | Eleanor Vance | `admin` | `eleanor@queueease.com` | `secret123` | System Administrator, Full Observability Console |

*Note: The application features a persistent **Demo Role Switcher Bar** at the top of every screen for instant one-click switching.*

---

## 4. Multi-Tenant Organizations & Seed Data

1. **CityCare Hospital**
   - Tagline: *Compassionate Care, Seamless Experience*
   - Departments:
     - General Consultation (Prefix: `Q`, Avg Service: 6 min) — Serving `Q-018`, Next: `Q-019`, Shankar has `Q-024`
     - Pharmacy (Prefix: `PH`, Avg Service: 4 min)
     - Laboratory (Prefix: `LAB`, Avg Service: 8 min)
     - Billing (Prefix: `BIL`, Avg Service: 3 min)
     - Registration (Prefix: `REG`, Avg Service: 5 min)
2. **Apex Global Bank**
   - Cash & Teller Counter (`CSH`, 4 min)
   - Loan & Mortgages (`LN`, 15 min)
   - Account Services (`ACC`, 8 min)
3. **QuickFix Tech Service Center**
   - Diagnostics & Triage (`DIAG`, 10 min)
   - Device Repair Handover (`REP`, 7 min)
   - Accessories & Parts (`PRT`, 3 min)

---

## 5. Complete REST API Endpoint Directory

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new customer account with Indian 10-digit mobile validation |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return signed JWT |
| `POST` | `/api/auth/quick-demo-login` | Public | One-click evaluator login for Shankar, Sarah, or Eleanor |
| `GET` | `/api/auth/me` | Authenticated | Retrieve active user profile and assigned roles |
| `GET` | `/api/organizations` | Public | List all active organizations |
| `GET` | `/api/services/org/:orgId` | Public | List active service departments with live queue metrics |
| `POST` | `/api/queues/join` | Optional Auth | Join queue, enforce duplicate guard, return digital token |
| `GET` | `/api/queues/active/my-tickets` | Optional Auth | Retrieve customer active tickets with people ahead & wait time |
| `POST` | `/api/queues/entry/:entryId/cancel` | Optional Auth | Customer cancels active ticket |
| `GET` | `/api/queues/staff/my-queue` | Staff / Admin | Get assigned service desk queue and waiting customer list |
| `POST` | `/api/queues/:queueId/next` | Staff / Admin | Staff operator advances queue and calls next customer |
| `POST` | `/api/queues/:queueId/recall` | Staff / Admin | Re-announces current customer token with chime alert |
| `POST` | `/api/queues/:queueId/skip` | Staff / Admin | Flags non-responsive customer as skipped |
| `POST` | `/api/queues/:queueId/complete` | Staff / Admin | Marks consultation completed and records duration |
| `POST` | `/api/queues/:queueId/pause` | Staff / Admin | Pauses queue admissions during operator breaks |
| `POST` | `/api/queues/:queueId/resume` | Staff / Admin | Resumes paused queue for normal admissions |
| `GET` | `/api/queues/public/:orgId` | Public | Get live data for public lounge TV display |
| `GET` | `/api/admin/analytics` | Admin | Aggregate KPIs, hourly chart volume, and throughput matrix |
| `GET` | `/api/admin/network-info` | Admin | Detects host Wi-Fi LAN IP for scannable QR generation |

---

## 6. Real-Time WebSocket Events (Socket.IO)

- `queue:updated` — Broadcast on token generation, cancellation, advance, skip, and completion.
- `ticket:called` — Broadcast with `{ tokenNumber, counterNumber, staffName, serviceName, organizationName }`. Triggers the Web Audio harmonic chime on clients.
- `queue:status_changed` — Broadcast when queue is paused or resumed.
- `stats:updated` — Broadcasts refreshed metrics to the admin room.

---

## 7. Automated Test Suite Verification

Run the test suite from the backend directory:
```bash
cd backend
npm test
```

### Verified Test Matrix (10/10 Passed - 100% Success Rate):
1. **TEST 1:** MongoDB Connection & Active Daemon Handshake — Connected via Mongoose (Ready State: 1)
2. **TEST 2:** Customer Registration & Password Hash Validation — Verified in MongoDB
3. **TEST 3:** Organization & Service Document Creation — Created Metro Clinic & Pediatrics Consultation (`PED`)
4. **TEST 4:** QR Code Generation & Raw Pixel Image Decoding — Verified via jsQR and pngjs
5. **TEST 5:** Inactive Organization / Service Validation — Inactive document flags verified
6. **TEST 6:** Queue Entry & Token Persistence — Token `PED-001` persisted with status `waiting`
7. **TEST 7:** Duplicate Active Queue Prevention Enforced — Duplicate phone blocked by MongoDB partial unique index (code `11000`)
8. **TEST 8:** Staff Call Next & Queue Status Mutation — Mutated status to `calling`, now serving `PED-001`
9. **TEST 9:** Ticket Completion & Re-joining Verification — Marked completed, verified identical phone successfully rejoins with `PED-002`
10. **TEST 10:** Role Security & Bcrypt Hash Verification — `bcrypt.compare()` verified `secret123` against stored hash

---

## 8. Installation & Execution Guide

### Prerequisites
- Node.js v20.x LTS or higher
- NPM v10.x or higher

### Environment Configuration
Backend `.env` (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/queue_ease
JWT_SECRET=Queue_Ease_jwt_super_production_secret_key_2026
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Frontend `.env` (`frontend/.env`):
```env
VITE_FRONTEND_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:5000
```

### Starting the Application

#### Terminal 1: Backend Server
```bash
cd backend
npm install
npm run seed  # Pre-seeds demo records (Shankar Q-024, Dr. Sarah, Eleanor)
npm start     # Starts Express + Socket.IO server on port 5000
```

#### Terminal 2: Frontend Client
```bash
cd frontend
npm install
npm run dev   # Starts Vite development server on http://localhost:3000
```

#### Terminal 3: Automated Integration Verification
```bash
cd backend
node test_mongodb_integration.js
```
