# Barber Frontend — Phase 1

> **Repo:** `saloon-frontend-barber`
> **Audience:** barbers (employees of saloons) running their day from this app.
> **Phase:** 1 — manage own schedule, see and run today's bookings, set working hours, set time off, manage own service list.
> **Audience for this doc:** Claude design / engineer who must build screens.

---

## 1. Product Identity & Feel

- **At-the-chair tool**, not a portal. Barbers are standing, hands sometimes wet. The interface must read at a glance and respond on the first tap.
- Mobile-first; tablet (iPad-class) is a first-class secondary target — many saloons keep an iPad at the station. Desktop is a courtesy.
- Tone: utilitarian, confident, calm. Less marketing energy than the customer app. Think point-of-sale meets calendar.
- **Today is the homepage.** The first thing a barber sees on opening the app is "what am I doing right now and what's next".
- Big timestamps, big names, big buttons. A walking-by-the-mirror glance must answer "who's next, when".
- Slight density allowed — these users want to see more in one screen than customers do.
- One color carries the action affordance; status uses a small, consistent color set. Photography sparingly; this is not a marketing surface.
- Avoid: cute illustrations, whimsy copy, chatty empty states.

---

## 2. Global Rules

- Single API client. No business logic on the client beyond display formatting.
- All lists, filters, sorts come from backend. The client never filters or aggregates locally.
- Time is shown in the saloon's local timezone (returned by API).
- Status changes (start, complete, no-show) are committed via PATCH; the UI shows the optimistic state but rolls back on failure.
- Confirmations only on destructive actions (cancel a customer's booking). Status-forward actions (start, complete) are one-tap.
- All long lists are server-paginated.
- Strict role check: this app only loads if the logged-in user has role `barber`. Other roles are signed out and shown a redirect to the right app.
- Notifications: bell badge with count; tapping a booking-related notification deep-links to the booking.
- Offline tolerance: if a status change fails due to network, queue it and retry on reconnect; show a "Pending sync" badge.

---

## 3. Tech Stack

- Same as customer app: Next.js + TypeScript + Tailwind + Radix/shadcn + TanStack Query + React Hook Form + Zod + date-fns.
- No PWA in P1 but routes/build configured to add it cleanly later.

---

## 4. Routes & Screen Inventory

```
/                          Today (default home)
/schedule                  Day / week calendar view
/bookings                  All bookings list with filters
/bookings/[id]             Booking detail
/services                  Services I offer (assign/unassign)
/working-hours             Weekly working hours editor
/time-off                  Time-off list and editor
/profile                   Bio, photo, buffer, account
/notifications             Inbox
/auth/invite?token=...     Set initial password (from email invite)
/auth/login                Login
/auth/forgot               Forgot password
/auth/reset                Reset password
404 / 500
```

Auth-required: everything except auth screens.

---

## 5. Global Layout

### 5.1 Top bar
- Left: hamburger (mobile) or sidebar collapse (tablet/desktop).
- Center: contextual page title (e.g. "Today, Fri 9 May") — barbers should always know where they are.
- Right: bell with unread badge; avatar menu (Profile, Sign out).

### 5.2 Side nav (tablet/desktop) / drawer (mobile)
- Today
- Schedule
- Bookings
- Services
- Working hours
- Time off
- Profile

### 5.3 Bottom nav (mobile only)
4 icons: Today · Schedule · Bookings · More (drawer for the rest).

### 5.4 Persistent banner
- If barber's working hours are not set up at all → a top banner: "Set your working hours so customers can book you" → `/working-hours`.
- If status of the saloon is `inactive` → banner "This saloon is currently inactive. New bookings are paused."

---

## 6. Screen-by-Screen

### 6.1 Today `/`

**Purpose:** the most important screen. Run the day.

**Layout (top to bottom):**

1. **Header strip**
   - Big date.
   - Day stats pill row: "5 bookings · 3 done · 1 in progress · 1 upcoming · ₹4,800 expected".
   - Computed by backend: `GET /api/v1/barbers/{me}/bookings?date=today&include_summary=true`.

2. **Now / Next card**
   - Big card. If a booking is `in_progress` → show that one. Else next upcoming booking.
   - Contents: time range (e.g. "4:00 PM → 4:45 PM"), customer name, service list as chips, customer phone with tap-to-call icon.
   - Big actions:
     - If `confirmed`: "Start" button.
     - If `in_progress`: "Complete" button.
     - Always available: "Cancel" (destructive ghost), "Mark no-show" (only after `start_at`).

3. **Timeline list**
   - Vertical list of all today's bookings in order.
   - Each row:
     - Left rail: time range and status dot.
     - Body: customer name, services chips, total duration and price.
     - Right: chevron → booking detail.
     - Cancelled / no-show rows are dimmed and struck-through on the time.
   - The current time is indicated by a thin horizontal red line drawn between rows whose time ranges straddle "now".
   - Empty state: "No bookings today. Take a coffee."

4. **Floating quick actions** (tablet/desktop)
   - "Block time" → opens time-off modal pre-filled to today.
   - "Add walk-in" → opens a sheet to create a same-day booking on behalf of a walk-in customer (creates a customer-less booking). **In P1 this is OUT OF SCOPE** unless backend supports it; remove the button if not. Recommend hiding for P1 and noting as P2 work.

**Polling:** Today's list refetches on focus and every 60s while the screen is open (TanStack Query).

---

### 6.2 Schedule `/schedule`

**Purpose:** broader view than Today, but still operational.

**Tabs / view-switcher:** Day · Week. Default Week on tablet/desktop, Day on mobile.

**Day view:**
- Vertical timeline 8 AM → 9 PM (working hours window expanded by 30 min on both ends).
- Working blocks shaded; non-working areas hatched grey ("Off").
- Bookings drawn as blocks with customer name; multi-service bookings show internal divider lines per service item.
- Time-off blocks drawn distinctly (striped overlay) with the reason.
- Tap a booking block → booking detail.
- Tap an empty area inside working hours → quick-add time-off sheet ("Block this time?").

**Week view (mobile):** stacked day cards, each showing booking count and a tiny dot timeline.
**Week view (tablet/desktop):** classic 7-column grid.

**Date navigation:** previous/next chevrons, "Today" button, mini date picker.

**Backend:** `GET /api/v1/barbers/{me}/bookings?date_from=&date_to=` and `GET /api/v1/barbers/{me}/working-hours` and `GET /api/v1/barbers/{me}/time-off?...`. All grouping/positioning is done from data; no client-side computation of availability.

---

### 6.3 Bookings list `/bookings`

**Purpose:** searchable history and filterable view.

**Filters (in a sheet/popover):**
- Status (multi)
- Date range
- Customer name (`q`)
- Sort: newest / oldest / by start time

**List:** booking cards with date, time, customer, services chips, status pill. Tap → detail.

**Pagination:** infinite scroll on mobile, "Load more" on desktop.

**Backend:** `GET /api/v1/barbers/{me}/bookings` with all filters mapped 1:1.

---

### 6.4 Booking detail `/bookings/[id]`

**Header:** date, time range, status pill.

**Customer block:** name, phone with tap-to-call, optional notes from customer.

**Services list:** each item with start–end, name, duration, price.

**Totals:** subtotal, deposit (informational in P1), total.

**Activity timeline (small):** created at, last status change, who changed.

**Actions** (depend on current status and time):
- `confirmed`:
  - **Start** → `PATCH /bookings/{id}/status` to `in_progress`.
  - **Cancel** → `PATCH /bookings/{id}/cancel` with required reason (modal with reason textarea ≥ 5 chars).
- `in_progress`:
  - **Complete** → status to `completed`.
  - **Cancel** still allowed.
- After `start_at` and still `confirmed`:
  - **Mark no-show** → status to `no_show` (modal confirmation).
- `completed` / `cancelled` / `no_show`: no actions, only history.

All actions disable the button while in flight; on success, refetch detail and Today.

---

### 6.5 Services `/services`

**Purpose:** the barber chooses which services they personally offer from the saloon's catalog. Only the saloon owner creates services; the barber only opts in/out.

**Layout:**
- Search input + category chips.
- List of services in this saloon. Each row: name, duration, price, description; right side a toggle (on = barber offers this service).
- Toggling either adds or removes a `barber_services` association via `PUT /api/v1/barbers/{me}/services` (replace strategy: client sends the full new list of service IDs).
- A sticky footer at the bottom: "Save changes" CTA appears when the local set differs from the server set. Discard cancels.
- Empty state: "Your saloon has no services yet. Ask your owner to add some."

---

### 6.6 Working hours `/working-hours`

**Purpose:** weekly schedule editor.

**Layout:**
- Seven rows, one per weekday. Mon → Sun.
- Each row has:
  - Day name on the left.
  - A toggle "Open / Closed".
  - If open: a list of intervals (e.g. `09:00 – 13:00`, `14:00 – 20:00`). Each interval has start/end pickers and a remove button. A "+ Add interval" link adds another interval (for split-shift / lunch breaks).
- "Apply Mon to all weekdays" quick action.
- "Apply Mon–Fri to weekends" quick action.
- Bottom: "Save schedule" CTA (sticky on mobile). Save calls `PUT /api/v1/barbers/{me}/working-hours` with the entire set; backend replaces atomically.
- Validation (mirror backend): each interval `end > start`; intervals on a day must not overlap; max 4 intervals per day; pickers in 5-min increments.
- After save, success toast; if any active future bookings now fall outside working hours, backend either rejects (409 with affected booking IDs) or accepts and the UI shows a warning listing those bookings — backend chooses; client must handle the 409 gracefully by listing the conflicting bookings with quick links.

---

### 6.7 Time off `/time-off`

**Purpose:** block ranges (vacation, sick, errand) where the barber is unavailable.

**Layout:**
- Tabs: Upcoming · Past.
- Each row: start–end date/time, reason, remove button (upcoming only).
- "+ New time off" CTA → modal:
  - Start date+time, end date+time, optional reason.
  - Validation: end > start; cannot overlap with existing time off.
  - Submit → `POST /api/v1/barbers/{me}/time-off`.
- Removing future time off: `DELETE /api/v1/time-off/{id}`.
- If creating time off would conflict with existing bookings, backend returns 409 with the affected bookings; UI shows them and offers "Cancel those bookings now" deep-link.

---

### 6.8 Profile `/profile`

**Purpose:** identity and personal settings.

**Fields:**
- Name (read-only — owner sets it; if backend allows self-edit, allow).
- Email (read-only).
- Phone (editable).
- Photo upload (URL-based in P1: barber pastes URL or uploads via a simple endpoint; if no upload service in P1, accept URL only).
- Bio (textarea, ≤ 500 chars).
- Buffer time between bookings (number, 0–60 mins, in 5-min increments). Saving updates `barbers.buffer_mins`.

**Save:** `PATCH /api/v1/barbers/{me}` and `PATCH /api/v1/users/me` for the user-owned fields.

**Section:** Change password → modal as in customer app.

**Section:** Sign out.

---

### 6.9 Notifications `/notifications`

Same structure as customer app: grouped by today/this week/older, mark read on tap, "Mark all read" header action.

Notification kinds for barbers in P1:
- New booking created with you (deep-link to booking)
- Booking cancelled by customer
- Reminder: booking starts in 1 hour
- Working-hours / time-off conflict alerts (if backend emits them)

---

### 6.10 Auth & invite

#### `/auth/invite?token=...`
- After owner creates a barber account, backend emails an invite link with a token.
- Page: shows the barber's name and saloon name (decoded from token via a public-by-token endpoint or as part of the invite payload), a password + confirm password form, and a "Set password and continue" CTA.
- On submit → backend exchanges token for credentials and returns tokens; redirect to `/`.

#### `/auth/login`, `/auth/forgot`, `/auth/reset` — identical structure to customer app, only branding/title differs.

---

## 7. Components Inventory (must build)

- `Button`, `IconButton`.
- `TextField`, `Textarea`, `NumberField`, `TimePicker (5-min granularity)`, `DatePicker`, `DateRangePicker`.
- `Toggle`, `Switch`, `Chip`, `StatusPill`.
- `Card`, `Surface`, `Banner`, `Toast`, `Modal`, `BottomSheet`, `Stepper`.
- `BookingRow`, `BookingDetailHeader`, `TimelineList`, `DayTimeline`, `WeekGrid`, `WorkingHoursDayRow`, `TimeOffRow`, `ServiceToggleRow`, `EmptyState`, `ErrorState`, `Skeleton`.
- `TopBar`, `SideNav`, `BottomNav`.

---

## 8. API Coverage Map (every backend route a barber may use → screen)

| Backend route | Used in |
|---|---|
| POST `/auth/login` | `/auth/login` |
| POST `/auth/refresh` | API client |
| POST `/auth/logout` | profile menu |
| GET `/auth/me` | session bootstrap |
| POST `/auth/forgot-password` | `/auth/forgot` |
| POST `/auth/reset-password` | `/auth/reset` |
| POST `/auth/change-password` | profile change-password modal |
| (invite acceptance endpoint, exact path TBD by backend) | `/auth/invite` |
| GET `/users/me`, PATCH `/users/me` | `/profile` |
| GET `/barbers/{me}` | `/profile` (loads buffer, photo, bio) |
| PATCH `/barbers/{me}` | `/profile` save |
| GET `/barbers/{me}/services` | `/services` (load assigned set) |
| PUT `/barbers/{me}/services` | `/services` save |
| GET `/saloons/{id}/services` | `/services` (load full catalog) |
| GET `/barbers/{me}/working-hours` | `/working-hours` (load) |
| PUT `/barbers/{me}/working-hours` | `/working-hours` (save) |
| GET `/barbers/{me}/time-off` | `/time-off` |
| POST `/barbers/{me}/time-off` | `/time-off` add |
| DELETE `/time-off/{id}` | `/time-off` remove |
| GET `/barbers/{me}/bookings` | Today, Schedule, Bookings list |
| GET `/bookings/{id}` | booking detail |
| PATCH `/bookings/{id}/status` | start, complete, no-show |
| PATCH `/bookings/{id}/cancel` | cancel |
| GET `/notifications`, POST `/notifications/{id}/read`, POST `/notifications/read-all` | notifications |

Routes NOT used: customer-facing public discovery, owner/super-admin endpoints.

---

## 9. Functionality Coverage Check

The barber can, end to end:
- Accept invite, set password, log in.
- See today's queue and run it (start, complete, cancel, no-show).
- Browse, filter, and inspect any booking.
- Configure weekly working hours with breaks.
- Add and remove time off.
- Pick which services they offer from the saloon catalog.
- Update their bio, photo, phone, buffer time.
- Receive and read notifications.

Every backend P1 capability used by a barber maps to a screen in §8.

---

## 10. Definition of Done — Barber Frontend Phase 1

- All routes in §4 with full screen content from §6.
- Today screen polls every 60s and on focus.
- Working-hours editor saves atomically (no partial updates) and gracefully handles backend conflict responses.
- Time-off creation surfaces booking conflicts with deep links.
- Booking status transitions are one-tap with optimistic UI and offline retry.
- All states (loading / empty / error / offline) implemented.
- iPad (768×1024) layout reviewed in addition to mobile and desktop.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
- README parallels customer app's.
