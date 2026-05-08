# Owner Frontend — Phase 1

> **Repo:** `saloon-frontend-owner`
> **Audience:** saloon owners managing one saloon (their own): the catalog of services, the roster of barbers, the schedule, all bookings, and basic analytics.
> **Phase:** 1 — no payments, no Google Calendar.
> **Audience for this doc:** Claude design / engineer who must build screens.

---

## 1. Product Identity & Feel

- **Operations dashboard.** The owner is sitting at a desk (often the front counter) with a laptop or tablet. Speed, density, and confidence matter more than delight.
- Desktop-first; tablet (≥ 768px) is a strong secondary; mobile (≤ 480px) is supported for "quick check on the go" but advanced editing concedes some friction there.
- Tone: clean, neutral, slightly more corporate than the barber app. A serious tool for running a small business.
- Tables, lists, and stat cards take primacy over hero imagery. Numbers are the heroes.
- Reuse component primitives from barber app where sensible; the visual identity should clearly belong to the same family but feel like a different product surface (think: barber = retail kiosk, owner = back office).
- Avoid: marketing illustrations, decorative gradients, heavy color in charts. Use one accent color for actions; status uses the same small palette as the barber app for consistency.

---

## 2. Global Rules

- Single API client; no business logic on the client beyond display formatting.
- The owner is scoped to **their own saloon**. Backend enforces this via role + ownership checks; the client never sends a `saloon_id` it didn't read from `GET /auth/me` or from the saloon detail returned for the owner.
- All lists are server-paginated, server-filtered, server-sorted.
- Server-driven validation is mirrored on the client only for immediate feedback; the server is authoritative.
- Confirmations on destructive operations (delete service, delete barber, cancel a booking on a customer's behalf, deactivate saloon).
- Audit-relevant actions show a small "this will be logged" hint near the confirm button on destructive flows (low-key, not alarming).
- Notifications: bell badge with count; deep-links to relevant entity.

---

## 3. Tech Stack

- Same family as customer/barber: Next.js + TypeScript + Tailwind + shadcn/Radix + TanStack Query + RHF + Zod + date-fns.
- Charts: Recharts (kept simple — bar, line, donut). No d3 in P1.
- Tables: TanStack Table.
- CSV export of bookings: client formats already-fetched-and-paginated data **only for the visible page**. Heavy exports (entire date range) call a backend export endpoint that returns CSV — **client must not iterate pagination to assemble exports.** If backend doesn't have an export endpoint in P1, the export button shows "Up to current page" and is small/secondary; full export is a P2 backend feature noted in the README.

---

## 4. Routes & Screen Inventory

```
/                        Dashboard (overview)
/saloon                  My saloon: details, photos, hours
/services                Services catalog (CRUD)
/barbers                 Barbers roster
/barbers/[id]            Barber detail + edit
/barbers/new             Add barber (creates user invite)
/bookings                All bookings with filters
/bookings/[id]           Booking detail
/analytics               Analytics page
/notifications           Inbox
/profile                 Owner profile
/auth/invite?token=...   First-time password setup (owner is created by super-admin via invite)
/auth/login
/auth/forgot
/auth/reset
404 / 500
```

Auth-required: everything except auth screens.

---

## 5. Global Layout

- **Persistent left sidebar** on tablet/desktop with the navigation items above. Collapsible to icons-only.
- **Top bar:** breadcrumb / page title on the left; on the right: bell, environment indicator (only visible if not production — for staging warning), avatar menu.
- **Mobile:** sidebar becomes a drawer; bottom nav not used (this app expects bigger screens for serious work).
- **Saloon switcher:** the owner has exactly one saloon in P1, so there is no switcher. The current saloon's name appears in the sidebar header.
- **Onboarding banner:** if any of these are not yet set up, show a non-dismissable top banner with a link to fix:
  - Saloon details incomplete (no address / no photos / no description).
  - No services in catalog.
  - No barbers.
  - Default open/close hours not set.

---

## 6. Screen-by-Screen

### 6.1 Dashboard `/`

**Purpose:** at-a-glance health of the saloon today and recent trend.

**Backend:** `GET /api/v1/analytics/owner/overview?date_from=&date_to=` plus `GET /api/v1/bookings?saloon_id=mine&date=today&size=20`.

**Layout:**

1. **Hero stat row** (4 cards):
   - Bookings today
   - Completed today
   - Cancellations today
   - Revenue today (sum of completed bookings' total_price; backend returns this number)

2. **"Now happening" panel:**
   - List of today's bookings filtered to `in_progress` and the next two upcoming. Each shows time, customer, barber, services chips. Clickable to detail.

3. **Trend section:**
   - Date range picker (default last 30 days, options: 7d / 30d / 90d / custom).
   - Three side-by-side mini-charts:
     - **Bookings per day** (bar)
     - **Completion vs cancellation rate** (stacked bar or line, whichever the data supports — use the format the backend returns)
     - **Revenue per day** (line)
   - Below charts: two side-by-side tables — "Top services" (count) and "Top barbers" (bookings count, completion rate, revenue contribution).

4. **Alerts strip:**
   - Items the owner should know: barbers with no working hours set, services with zero bookings in the last 30 days, etc. **Computed by backend**, surfaced as `alerts: []` on the analytics endpoint. If the backend doesn't provide it in P1, hide this section.

---

### 6.2 My saloon `/saloon`

**Purpose:** edit saloon profile.

**Sections (each saved independently with its own button):**

1. **Identity**
   - Name (required)
   - Slug (read-only; backend generates)
   - Phone
   - Description

2. **Address**
   - Address line, city, lat, lng (manual lat/lng inputs in P1; map picker is a P2 polish).
   - "Use map link" helper that opens Google Maps in a new tab to copy coordinates.

3. **Default hours**
   - Default open / default close (per-day overrides are managed at the barber level; saloon-level defaults are used for display when no barbers configured).
   - Timezone (read-only, set at creation).

4. **Photos**
   - Grid of current photos with remove and reorder controls. "Add photo" prompts for a URL in P1.
   - Backend: `POST /saloons/{id}/photos` with `{ url }`, `DELETE /saloons/{id}/photos/{idx}`.

5. **Status**
   - Current status pill: Active / Pending approval / Inactive.
   - "Request deactivation" / "Request reactivation" — sends a message; status changes are gated by super-admin (`PATCH /saloons/{id}/status` is super-admin only). The owner UI either submits a message endpoint (out of scope P1) or just shows the contact-support copy. Pick the simpler path: read-only status display in P1.

---

### 6.3 Services `/services`

**Purpose:** CRUD the service catalog.

**Layout:**
- Header: search input, category filter, "New service" CTA.
- Table:
  - Name
  - Category
  - Duration
  - Price
  - Deposit %
  - Active toggle (inline; toggling triggers PATCH)
  - Row actions: Edit, Delete (soft).
- Pagination at bottom.

**New / Edit service dialog (shared form):**
- Name (required, ≤ 160)
- Category (free text in P1; categories are not a separate entity yet)
- Description (optional, ≤ 1000)
- Duration in minutes (required, multiple of 5, between 5 and 480)
- Price (required, ≥ 0)
- Deposit % (default from saloon, range 0–100)
- "Save" → POST or PATCH; "Cancel" closes.

**Delete:** confirmation modal warning that the service will be hidden but past bookings keep their snapshots.

---

### 6.4 Barbers `/barbers` and `/barbers/new` and `/barbers/[id]`

#### List `/barbers`
- Header: search by name; status filter (Active / Inactive); "Add barber" CTA.
- Table or card grid (toggle): photo, name, services count, today's bookings count, status.
- Tap row → barber detail.

#### Add `/barbers/new`
- Form:
  - Name (required)
  - Email (required) — invite is sent here.
  - Phone (required)
  - Bio (optional)
  - Photo URL (optional)
  - Buffer mins (default 0; 0–60 in 5-min steps)
- On submit → `POST /api/v1/saloons/{my_id}/barbers`. Backend creates a `users` row with role `barber`, a `barbers` row, sends an invite email with a token link to the barber app.
- After success: redirect to `/barbers/[id]` and show toast "Invite sent to email".

#### Detail `/barbers/[id]`
- Header: photo, name, status pill, "Send re-invite" link if password not set yet.
- Tabs:
  - **Profile:** edit bio, photo, buffer; deactivate barber (soft delete).
  - **Services:** show services this barber currently offers; checkboxes to add/remove; "Save" sends `PUT /barbers/{id}/services`.
  - **Working hours:** read-only view of barber's weekly schedule. (Editing is the barber's job; show with a hint "Ask your barber to update from their app.") If you want to allow owner override, that is fine — backend already permits owner to PUT working hours. Permit it from the same editor used in the barber app.
  - **Time off:** read-only list with the option for owner to add time off on barber's behalf (backend already permits).
  - **Bookings:** filtered list of this barber's bookings.

---

### 6.5 Bookings `/bookings` and `/bookings/[id]`

#### List `/bookings`
- Filters bar (sticky):
  - Status (multi)
  - Barber (multi)
  - Date range (default: last 30 days)
  - Customer name `q`
  - Sort: newest, oldest, soonest start
- Table columns: Date+time, Customer, Barber, Services chips, Total, Status, kebab menu.
- Pagination at bottom.
- Right-side **Export CSV** button — uses backend export endpoint if available; otherwise current page only with a small caption.

#### Detail `/bookings/[id]`
- Header: status pill, booking ID short.
- Customer block: name, phone, notes.
- Barber block.
- Services list with snapshots.
- Totals.
- Activity timeline.
- Actions for the owner:
  - **Cancel booking** with reason (always allowed up to start_at; backend enforces).
  - **Reassign barber** — out of scope for P1 (no backend support listed). Hide button.
  - **Force status change** for past bookings (e.g. mark old confirmed booking as completed/no_show) — keep simple in P1: only allow `cancelled` and `no_show` from this UI; no override of `in_progress`/`completed` (those are barber-driven).

---

### 6.6 Analytics `/analytics`

**Purpose:** deeper view than the dashboard top section.

**Layout:**
- Date range picker top.
- Tabs:
  - **Overview:** repeats and expands the dashboard charts with bigger surfaces.
  - **Services:** table of services with bookings count, total revenue, average duration achieved, no-show rate. Sortable.
  - **Barbers:** table of barbers with bookings count, completion rate, no-show rate, revenue. Sortable.
  - **Customers:** top customers by bookings count and revenue; flag of "new vs returning" customers if backend provides it; otherwise omit.

All data is loaded from `GET /analytics/owner/overview` with the date range. **All aggregation done by backend.**

---

### 6.7 Notifications `/notifications`

Same shape as customer/barber apps. P1 owner notifications:
- New booking in saloon (high volume; consider digest later)
- Cancellation on owner's saloon
- Barber set their working hours / time off
- System alerts (e.g. saloon approved by super-admin)

If notification volume is high, the backend may already digest in-app entries; client just renders.

---

### 6.8 Profile `/profile`
- Owner's own user info: name, phone, email (read-only).
- Change password.
- Sign out.

---

### 6.9 Auth & invite

- `/auth/invite?token=...` — analogous to barber: shows owner name + saloon name, password fields, sets initial password.
- `/auth/login`, `/auth/forgot`, `/auth/reset` — same as barber app.

---

## 7. Components Inventory (must build / extend from barber app)

- All form primitives + table primitives.
- `StatCard`, `LineChart`, `BarChart`, `DonutChart` wrappers around Recharts.
- `DataTable` (TanStack Table) with column sort + selection + row actions menu.
- `FilterBar`, `DateRangePicker`, `MultiSelect`.
- `BookingTableRow`, `ServiceForm`, `BarberForm`, `WorkingHoursEditor` (shared with barber app via copy or extracted package later).
- `Sidebar`, `Topbar`, `Breadcrumbs`.
- `OnboardingBanner`.
- `ConfirmDialog`, `EmptyState`, `ErrorState`, `Skeleton`.
- `CsvExportButton`.

---

## 8. API Coverage Map

| Backend route | Used in |
|---|---|
| POST `/auth/login`, refresh, logout, forgot, reset, change-password | auth screens / profile |
| GET `/auth/me`, `/users/me`, PATCH `/users/me` | session, profile |
| GET `/saloons/{my_id}` | dashboard, my saloon |
| PATCH `/saloons/{my_id}` | my saloon save |
| POST `/saloons/{my_id}/photos`, DELETE `.../photos/{idx}` | my saloon photos |
| GET `/saloons/{my_id}/services` | services list |
| POST `/saloons/{my_id}/services`, PATCH `/services/{id}`, DELETE `/services/{id}` | services CRUD |
| GET `/saloons/{my_id}/barbers` | barbers list |
| POST `/saloons/{my_id}/barbers` | add barber |
| GET `/barbers/{id}`, PATCH `/barbers/{id}`, DELETE `/barbers/{id}` | barber detail |
| GET `/barbers/{id}/services`, PUT `/barbers/{id}/services` | barber services tab |
| GET `/barbers/{id}/working-hours`, PUT `/barbers/{id}/working-hours` | barber working hours tab |
| GET `/barbers/{id}/time-off`, POST `/barbers/{id}/time-off`, DELETE `/time-off/{id}` | barber time off tab |
| GET `/bookings?saloon_id=mine&...` | bookings list |
| GET `/bookings/{id}`, PATCH `/bookings/{id}/cancel`, PATCH `/bookings/{id}/status` | booking detail |
| GET `/analytics/owner/overview` | dashboard, analytics |
| GET `/notifications`, POST `/notifications/{id}/read`, POST `/notifications/read-all` | notifications |

Routes NOT used: customer-facing public discovery, super-admin endpoints.

---

## 9. Functionality Coverage Check

The owner can, end to end:
- Set up their saloon profile (identity, address, photos, default hours).
- CRUD services.
- Invite barbers, manage their roster, edit barber profiles, view their schedules and time off, override if needed.
- See and filter all bookings; cancel bookings; mark old confirmed bookings as cancelled or no-show if appropriate.
- See dashboard and detailed analytics.
- Receive notifications.
- Manage their own user (password, profile).

Every backend P1 owner-scoped capability is reachable from the UI per §8.

---

## 10. Definition of Done — Owner Frontend Phase 1

- All routes in §4 with full content from §6.
- All filters and sorts pass through to the backend; verified by network inspector that no client-side filtering is taking place.
- Service and barber forms validate identically to backend (mirror Zod schemas).
- Booking list and analytics render correctly for date ranges of 1 day, 30 days, 90 days.
- Onboarding banner shown for an empty saloon and disappears once each step is complete.
- Tablet (1024px) and desktop (1440px) reviewed; mobile (≤480px) "view only / minimal edit" reviewed.
- Lighthouse desktop: Performance ≥ 90, Accessibility ≥ 95.
- README parallels customer app's.
