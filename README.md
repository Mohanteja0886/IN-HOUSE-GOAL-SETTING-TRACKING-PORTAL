# 🎯 In-House Goal Setting & Tracking Portal

A fully integrated, state-of-the-art **Goal Setting & Tracking Portal** engineered using **Next.js 15 (React 19)**, styled with vanilla **CSS variables** for modern design aesthetics, and powered by **Supabase Cloud (PostgreSQL & Go Auth)**.

---

## 🚀 Core Architecture Capabilities

*   **Next.js 15 App Router:** File-system based router with clean layout nesting, suspense fallbacks, and server/client page optimizations.
*   **Supabase Client integration:** Real-time query handlers communicating directly with custom Postgres schemas, completely avoiding slow local mocks.
*   **Strict Form Validations:** Blocks goals with $< 10\%$ weightage with dynamic visual feedback.
*   **Multi-UoM Core Scoring Engine:** Dynamic progression formulas evaluating Min, Max, Timeline, and Zero-based metrics.
*   **Shared Goal Bracketed Serializer:** Automatically links and propagates departmental goals without schema updates.
*   **Interactive Check-in Ledger:** Visual Planned vs. Actual progress grid embedded directly within reviews.
*   **CSV Exporter:** Zero-overhead client-side spreadsheet downloader compiling direct reports' performance ledger.
*   **HR Heatgrid & Escalations:** Dynamically computed compliance heatmap and alert issuance controls.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Styling**: Vanilla CSS (CSS variables, modern responsive grids, fluid flexbox)
- **Database & Auth**: Supabase Cloud (PostgreSQL & Go Auth)
- **Icons**: Lucide React
- **Language**: TypeScript

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have **Node.js** (v18+ recommended) installed on your system.

### 1. Clone & Install
```bash
git clone https://github.com/Mohanteja0886/IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL.git
cd IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the project (or copy `.env.example` as a template):
```bash
cp .env.example .env.local
```

Populate the following variables with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Database Schema Setup
You can find the database schema inside [supabase_schema.sql](supabase_schema.sql). You can run this schema in your Supabase SQL Editor to prepare all tables, functions, triggers, and mock data.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔑 Evaluator Login Credentials

The custom Supabase database is pre-seeded with the following mock profiles for evaluation (all passwords are set to `password123`):

| Role | Username / Email | Password | Core Features to Audit |
| :--- | :--- | :--- | :--- |
| **Employee 1** | `sarah@atomquest.com` | `password123` | Goal configuration under strict $10\%$ weight checks, trajectory updates, log achievements, read-only shared goals |
| **Employee 2** | `michael@atomquest.com` | `password123` | Separate target tracking, UoM conversions (Max TAT metrics) |
| **L1 Manager** | `manager@atomquest.com` | `password123` | Push Departmental KPI Goal to roster, real-time CSV Ledger download, inline comments discussion, lock objectives |
| **HR Admin** | `admin@atomquest.com` | `password123` | Deploy new cycles, unlock goal sheets override gate, review audit operations trail, check HR matrix heatgrid |

---

## 📁 Project Structure

```text
├── app/                      # Next.js 15 App Router
│   ├── (dashboard)/          # Dashboard layout & sub-pages
│   │   ├── admin/            # HR Admin screens (Heatgrid, logs, cycles)
│   │   ├── employee/         # Employee dashboard & goal creation
│   │   ├── manager/          # Manager dashboard & approvals
│   │   └── layout.tsx        # Dashboard shell (Sidebar & TopNav)
│   ├── components/           # Shared UI components (Sidebar, TopNav)
│   ├── context/              # React Context Providers (Auth, Goal state)
│   ├── login/                # Role-based login screen
│   ├── types/                # Core TypeScript types
│   ├── globals.css           # Global vanilla CSS layout
│   └── page.tsx              # Landing redirection route
├── lib/                      # Business & database access layer
│   ├── queries/              # Supabase API handlers (goals, audit logs, comments)
│   ├── supabase/             # Supabase clients & mock database fallbacks
│   └── utils/                # Utility calculation scripts
├── public/                   # Static assets (images, logos)
├── supabase_schema.sql       # Full PostgreSQL database schema and seed data
├── tailwind.config.ts        # Tailwind theme specifications
└── tsconfig.json             # TypeScript settings
```
