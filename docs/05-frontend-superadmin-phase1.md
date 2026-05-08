# Super-Admin Frontend — Phase 1

> **Repo:** `saloon-frontend-superadmin`
> **Audience:** the platform operator(s) — the team running the SaaS, with global visibility across every saloon, owner, barber, customer, and booking.
> **Phase:** 1 — basic governance, onboarding, oversight, platform-level analytics. No payments, no Google Calendar.
> **Audience for this doc:** Claude design / engineer who must build screens.

---

## 1. Product Identity & Feel

- **Mission control.** Power, breadth, and trust. The super-admin must understand the platform's state at a glance and drill down to anything in two clicks.
- Desktop-only in spirit: optimized for ≥ 1280px. Should still be functional on tablets but never makes accommodations that compromise density on the desktop. Mobile is a "read-only emergency view" only.
- Tone: serious, calm, slightly authoritative. Compact typography, neutral palette, restrained color. Status colors used purposefully (green/yellow/red) so they actually mean something when they appear.
- Keyboard-first interactions: search anything from anywhere with `/`, command palette with `⌘K`. Tables support multi-column sort, sticky headers, column toggles.
- Charts and tables dominate; photos appear only inside detail drilldowns. No marketing imagery anywhere.
- Avoid: cute illustrations, emoji, friendly copy. Plain English, short labels, operator-grade.

---

## 2. Global Rules

- Single API client; no business logic on the client beyond formatting.
- The super-admin sees and can act on **everything** the backend exposes. The client never imposes additional gating; the backend is the gatekeeper.
- All data lists are server-paginated, server-filtered, server-sorted. The client never aggregates locally except in trivially-scoped UI state (e.g. selecting checkboxes for a bulk operation).
- Destructive operations (deactivate saloon, suspend user, transfer saloon ownership) require an explicit confirmation step that re-states the consequences in human language.
- Every state-changing request is auditable; the audit log explorer is a first-class screen.
- Always show object IDs (short form) in detail screens — operators ask for IDs in support tickets.
- Empty/error/loading states are unflashy: short labels, monospace where helpful, retry actions.

---

## 3. Tech Stack

- Same family as the rest: Next.js + TypeScript + Tailwind + shadcn/Radix + TanStack Query + RHF + Zod + date-fns.
- Tables: TanStack Table with column visibility persistence per user (localStorage; UI state only).
- Charts: Recharts.
- Command palette: cmdk.
- Date utilities: date-fns + date-fns-tz.

---

## 4. Routes & Screen Inventory

```
/                              Platform overview
/saloons                       All saloons
/saloons/[id]                  Saloon detail (full god-mode view)
/saloons/new                   Create saloon (also creates owner invite)
/owners                        Owners list
/owners/[id]                   Owner detail
/owners/new                    Create owner (sends invite; saloon assigned later or here)
/barbers                       Global barber search
/barbers/[id]                  Barber detail (read-mostly)
/customers                     Customers list
/customers/[id]                Customer detail
/bookings                      All bookings, all saloons
/bookings/[id]                 Booking detail
/audit                         Audit log explorer
/analytics                     Platform analytics
/notifications                 Inbox (system / alerts targeted at super-admin)
/profile                       Own profile
/auth/login
/auth/forgot
/auth/reset
404 / 500
```

There is no public sign-up for super-admin. Initial super-admin account is seeded via DB migration / one-off script. Additional super-admins (if ever) are created by another super-admin through `/admin/owners`-equivalent — but P1 may treat super-admin user creation as "out of UI" (DB only). If kept in UI: a `/super-admins` page mirroring `/owners` for completeness.

---

## 5. Global Layout

- **Left sidebar (persistent):** logo, then nav: Overview, Saloons, Owners, Barbers, Customers, Bookings, Analytics, Audit log, Notifications. Bottom of sidebar: env indicator (e.g. `staging`), version string.
- **Top bar:** breadcrumbs + page title; right side: global search input (or `/` shortcut), bell, avatar menu.
- **Command palette (`⌘K` / `Ctrl+K`):** global navigate-to (saloons, owners, barbers, customers, bookings) by name/email/ID; quick actions ("Create saloon", "Approve saloon X").
- **Banner area** (top, dismissable per session): system warnings (e.g. "Daily reminder job last ran > 1h ago"). Sourced from a backend health endpoint if available; otherwise hidden.

---

## 6. Screen-by-Screen

### 6.1 Overview `/`

**Purpose:** platform pulse.

**Backend:** `GET /api/v1/analytics/super-admin/overview?date_from=&date_to=`.

