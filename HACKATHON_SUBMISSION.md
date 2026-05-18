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
    subgraph Client ["Client Presentation Layer (Next.js 15 / React 19)"]
        A["Employee Console (Personal Goals & Check-ins)"]
        B["Manager Dashboard (Direct Report Roster & KPI Push)"]
        C["Admin Panel (Override Gates & System Controls)"]
        D["Auth & Goal Context State Providers"]
    end

    subgraph Logic ["Business Logic Core Engine"]
        E["Multi-UoM Scoring Engine Formulas"]
        F["Shared Goal Serializer [SHARED_GOAL:parentUuid]"]
        G["10% Min / 100% Cumulative Weightage Validator"]
        H["Client-side CSV Matrix Compiler"]
    end

    subgraph Backend ["Supabase Cloud Platform"]
        I["Supabase Auth (Role-based JWT Gatekeepers)"]
        J["PostgreSQL Database Transaction Engine"]
        K["System Audit Trails Logger"]
    end

    subgraph Data [("PostgreSQL Database Schema")]
        L[("users (Role Profiles)")]
        M[("goals (Targets, UoM, Weightage, Status)")]
        N[("achievements (Q1, Q2, Q3, Q4 Actuals)")]
        O[("audit_logs (Actor, Action, Severity, Timestamp)")]
    end

    %% Flow links
    A --> D
    B --> D
    C --> D
    
    D --> E
    D --> F
    D --> G
    B --> H
    
    D <--> I
    D <--> J
    J <--> K
    
    J === L
    J === M
    J === N
    J === O
    
    classDef clientStyle fill:#e0f2f1,stroke:#004d40,stroke-width:2px;
    classDef logicStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef backStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef dataStyle fill:#e8eaf6,stroke:#1a237e,stroke-width:2px;
    
    class A,B,C,D clientStyle;
    class E,F,G,H logicStyle;
    class I,J,K backStyle;
    class L,M,N,O dataStyle;
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
