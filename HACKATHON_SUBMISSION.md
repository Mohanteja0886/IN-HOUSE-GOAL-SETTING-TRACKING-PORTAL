# 🏆 ATOMQUEST HACKATHON 1.0 - OFFICIAL SUBMISSION LEDGER
## IN-HOUSE GOAL SETTING & TRACKING PORTAL ("GoalStream")

---

> [!IMPORTANT]
> **Live Deployed Portal (Vercel):** [https://in-house-goal-setting-tracking-portal.vercel.app/](https://in-house-goal-setting-tracking-portal.vercel.app/)  
> **Source Code Repository (GitHub):** [https://github.com/Mohanteja0886/IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL](https://github.com/Mohanteja0886/IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL)

---

## 1. Executive Summary & Core Value Proposition

**GoalStream** is an enterprise-grade, high-performance **Goal Setting & Tracking Portal** built to solve alignment, accountability, and tracking bottlenecks. Combining the robustness of **Next.js 15 (React 19)** with **Supabase Cloud (PostgreSQL)**, GoalStream enforces strict mathematical constraints, automates complex approval cycles, and renders gorgeous, fluid analytics that look premium on both mobile and desktop viewports.

### 🌟 Distinct Architecture Capabilities

*   **⚡ Next.js 15 App Router & React 19 Core:** Utilizes nested layout routing, client-side suspense fallbacks, and real-time state synchronization via custom Auth and Goal React Context layers.
*   **🛠️ Direct Supabase Database Integration:** Completely removes slow, non-durable mock stubs. It reads and writes directly to custom PostgreSQL schema tables with transactional consistency.
*   **📐 Strict Validation Engine:** Proactively enforces goal constraints on submission:
    *   *Total target sheet weightage must equal exactly 100%*.
    *   *Minimum weightage per individual goal is 10%*.
    *   *Maximum of 8 goals per employee*.
*   **🔒 Secure L1 Approval & Lock Workflow:** Allows managers to edit targets/weightages inline or return sheets for rework. On approval, the sheet is strictly locked and cannot be edited by the employee without Admin override.
*   **🔗 Departmental Shared KPIs Sync:** Managers can push a shared departmental goal to all direct reportees. Recipients can only adjust the weightage; the title and planned target are strictly read-only and automatically sync achievement updates from the primary owner.
*   **📊 Multi-UoM Core Scoring Engine:** Implements the four mathematical progression scoring models outlined in the BRD:
    *   **Min (Numeric/%):** `Achievement ÷ Target` (e.g., Sales Revenue).
    *   **Max (Numeric/%):** `Target ÷ Achievement` (e.g., Turnaround Time, Cost).
    *   **Timeline:** Evaluates actual completion date vs. planned deadline.
    *   **Zero-based:** Safe-gate indicator where `0` incidents = `100%`, any other number = `0%`.
*   **📉 Interactive Cycle Achievement Trends:** Live-calculated team statistics with hover tooltips and dynamic SVG sparkline charts displaying team averages in real-time.
*   **💼 Exportable Governance Center:** Downloadable direct-reports CSV matrix, real-time manager compliance trackers, and a color-coded secure system audit trail log.

---

## 2. Technical System Architecture

Here is the modular architecture mapping the presentation layers, business validators, and the transactional database schema:

```mermaid
graph TD
    %% Presentation Layer
    subgraph UI ["1. Presentation Layer (Next.js 15)"]
        EMP["Employee Portal (Draft, Submit, Check-in)"]
        MGR["Manager Portal (Team Roster, Approve, Lock)"]
        ADM["Admin Portal (Cycle Setup, Unlock Gates)"]
    end

    %% State & Context Layer
    subgraph State ["2. State & Context Layer (React 19)"]
        CTX["Auth & Goal Context Providers"]
    end

    %% Business Logic
    subgraph Core ["3. Business Logic Engine"]
        VAL["Validation Gate (Min 10% / Max 8 / Sum 100%)"]
        UOM["Scoring Formulas (Min/Max/Timeline/Zero)"]
        SHR["Departmental KPI Synchronizer"]
        CSV["Client-side CSV Ledger Exporter"]
    end

    %% Supabase Backend
    subgraph DB ["4. Supabase Cloud (PostgreSQL)"]
        AUTH["Supabase JWT Auth Gate"]
        TBL_USR[("users table")]
        TBL_GOL[("goals table")]
        TBL_ACH[("achievements table")]
        TBL_AUD[("audit_logs table")]
    end

    %% Clean Vertical Flow Links
    EMP --> CTX
    MGR --> CTX
    ADM --> CTX

    CTX --> VAL
    CTX --> UOM
    CTX --> SHR
    CTX --> CSV

    VAL --> AUTH
    UOM --> AUTH
    SHR --> AUTH
    CSV --> AUTH

    AUTH --> TBL_USR
    AUTH --> TBL_GOL
    AUTH --> TBL_ACH
    AUTH --> TBL_AUD

    %% Custom Subgraph Styling for Premium Visuals
    style UI fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    style State fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style Core fill:#e8eaf6,stroke:#1a237e,stroke-width:2px
    style DB fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

---

## 3. Git Push & Deployment Blueprint

### A. Repository Origin Config (Git Push Log)
The repository was initialized and pushed to GitHub main branch using:

```bash
# 1. Add remote origin configurations
git remote add origin https://github.com/Mohanteja0886/IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL.git

# 2. Stage and commit files
git add .
git commit -m "feat: complete end-to-end GoalStream portal with live Supabase postgres bindings"

# 3. Push securely to GitHub main branch
git push -u origin main
```

### B. Vercel Serverless Hosting Config
1. Connected the `Mohanteja0886/IN-HOUSE-GOAL-SETTING-TRACKING-PORTAL` repository to Vercel.
2. Initialized environment variables inside the dashboard:
   *   `NEXT_PUBLIC_SUPABASE_URL`
   *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Executed the serverless Next.js builder, creating static and dynamic API nodes successfully with zero errors.

---

## 4. Judges Testing Checklist & Seeded Credentials

For absolute evaluation ease, the PostgreSQL database is pre-seeded with the following credentials (all profiles use the same password `password123`):

| Role | Username / Email | Password | Core Features to Evaluate |
| :--- | :--- | :--- | :--- |
| 🧑‍💻 **Employee 1** | `sarah@atomquest.com` | `password123` | Draft and configure goals under strict validation, view read-only titles for departmental shared goals, input quarterly check-in achievements. |
| 🧑‍💻 **Employee 2** | `michael@atomquest.com` | `password123` | Log Max Turnaround Time (TAT) metrics, submit completed goal sheets for review. |
| 👑 **L1 Manager** | `manager@atomquest.com` | `password123` | Push departmental goal templates to reportees, adjust targets/weightages inline, approve and lock goal sheets, view live SVG charts, export CSV reports. |
| 🛡️ **HR Admin** | `admin@atomquest.com` | `password123` | Configure new goal cycles, override gate controls to unlock goal sheets, review system-wide audit logs, monitor completion heatmaps. |

---

> [!TIP]
> **Navigation Shortcut:** Utilize the premium sidebar navigation drawer (featuring notifications and inbox FAQ helpers) to switch contexts easily and experience the end-to-end workflow!
