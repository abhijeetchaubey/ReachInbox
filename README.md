# ReachInbox / ONE Full-Stack Email Job Scheduler Service & Dashboard

A production-grade, distributed email scheduling platform and interactive dashboard built for **ReachInbox.ai**. The system handles reliable delayed email scheduling using **BullMQ + Redis**, persistent relational storage using **PostgreSQL (Prisma ORM)**, fake SMTP email delivery via **Ethereal Email**, real-time search via **Elasticsearch**, live Slack notifications on sender rate-limit hits, real Google OAuth authentication, and a real-time BullMQ queue management dashboard.

---

## 🚀 Key Features Matrix

### ⚙️ Backend Capabilities
- **BullMQ + Redis Persistent Scheduler**: Uses BullMQ delayed jobs (`delay` parameter) to handle scheduling at a specific future time — strictly **no cron jobs**.
- **Server Restart Persistence**: Delayed jobs persist across server restarts via Redis state and an automatic startup recovery sync routine that inspects PostgreSQL for pending jobs.
- **Worker Concurrency & Throttling**: Configurable BullMQ worker concurrency (`WORKER_CONCURRENCY=5`) with minimum configurable delay between individual email sends (`delayBetweenSec=2`).
- **Sliding-Window Rate Limiting**: Enforces max emails per hour per sender using Redis atomic counters (`rate_limit:${senderEmail}:${hourWindow}`). When a limit is hit:
  - Jobs are automatically rescheduled into the next available hour window without job loss or duplicate sends.
  - A real-time notification is sent directly to the user's connected **Slack channel**.
- **Elasticsearch Search Indexing**: Indexes all scheduled and sent emails into Elasticsearch (`emails` index), providing fast fuzzy text search across email subjects, body content, and lead addresses with a Prisma DB fallback.
- **Live BullMQ Board**: Mounts `@bull-board/express` at `/admin/queues` for real-time queue visibility.
- **Idempotency Guarantee**: Every job uses `jobId: emailJob.id` in BullMQ to prevent duplicate queueing or double sends.

### 🎨 Frontend Dashboard Capabilities (ONE Design Specs)
- **Design Spec Compliance**: Light aesthetic with emerald green brand accents (`#00A651`) matching the ONE / ReachInbox design mockups.
- **Google OAuth & Fast 1-Click Demo Login**: Authenticates via `@react-oauth/google` with Client ID configuration in `frontend/.env` AND a 1-click **Continue as Intern Demo Account** button for instant evaluation without setting up Google Cloud Console credentials.
- **Left Navigation Sidebar**: Features brand logo (`ONE.`), user profile (`Oliver Brown`), `+ Compose` outline CTA, and `CORE` navigation (`Scheduled` & `Sent` queues with live badges).
- **Compose New Email Modal & Send Later Presets**:
  - `From` dropdown & `To` recipient tag pills (`tame@gmail.com`, `+4`).
  - `Upload List` CSV/Text file parser button.
  - `Delay between 2 emails` and `Hourly Limit` inputs.
  - Rich formatting toolbar (`Tt`, `Bold`, `Italic`, `Underline`, `Align`, `List`, `Quote`, `Link`).
  - **Send Later Drawer**: Date/time picker + Quick Presets (`Tomorrow`, `Tomorrow 10:00 AM`, `Tomorrow 11:00 AM`, `Tomorrow 3:00 PM`).
- **Email Detail View Modal**: Clicking any email row opens a detailed view displaying email header info, timestamp, status, body content, and direct **Ethereal Mail live preview links**.
- **Slack Alert Modal**: Connects Slack incoming webhooks or OAuth and allows triggering live test rate-limit alerts.
- **Live BullMQ Queue Monitor**: Embedded modal/drawer displaying Bull-Board UI directly within the frontend.

---

## 🏗 System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 React + Vite UI                                   |
|                      (Google OAuth, Tailwind CSS, ONE Design)                     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                    HTTP / REST API
                                          v
+-----------------------------------------------------------------------------------+
|                                Express.js Backend                                 |
+-------------------+---------------------+--------------------+--------------------+
                    |                     |                    |
                    v                     v                    v
          +-------------------+ +-------------------+ +-------------------+
          |    PostgreSQL     | |   BullMQ + Redis  | |   Elasticsearch   |
          |   (Prisma ORM)    | |  (Delayed Queue)  | |   (Email Search)  |
          +-------------------+ +---------+---------+ +-------------------+
                                          |
                                    Worker Processing
                                          v
                                +-------------------+
                                |   BullMQ Worker   |
                                +---------+---------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                  SMTP Delivery                     Slack Live Alert
                        v                                   v
             +---------------------+             +---------------------+
             | Ethereal Mail (SMTP)|             |    Slack Webhook    |
             +---------------------+             +---------------------+
