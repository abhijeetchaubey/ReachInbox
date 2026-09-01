# ReachInbox Email Scheduler

A full-stack email scheduling system built as part of the ReachInbox Software Development Intern assignment.

The application allows users to create email campaigns, schedule emails for a specific time, process them asynchronously using BullMQ and Redis, enforce sender rate limits, send emails through Ethereal SMTP, search emails using Elasticsearch, receive Slack notifications when rate limits are reached, and monitor queues through a BullMQ dashboard.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Features Implemented](#features-implemented)
- [Prerequisites](#prerequisites)
- [Running the Project](#running-the-project)
  - [1. Start Infrastructure](#1-start-infrastructure)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Ethereal Email Setup](#ethereal-email-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [How Scheduling Works](#how-scheduling-works)
- [Persistence on Server Restart](#persistence-on-server-restart)
- [Rate Limiting](#rate-limiting)
- [Worker Concurrency](#worker-concurrency)
- [Elasticsearch Search](#elasticsearch-search)
- [Slack Rate Limit Notifications](#slack-rate-limit-notifications)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [1000+ Email Handling](#1000-email-handling)
- [BullMQ Dashboard](#bullmq-dashboard)
- [Demo Flow](#demo-flow)
- [Assumptions and Trade-offs](#assumptions-and-trade-offs)
- [Security](#security)

---

# 📌 Overview

ReachInbox Email Scheduler is designed to demonstrate a reliable email scheduling architecture similar to a production email outreach platform.

The application consists of:

1. A React frontend for creating and monitoring campaigns.
2. An Express.js backend exposing REST APIs.
3. PostgreSQL for persistent application data.
4. Redis for BullMQ job storage and distributed rate limiting.
5. BullMQ for delayed email scheduling and asynchronous processing.
6. BullMQ workers for sending emails.
7. Ethereal Email for fake SMTP delivery.
8. Elasticsearch for searchable email records.
9. Slack for live rate-limit notifications.
10. Google OAuth for authentication.

### Important

The scheduler **does not use cron jobs**.

All scheduled email jobs are handled through **BullMQ delayed jobs backed by Redis**.

---

# 🛠 Tech Stack

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| TypeScript | Programming language |
| Express.js | REST API |
| PostgreSQL | Persistent database |
| Prisma | Database ORM |
| Redis | Queue and rate-limit storage |
| BullMQ | Job scheduling and processing |
| Nodemailer | SMTP client |
| Ethereal Email | Fake SMTP provider |
| Elasticsearch | Email search |
| Google OAuth | Authentication |
| JWT | API authentication |
| Slack API | Rate-limit notifications |
| BullMQ Board | Queue monitoring |

## Frontend

| Technology | Purpose |
|---|---|
| React | UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Vite | Development/build tool |

## Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Running PostgreSQL, Redis and Elasticsearch |

---

# 🏗 Architecture Overview

```text
                         ┌─────────────────────────┐
                         │      React Frontend     │
                         │   React + TypeScript     │
                         │      Tailwind CSS       │
                         └────────────┬────────────┘
                                      │
                                      │ REST API
                                      ▼
                         ┌─────────────────────────┐
                         │    Express Backend      │
                         │   TypeScript + Prisma   │
                         └──────┬──────┬──────┬─────┘
                                │      │      │
                ┌───────────────┘      │      └────────────────┐
                ▼                      ▼                       ▼
        ┌───────────────┐      ┌───────────────┐       ┌───────────────┐
        │  PostgreSQL   │      │ Redis + BullMQ │       │ Elasticsearch │
        │               │      │               │       │               │
        │ Persistent DB │      │ Delayed Jobs   │       │ Email Search  │
        └───────────────┘      └───────┬───────┘       └───────────────┘
                                      │
                                      │
                                      ▼
                              ┌───────────────┐
                              │ BullMQ Worker │
                              │               │
                              │ Concurrency   │
                              │ Rate Limit    │
                              │ Delay         │
                              └───────┬───────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                 ┌───────────────┐         ┌───────────────┐
                 │ Ethereal SMTP │         │     Slack     │
                 │ Email Sending │         │ Notifications │
                 └───────────────┘         └───────────────┘


reachinbox/
│
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── queue/
│   │   │   ├── queue.ts
│   │   │   └── worker.ts
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── elasticsearch.service.ts
│   │   │   ├── slack.service.ts
│   │   │   └── rateLimit.service.ts
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── context/
    │   └── App.tsx
    │
    ├── .env.example
    ├── package.json
    └── tsconfig.json