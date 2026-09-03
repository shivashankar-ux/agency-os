# Agency OS — The Story Builder CRM

Welcome to **Agency OS**, the comprehensive internal tool built specifically for The Story Builder to manage clients, team members, projects, tasks, and agency finances.

This guide covers everything you need to know about using and maintaining the CRM.

---

## 📱 Mobile App Installation & Push Notifications

Agency OS is built as a Progressive Web App (PWA). For the best experience on mobile, you should install it to your home screen.

### Installing on iPhone (iOS)
Apple hides the Push Notification API until the app is installed to your home screen.
1. Open the CRM in Safari: `https://crm.thestorybuilder.in`
2. Tap the **Share** button at the bottom of the screen.
3. Scroll down and select **"Add to Home Screen"**.
4. Open the new "Agency OS" app from your home screen.
5. In the Dashboard, click **Enable** on the Push Notification banner to activate the Siren and background alerts.

### Installing on Android
1. Open the CRM in Chrome.
2. Tap the three dots (menu) in the top right.
3. Select **"Install app"** or **"Add to Home screen"**.

*Note: For Push Notifications to work, the Vercel project MUST have `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` configured in the Environment Variables.*

---

## 👥 Roles and Permissions

The CRM uses a strict, role-based access control system (RBAC). 

- **Owner**: Full access to everything. Can view all finances, manage all team members, and override all permissions.
- **Admin**: Similar to Owner, but can be restricted from sensitive financials if needed. Can invite new team members.
- **Manager**: Can oversee projects and tasks, view client details, and manage standard employees. Cannot view agency-wide revenue by default.
- **Member (Employee)**: Standard employee access. Can only view tasks assigned to them, and can only access clients they are specifically assigned to.
- **Client**: External users who log into the Client Portal. They can only see their own invoices, project progress, and file deliverables.

**Custom Permissions:** The Owner can go to **Team > Permissions** to individually override access for any team member (e.g., giving a specific Manager access to view Finances).

---

## 🧩 Core Modules

### 1. Dashboard
The central hub for your day. It displays a greeting, current KPIs (Total Clients, Active Projects, Pending Tasks), your upcoming schedule, and recent activity timelines.
- **Siren Alerts**: If enabled, urgent tasks or missed deadlines will trigger a loud siren and vibration pattern.

### 2. Clients (CRM)
Manage all your client relationships here.
- Add new clients, define their status (Lead, Active, Churned), and assign specific team members to them.
- Click on any client to open the **Client Detail View**, which consolidates their Projects, Invoices, and Files.

### 3. Projects & Tasks
Every piece of work is organized into Projects and Tasks.
- **Kanban / List Views**: Manage tasks by their status (Todo, In Progress, Review, Completed).
- **Assignments**: Assign tasks to team members. They will receive a notification.
- **Deadlines**: Tasks with approaching deadlines will glow red and trigger background checks.

### 4. Calendar
A visual representation of your workload. View upcoming task deadlines, meetings, and project milestones in a monthly or weekly grid.

### 5. Finance
*(Restricted to Owners / Authorized Roles)*
- Track Paid Revenue and Pending Invoices.
- Manage billing history and generate new invoices for clients.

### 6. Team & Permissions
Manage your agency staff.
- **Inviting Members**: Click "Invite Member" to send an email invitation. The new user will be forced to log in using the exact email you invited.
- **Deactivating Members**: You can instantly revoke a member's access by deleting them from the Team page.
- **Access Control**: Use the toggle switches in the Permissions tab to granularly control what each user can see and do.

---

## 🛠️ Technical Setup (For Developers)

### Tech Stack
- Next.js 15 (App Router, Turbopack)
- React 19 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- Web-Push (Service Workers, PWA)
- Hosted on Vercel

### Local Development
1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase and VAPID keys.
4. Run `npm run dev`.

### Database Schema (Supabase)
If setting up from scratch, run the migrations in the `supabase/migrations/` folder in order inside the Supabase SQL Editor.
Key tables:
- `profiles`: Extends Supabase Auth users with roles, names, and avatars.
- `permissions_schema`: Defines the granular JSON access control.
- `clients`, `projects`, `tasks`, `invoices`, `push_subscriptions`.

### Background Jobs (Cron)
The CRM relies on Vercel Cron Jobs to check for approaching deadlines and send push notifications automatically. Ensure `vercel.json` has the cron routes configured.

### Employee Email Alerts
Owners and Admins can use **Dashboard > Alerts** to send a custom email to an active employee immediately or at a scheduled time. Alerts are email-only and do not create tasks.

Apply `supabase/migrations/023_email_alerts.sql` in the Supabase SQL Editor, then configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` in Vercel. The sending address must be verified in Resend. The scheduled sender runs through `/api/cron/send-alerts`.