**Layout:**

1. **Top stat row** (cards):
   - Total saloons (active / pending approval / inactive split)
   - Total owners
   - Total barbers
   - Total customers
   - Bookings today
   - Bookings this month
   - GMV today (sum of completed bookings' total_price)
   - GMV this month

2. **Trend block:**
   - Date range picker (default last 30 days, presets 7/30/90/custom).
   - Charts: bookings per day (line), GMV per day (line), new signups per day (stacked bar by role: customer, barber, owner).

3. **Top tables:**
   - Top saloons by GMV (table with link to detail).
   - Top saloons by booking volume.
   - Saloons with highest cancellation/no-show rate (operator alert).

4. **Pending actions:**
   - Saloons in `pending_approval` status — quick "Approve" / "Reject" buttons.
   - (Future) flagged bookings, payment disputes, etc.

---

### 6.2 Saloons `/saloons`

**Purpose:** find and act on any saloon.

**Layout:**
- Filters: status (multi), city, sort (name, created_at, last_booking_at, GMV), free-text `q`.
- Table columns: Name, Owner (email), City, Status, Barbers, Services, Bookings (lifetime), GMV (lifetime), Created, kebab.
- Row actions in kebab: View, Approve (if pending), Suspend (if active), Reactivate (if inactive), Transfer ownership.
- Bulk select + bulk approve for `pending_approval` rows.

#### Detail `/saloons/[id]`

Tabbed:
- **Overview:** identity (read-only here), address, owner card, photos, status pill with state-change actions, key counts. ID + slug shown.
- **Services:** table of all services in the saloon.
- **Barbers:** table of all barbers.
- **Bookings:** filtered all bookings of this saloon (date range, status, barber, customer).
- **Audit log:** filtered audit log scoped to this saloon's entities.
- **Danger zone:** Suspend, Reactivate, Transfer ownership (modal: pick another owner from `/owners` autocomplete).

#### Create `/saloons/new`
- Form: saloon identity + owner picker (existing owner) OR "Create new owner inline" (name, email, phone). Submitting:
  - If owner exists: `POST /admin/saloons` (or platform-flavored saloon create) with `owner_id`.
  - If new owner: first `POST /admin/owners`, then create saloon with the returned ID.
- After success: the new saloon's status is `pending_approval` (or `active` based on admin choice — toggle on form). Redirect to detail.

---

### 6.3 Owners `/owners`

**Purpose:** owner accounts roster.

**Layout:**
- Filters: status, has-saloon (yes/no), `q`.
- Table: Name, Email, Phone, Saloon name (linked), Status, Created, kebab (View, Suspend/Reactivate, Resend invite).

#### Detail `/owners/[id]`
- Profile block: name, email, phone, status, dates.
- Saloons owned (one in P1).
- Activity (recent audit log entries).
- Actions: suspend / reactivate; reset password (sends reset email); resend invite if pending.

#### Create `/owners/new`
- Form: name, email, phone. Submit → `POST /admin/owners`. After: redirect to detail. From there, attach a saloon via "Create saloon for this owner" CTA.

---

### 6.4 Barbers `/barbers`

**Purpose:** global view of barbers across saloons.

**Layout:**
- Filters: saloon (autocomplete), status, `q` (name/email).
- Table: Name, Saloon, Email, Phone, Active, Bookings (lifetime), Cancel rate, Created.
- Detail (`/barbers/[id]`): read-mostly summary; ability to suspend the barber (which is effectively `is_active=false`) and contact info; their bookings table.

> Barber CRUD lives in the owner app. Super-admin's role here is oversight + emergency suspension.

---

### 6.5 Customers `/customers`

**Purpose:** find any user with role customer.

**Layout:**
- Filters: status, `q` (name/email/phone).
- Table: Name, Email, Phone, Bookings (lifetime), Last booking, Status, Created.
- Detail (`/customers/[id]`): profile, all bookings, activity. Actions: suspend / reactivate; reset password.

---

### 6.6 Bookings `/bookings` and `/bookings/[id]`

**Purpose:** see and act on any booking on the platform.

**List filters:** saloon (autocomplete), barber, customer, status (multi), date range, sort.
**Columns:** ID short, Saloon, Barber, Customer, Date+time, Services count, Total, Status.

**Detail:** identical to owner's booking detail but with extra actions:
- Force cancel.
- Force status change (any → any) — gated behind a confirmation. Backend must support force-status (P1: at minimum, super-admin can transition any status freely; if not, restrict to the same set as owner).
- Edit deposit_paid flag (P3 will use this; in P1, hide unless backend exposes).
- View full audit history of this booking.

---

### 6.7 Audit log `/audit`

**Purpose:** investigate.

**Filters:** actor (autocomplete user), action (autocomplete), entity type (`user`, `saloon`, `barber`, `service`, `booking`, etc.), entity ID, date range.

**Table:** time, actor (with role pill), action, entity, "Diff" link.

**Diff modal:** shows `before` and `after` JSON in two columns with diff highlighting. Read-only.

**Backend:** `GET /api/v1/admin/audit-log` with all filters mapped 1:1.

---

### 6.8 Analytics `/analytics`

**Purpose:** deeper than overview.

**Tabs:**
- **Growth:** signups per day, retention curves (if backend exposes; otherwise hidden), churn (suspended/inactive users).
- **Bookings:** volume, completion rate, cancellation rate, no-show rate over time; by city; by service category.
- **Saloons:** distribution by city, status, GMV; new saloons trend.
- **Operations:** notification volume, reminder coverage (% of bookings that received reminders), failed task counts (if backend exposes via a job-status endpoint).

All numbers from backend. No client-side aggregation.

---

### 6.9 Notifications `/notifications`

System-targeted notifications:
- New saloon awaiting approval
- Reminder job failed (if backend emits)
- Suspicious activity flags (future)

Same UI as other apps; standalone screen and bell badge.

---

### 6.10 Profile `/profile`

Own user info (name, phone, email read-only), change password, sign out. Same shape as owner app.

---

### 6.11 Auth

- `/auth/login`, `/auth/forgot`, `/auth/reset` — same shape as other apps.
- No invite flow shown (super-admin accounts are seeded out-of-band).

---

## 7. Components Inventory

- All primitives shared with the owner app (DataTable, FilterBar, DateRangePicker, StatCard, charts).
- `CommandPalette` (cmdk wrapper).
- `JsonDiff` viewer for audit log.
- `EntityAutocomplete` (saloon, owner, barber, customer search-as-you-type backed by API).
- `StatusPill`, `RoleBadge`.
- `BulkActionsBar` for tables.
- `DangerZone` block.
- `Sidebar`, `Topbar`, `Breadcrumbs`.

---

## 8. API Coverage Map

Super-admin uses every backend route at least once across screens. Highlights:

| Backend route | Used in |
|---|---|
| Auth set | auth + profile |
| `/users` (list), `/users/{id}`, `/users/{id}/status` (super_admin) | customers, owners, barbers, super-admins screens |
| `/saloons` list, detail, PATCH, DELETE | saloons |
| `/saloons/{id}/status` (super_admin) | approve/suspend/reactivate |
| `/admin/saloons` extended list | saloons (with extra columns: owner email, counts) |
| `/admin/saloons/{id}/transfer` | saloon detail Danger zone |
| `/admin/owners` (POST) | owners create |
| `/saloons/{id}/services`, services CRUD | saloon detail Services tab — read; CRUD lives in owner app, but super-admin also has access via shared endpoints |
| `/barbers/{id}` ... | global barber views |
| `/bookings` list (super_admin: any saloon) | bookings page |
| `/bookings/{id}` + status/cancel | booking detail |
| `/admin/audit-log` | audit log |
| `/analytics/super-admin/overview` | overview, analytics |
| Notifications endpoints | notifications page |

If any super-admin-only capability above does not yet exist on the backend, the doc on the backend side calls it out as required for P1 (cross-check section 14.10 in the backend doc).

---

## 9. Functionality Coverage Check

The super-admin can, end to end:
- See platform overview and trends.
- Approve / suspend / reactivate saloons; transfer saloon ownership.
- Create owners; create saloons; resend invites; reset passwords.
- View any user (customer, barber, owner) and suspend them if needed.
- View, filter, and act on any booking.
- Inspect the audit log of any entity.
- Read analytics across the platform.

Every backend P1 super-admin capability is reachable from the UI per §8.

---

## 10. Definition of Done — Super-Admin Frontend Phase 1

- All routes in §4 implemented with full content from §6.
- Command palette navigates to all major entities.
- Audit log diff viewer renders before/after JSON correctly for every audited action.
- Tables persist column visibility/sort per user (localStorage).
- All filters/sorts confirmed to round-trip the backend; no local filtering.
- Pending-approval saloons are visible and approvable from at least two places (Overview pending list and Saloons list).
- Lighthouse desktop ≥ 90 / 95.
- README parallels other apps' README.