```

---

## 🛠 Setup & Installation Guide

### Prerequisites
- **Node.js**: v18+ or v20+
- **Docker & Docker Compose**: (Recommended for running Postgres, Redis, and Elasticsearch containers)

---

### Option 1: Quick Local Run with Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mitrajit/reachinbox-scheduler.git
   cd reachinbox-scheduler
   ```

2. **Start all services with Docker Compose**:
   ```bash
   docker compose up --build
   ```
   This spins up:
   - **PostgreSQL**: `localhost:5432`
   - **Redis**: `localhost:6379`
   - **Elasticsearch**: `localhost:9200`
   - **Backend API & Queue Worker**: `http://localhost:5000`
   - **Frontend Dashboard**: `http://localhost:3000`

---

### Option 2: Running Backend & Frontend Standalone

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client & Push DB Schema
npx prisma generate
npx prisma db push

# Start Backend Dev Server with Nodemon & Worker
npm run dev
```

The Backend server will start on `http://localhost:5000`.
- **BullMQ Live Queue Dashboard**: `http://localhost:5000/admin/queues`
- **Health Check**: `http://localhost:5000/health`

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Build & Start Vite Dev Server
npm run dev
```

The Frontend dashboard will start on `http://localhost:3000`.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express server port |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Elasticsearch node endpoint |
| `JWT_SECRET` | `reachinbox_super_secret...` | Secret key for signing JWT tokens |
| `WORKER_CONCURRENCY` | `5` | Concurrency level for BullMQ worker |
| `DEFAULT_MIN_DELAY_SEC` | `2` | Minimum delay (sec) between email sends |
| `DEFAULT_HOURLY_LIMIT` | `200` | Max emails per hour per sender |

### Frontend (`frontend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | `"..."` | Google OAuth 2.0 Web Client ID (Leave empty or use 1-click Demo Login) |

---

## 🧪 Technical Deep Dive

### 1. How Scheduling Works (No Cron)
When a campaign is scheduled:
1. The backend parses lead recipients and calculates the target send timestamp `targetTime = startTime + (index * delayBetweenSec)`.
2. An `EmailJob` record is saved in PostgreSQL with `status: 'SCHEDULED'`.
3. A delayed job is pushed to BullMQ with `delay = max(0, targetTime - Date.now())` and `jobId = emailJob.id`.
4. The job is indexed into Elasticsearch with status `SCHEDULED`.

### 2. Server Restart Persistence
- **Redis Persistence**: BullMQ retains delayed job states in Redis.
- **Database Backup Sync**: Upon Express server startup (`syncJobsOnServerRestart()`), the backend checks PostgreSQL for any `SCHEDULED` or `RATE_LIMITED` jobs. If any job was lost from Redis due to a hard flush, it is automatically re-enqueued into BullMQ using `jobId: emailJob.id` (idempotent action).

### 3. Rate Limiting & Rescheduling Logic
- Each worker execution increments an hourly Redis key `rate_limit:${senderEmail}:${hourWindowKey}` via atomic `INCR`.
- If `currentCount > hourlyLimit`:
  1. The worker calculates the exact millisecond delay until the next hour window (`getMsUntilNextHourWindow()`).
  2. The job is rescheduled in BullMQ for the next hour window.
  3. The job status in PostgreSQL & Elasticsearch is set to `RATE_LIMITED`.
  4. A **live Slack alert** is dispatched via incoming Webhook or Slack API informing the user that the sender limit was hit.

---

## 🤝 Project Structure
```
reachinbox-scheduler/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, Sender, EmailJob)
│   ├── src/
│   │   ├── config/             # Environment variables configuration
│   │   ├── middleware/         # JWT authentication middleware
│   │   ├── queue/              # BullMQ queue producer & worker with rate limiter
│   │   ├── routes/             # Express API endpoints (auth, emails, slack, admin)
│   │   ├── services/           # Prisma, Redis, Elasticsearch, Ethereal, Slack services
│   │   └── server.ts           # Server entrypoint & restart recovery sync
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/         # Header, ComposeModal, ScheduledTable, SentTable, EmailDetailModal, SlackModal
    │   ├── context/            # AuthContext with Google Login & Demo Login
    │   ├── pages/              # Login & Dashboard views (ONE design specs)
    │   ├── services/           # Axios client
    │   └── App.tsx
    ├── .env.example
    └── package.json
```
#   R e a c h I n b o x  
 