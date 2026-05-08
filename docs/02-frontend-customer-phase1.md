# Customer Frontend — Phase 1

> **Repo:** `saloon-frontend-customer`
> **Audience:** customer (end user booking saloon services).
> **Phase:** 1 — Basic booking flow, no online payment, no Google Calendar visible to customer.
> **Audience for this doc:** Claude design / engineer who must build screens. Every screen, every element, every state listed. No invention required.

---

## 1. Product Identity & Feel

- Mobile-first; designed for ≤ 380px width, scales up gracefully to desktop. The desktop view is the mobile layout centered with breathing room — never a dense dashboard.
- Tone: calm, premium, trustworthy. The user is choosing where to put their head — they want to feel the place is real and clean.
- Photography-forward: saloon photos and barber portraits do heavy emotional lifting.
- Generous whitespace. One primary action per screen. Big tap targets.
- Quiet motion: brief slide-in for slot picker, gentle fades for state changes. Never bouncy, never flashy.
- Friendly but minimal copy. Real-language confirmations ("You're booked for Friday at 4:30 PM with Ravi") not jargon ("Booking #84a3 confirmed").
- Light theme primary; dark theme respected if system prefers — but light is the design canvas.
- Avoid: neon, gradients screaming "tech startup", glassmorphism, illustrations of buzzing scissors. Real photography, not stock vectors.

---

## 2. Global Rules

- All API calls go through a single client module that handles auth tokens, refresh, error envelope, and request IDs. No `fetch` scattered across components.
- **No business logic on the client.** No filtering of slot lists, no sorting, no aggregation, no slot calculation, no eligibility checks. The client renders what the API gives.
- The client may do: input formatting, simple field validation that mirrors backend validation (length, required, pattern), optimistic UI for read-only toggles (e.g. mark notification read), debounce of search input.
- Every list screen uses server-side pagination (page + size) and server-driven filtering. Infinite scroll preferred on mobile.
- Loading states: skeletons (not spinners) for primary content; spinner only for actions (e.g. button loading).
- Empty states: dedicated illustrations + helpful CTA. Never blank screens.
- Error states: clear, human, with a retry. Never a raw stack or a generic "Something went wrong".
- Time displayed in saloon's local timezone (returned by API). Date displayed in user's locale; format like "Fri, 9 May · 4:30 PM".
- Currency: ₹, no decimals when whole; otherwise 2.
- All forms: inline field errors below each field, primary CTA disabled until valid, server errors shown above CTA.
- All destructive actions (cancel booking, delete account) confirm via modal.
- Accessibility: WCAG AA, keyboard navigable, focus rings visible, alt text on every image, ARIA on every interactive non-button.

---

## 3. Tech Stack

- Framework: Next.js (App Router) + TypeScript.
- Styling: Tailwind CSS.
- UI primitives: Radix UI / shadcn (buttons, dialog, sheet, popover, tabs).
- Forms: React Hook Form + Zod (Zod schemas mirror backend validation rules).
- Data fetching: TanStack Query (one queryKey scheme per resource).
- State: TanStack Query for server state. Tiny Zustand store only for non-server UI state (active step in booking flow, draft selections persisted to sessionStorage).
- Auth tokens stored in HTTP-only cookies set by the API; client never reads tokens directly. Use Next middleware to gate authenticated routes.
- Icons: Lucide.
- Dates: `date-fns` + `date-fns-tz`.
- No analytics in P1 (placeholder hook only).

---

## 4. Routes & Screen Inventory

```
/                             Home / discovery
/saloons                      Search / filter list
/saloons/[slug]               Saloon detail
/saloons/[slug]/book          Booking flow (multi-step)
/auth/login                   Login
/auth/register                Customer signup
/auth/forgot                  Forgot password
/auth/reset?token=...         Reset password
/account                      My account (root)
/account/bookings             My bookings list
/account/bookings/[id]        Booking detail
/account/profile              Profile edit
/account/notifications        Notifications inbox
/legal/terms                  Static
/legal/privacy                Static
404 / 500                     Error pages
```

Auth-required routes: `/account/*` and `/saloons/[slug]/book`. Unauthenticated user attempting `/saloons/[slug]/book` → redirected to `/auth/login?redirect=/saloons/[slug]/book` and returned to flow after login.

---

## 5. Global Layout

### 5.1 Top bar (mobile)
- Left: brand mark (text logo).
- Right: a single icon button — bell with unread count badge if logged in, else "Sign in" text link.
- Search affordance NOT in top bar; lives on home page.

### 5.2 Top bar (desktop ≥ 1024px)
- Left: brand mark.
- Center: search input that navigates to `/saloons?q=...` on submit.
- Right: bell icon, then avatar with menu (Account, Bookings, Logout) if logged in, else "Sign in" + "Sign up".

### 5.3 Bottom nav (mobile only, only when logged in)
Four icons: Home · Bookings · Notifications · Account. Active item gets filled icon and tinted label. The booking flow hides the bottom nav.

### 5.4 Footer (desktop only)
Brand, city links (top cities for SEO — populated from API later), legal links, "for business" link to owner sign-up CTA → external/admin domain.

---

## 6. Screen-by-Screen

### 6.1 Home `/`

**Purpose:** let user find a saloon by location or by browsing.

**Sections (top to bottom):**
1. **Hero block.**
   - Headline: short, e.g. "Skip the wait. Book your chair."
   - Subline: one line.
   - Primary CTA: location picker (uses browser geolocation with permission prompt) → fills city → navigates to `/saloons?city=...`.
   - Secondary CTA: "Browse saloons" → `/saloons`.
   - Background: a photographic image (premium saloon interior). Text legible over it via subtle scrim.

2. **"Popular near you" rail.**
   - Calls `GET /saloons?city={detected_city}&sort=-popularity&size=10` (popularity sort allowed by backend list filter set).
   - Horizontally scrollable cards on mobile, grid on desktop. Each card: photo, name, city, star (if reviews later). Tap → saloon detail.
   - Empty state: "We're not in your city yet — try browsing all saloons" + browse CTA.

3. **"By service" rail.**
   - Static service tiles (Haircut, Beard trim, Hair color, Spa). Each tile navigates to `/saloons?service=<slug>`.

4. **Trust strip.**
   - 3 small icons + label: "Confirmed bookings", "No more waits", "Cancel up to 2h before".

5. **Footer.**

**States:** geolocation denied → fall back to a default city dropdown above the rail. Loading → skeleton rails. Error → toast + retry on rail.

---

### 6.2 Search list `/saloons`

**Purpose:** filtered list of saloons.

**Layout:**
- Sticky header below top bar containing:
  - Search input (debounced 300ms → updates `q`).
  - Filter button → opens a bottom sheet (mobile) / popover (desktop) with: City picker (dropdown), Service multi-select (chips), Distance slider (visible only if geolocation allowed), Sort dropdown ("Closest", "Top rated", "Newly added", "Name A–Z").
  - Active filters shown as removable chips just under the search input.
- Body: list of saloon cards.
- Each card:
  - Cover photo (16:9).
  - Name (bold), city + neighborhood, distance if available.
  - 1-line description (truncated).
  - Bottom row: "From ₹X" (lowest service price returned by API), "X services", and a "Book" CTA that goes to detail page.

**Pagination:** infinite scroll on mobile (`IntersectionObserver`); "Load more" button on desktop fallback.

**States:**
- Loading: 6 skeleton cards.
- Empty: "No saloons match your filters" + "Clear filters" CTA.
- Error: "Couldn't load saloons" + retry button.

**Backend mapping:** `GET /api/v1/saloons` with all UI controls mapping 1:1 to query params. Client never filters locally.

---

### 6.3 Saloon detail `/saloons/[slug]`

**Purpose:** trust + decide → start booking.

**Layout:**
1. **Photo carousel** (full-width, swipeable, indicator dots).
2. **Identity block:** name, city/neighborhood, distance, address line, phone with tap-to-call. Map static thumbnail (clickable → opens Google Maps).
3. **Tabs:** Services · Barbers · About · Hours.

**Services tab:**
- List grouped by category (returned by API). Each service row: name, duration ("30 min"), price, "Add" button.
- "Add" toggles a multi-select state. The list maintains an order of addition.
- A sticky bottom **Selection bar** appears once ≥ 1 service selected. It shows: services count, total duration, total price, and a **"Continue to booking"** CTA that navigates to `/saloons/[slug]/book` with selection passed via sessionStorage (key: `bookingDraft`).

**Barbers tab:**
- Grid (2 columns mobile) of barber cards: portrait, name, short bio (1 line), "Services offered: 8" count.
- Tap a card → modal/bottom sheet with full bio, all services they offer, and a "Book with [name]" CTA that pre-selects barber for the flow.

**About tab:**
- Description, owner-set details (returned by saloon detail API).

**Hours tab:**
- Saloon default open/close per weekday (computed by API as the union of all barber working hours, or the saloon defaults — whichever the API returns). Display as a 7-row list. Today's row is highlighted with a "Open now / Closed" pill computed by API (`is_open_now: bool`).

**States:** loading skeletons per tab; if saloon not found → 404 page.

---

### 6.4 Booking flow `/saloons/[slug]/book`

The whole flow is one route with internal **steps**, each step a separate sub-component. URL stays the same, but the back button goes step-by-step (uses Next.js shallow routing or local history). Bottom nav hidden; a simple top header has back arrow + step indicator ("Step 2 of 4").

**Step 1 — Services**
- Shows the services from the saloon, with the current selection from `bookingDraft` already toggled on.
- User can add/remove. Same UI as Services tab.
- Bottom: total duration + total price; CTA "Next: Choose barber".
- Validation: at least one service. Backend validates again.

**Step 2 — Barber**
- Two clearly equal-weight options at the top: **"Any available barber"** (radio-card with explainer "We'll match you with the next free chair.") and **"Choose a specific barber"**.
- If user picks "Choose a specific barber": list of barbers below who offer **all** selected services. The list is fetched fresh: `GET /api/v1/saloons/{id}/barbers?offers_services={ids}` (this filter must be supported in backend; otherwise the endpoint returns all barbers and backend tags compatible ones with `offers_all_selected: true`, and the client only displays compatible ones — but does not compute the filter itself).
- Each barber card: portrait, name, "Buffer: 5 min" optional info.
- Empty: "No barber in this saloon offers all of these services. Try removing one." with quick chip removal.
- CTA: "Next: Pick a date".

**Step 3 — Date & Slot**
- A 14-day horizontal date strip starting today; dates that have any availability are tappable, others greyed out. Availability per date is fetched in one bulk call: `GET /api/v1/slots/<specific|any>?date_from&date_to&...`. **Important: the backend is responsible for telling the client which dates have any slots; the client must not infer it.** If backend doesn't expose this in P1, the client falls back to: tapping a date triggers slot fetch, and "no slots" is shown after.
- Below: list of slot times for the selected date, grouped by morning/afternoon/evening (groups computed by backend in the response, or by simple fixed cutoffs if not — for P1, backend returns grouped lists keyed by `morning|afternoon|evening`).
- Each slot is a chip ("4:30 PM"). Selected chip highlighted.
- If "Any available" was chosen in step 2, each slot chip also shows the matched barber's first name underneath (e.g. "with Ravi") because the backend already paired barbers per slot.
- Below the slot grid: a small line "All times shown in saloon's local time".
- CTA "Next: Review" — disabled until a slot is picked.

**Step 4 — Review & confirm**
- Summary card:
  - Saloon name + address.
  - Date and time, duration total.
  - Barber name + portrait.
  - Each service with price; subtotal; deposit shown ("₹X due online — coming soon"); total.
- "Add a note for the barber" textarea (optional).
- Cancellation policy line ("Free to cancel up to 2 hours before.").
- Primary CTA: **"Confirm booking"**.
- On submit → `POST /api/v1/bookings`. Loading state on the button, disabled.
  - 201 → navigate to `/account/bookings/[id]?just_booked=true`.
  - 409 (slot taken) → modal "This slot just got booked by someone else. Pick another time?" → return to Step 3, refresh slots.
  - Other errors → toast with API message, allow retry.

**Login interception:** if user is not logged in when reaching Step 4 → modal "Sign in to confirm" with email/password and "Create account" link. After auth, the draft is preserved and the booking is submitted.

---

### 6.5 Auth screens

#### 6.5.1 Login `/auth/login`
- Email + password fields.
- "Forgot password?" link below the password field.
- "Sign in" CTA → `POST /api/v1/auth/login`.
- "Create account" link below CTA.
- After success: redirect to `?redirect=` if present, else `/`.
- Errors: invalid credentials → inline error above fields; rate-limited → toast.

#### 6.5.2 Register `/auth/register`
- Name, email, phone, password, confirm password.
- Inline validation (email format, phone digits, password ≥ 8).
- "Create account" CTA → `POST /api/v1/auth/register/customer`.
- After success: auto-login (backend returns tokens) and redirect to `?redirect=` or `/`.

#### 6.5.3 Forgot password `/auth/forgot`
- Email field. CTA. Confirms with "If this email exists, a reset link has been sent."

#### 6.5.4 Reset password `/auth/reset?token=...`
- New password + confirm. CTA → `POST /auth/reset-password`.
- Success → redirect to `/auth/login` with flash "Password reset. Sign in to continue."

---

### 6.6 Account

#### 6.6.1 Account home `/account`
- Greeting "Hi, [name]".
- 4 large cards / list rows: My bookings · Profile · Notifications · Sign out.
- On desktop: two-column layout with persistent sidebar of these links.

#### 6.6.2 My bookings `/account/bookings`
- Tabs: **Upcoming** · **Past**. Default Upcoming.
- Each booking card:
  - Date and time large.
  - Saloon name + city.
  - Barber name + portrait small.
  - Services as chips.
  - Status pill (Confirmed / Completed / Cancelled / No-show).
  - Right-side chevron → detail.
- Mobile: list. Desktop: cards 2-up grid.
- Empty Upcoming: "No upcoming bookings — find a saloon" CTA → `/saloons`.
- Empty Past: "Your past bookings will show up here."

**Backend:** `GET /api/v1/bookings/me?status=upcoming|past` — backend interprets `upcoming` as `status in (confirmed, in_progress) AND start_at >= now` and `past` as `status in (completed, cancelled, no_show) OR start_at < now`. The client passes the simple flag; **client does not filter**.

#### 6.6.3 Booking detail `/account/bookings/[id]`
- Header: saloon name, status pill.
- Big block: date and time, with "Add to calendar" button (downloads .ics generated client-side from the booking object — purely formatting, allowed).
- Map thumbnail + address with "Get directions" link.
- Barber card.
- Services list with prices, subtotal, deposit, total.
- Notes (your note + any note added by barber if backend exposes one in P2; not in P1).
- **Actions:**
  - If status is Confirmed AND now < start_at − 2h: "Cancel booking" button (destructive style, confirms in modal). On confirm → `PATCH /bookings/{id}/cancel`.
  - Else: hide action with a small line "Cancellation window has passed."
- "Reschedule" is **NOT** in P1. Out of scope.

If `?just_booked=true`: show a top success banner "You're booked. We've sent the details to your email." that auto-dismisses after 8s.

#### 6.6.4 Profile `/account/profile`
- Form: name, phone (email read-only).
- Save → `PATCH /users/me`.
- Below: "Change password" link → modal with old/new/confirm.
- Below: "Delete account" link → confirmation modal with typed confirmation. (Backend endpoint not required in P1; the modal can show "Contact support to delete your account" if the endpoint isn't built. Pick the simpler path: hide the delete option in P1.)

#### 6.6.5 Notifications `/account/notifications`
- List grouped by today / this week / older.
- Each item: icon by kind, title, body, timestamp.
- Unread items have a left dot indicator and slightly bolder title.
- Tap → marks read (`POST /notifications/{id}/read`) and, when applicable, navigates to the linked entity (e.g. booking).
- Header right: "Mark all read" link → `POST /notifications/read-all`.

---

### 6.7 Errors

- 404: friendly illustration, "We couldn't find that page", CTA back home.
- 500: same shape, with "Try again" reload button.
- Offline: when fetch fails with network error, toast "You're offline" — buttons disabled until connection restored. (`navigator.onLine` only.)

---

## 7. Components Inventory (must build)

- `Button` (variants: primary, secondary, ghost, destructive; sizes: md, lg).
- `IconButton`.
- `TextField`, `PasswordField`, `PhoneField`, `Textarea`, `Select`, `Checkbox`, `RadioCard`, `Chip`, `ChipToggle`, `DateStrip`, `TimeChip`.
- `Card`, `Surface`.
- `Modal`, `BottomSheet`, `Toast`.
- `Tabs`, `Stepper`, `Skeleton`.
- `BookingSummaryCard`, `ServiceRow`, `BarberCard`, `SaloonCard`, `SaloonHeader`, `SlotGrid`, `EmptyState`, `ErrorState`, `LoadingSkeletons`.
- `TopBar`, `BottomNav`, `Footer`, `AuthShell`.

Each must have keyboard focus state, disabled state, loading state where applicable.

---

## 8. API Coverage Map (every backend route → where used)

| Backend route | Used in screen |
|---|---|
| POST `/auth/register/customer` | `/auth/register` |
| POST `/auth/login` | `/auth/login`, login modal in booking flow |
| POST `/auth/refresh` | global API client |
| POST `/auth/logout` | account menu |
| GET `/auth/me` | global session bootstrap |
| POST `/auth/forgot-password` | `/auth/forgot` |
| POST `/auth/reset-password` | `/auth/reset` |
| POST `/auth/change-password` | profile change-password modal |
| GET `/users/me` | `/account/profile` (load) |
| PATCH `/users/me` | `/account/profile` (save) |
| GET `/saloons` | `/`, `/saloons` |
| GET `/saloons/{id}` | `/saloons/[slug]` |
| GET `/saloons/{id}/barbers` | saloon detail (Barbers tab) and booking step 2 |
| GET `/saloons/{id}/services` | saloon detail (Services tab) and booking step 1 |
| GET `/barbers/{id}` | barber modal in saloon detail |
| GET `/slots/specific` | booking step 3 (specific barber) |
| GET `/slots/any` | booking step 3 (any barber) |
| POST `/bookings` | booking step 4 |
| GET `/bookings/me` | `/account/bookings` |
| GET `/bookings/{id}` | `/account/bookings/[id]` |
| PATCH `/bookings/{id}/cancel` | booking detail cancel action |
| GET `/notifications` | `/account/notifications`, bell badge |
| POST `/notifications/{id}/read` | notifications list item |
| POST `/notifications/read-all` | notifications list header |

Routes NOT used by customer frontend (intentionally): every owner/barber/super-admin route.

---

## 9. Functionality Coverage Check

For every backend feature delivered in Phase 1, customer can:
- Discover saloons (search, filter, sort, pagination) ✓
- See saloon details, photos, barbers, services, hours ✓
- Sign up / sign in / reset password / change password / edit profile ✓
- Pick services (multi), pick barber (specific or any), pick date, pick slot ✓
- Submit booking and handle race conflict ✓
- View own bookings (upcoming + past), see details, cancel within rules ✓
- Receive in-app notifications and read them ✓

For every customer interaction, a backend route exists and is documented in §8.

---

## 10. Definition of Done — Customer Frontend Phase 1

- All routes in §4 implemented with full content from §6.
- All components in §7 in a Storybook (or visual review page).
- Every API call goes through the central client; no direct `fetch` elsewhere.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
- Keyboard-only walkthrough of the booking flow succeeds end to end.
- All states (loading / empty / error) implemented and visually reviewed for every list and form.
- Booking flow draft persists across reload (sessionStorage) and survives login interception.
- Visual review on three viewports: 360, 768, 1280.
- README has: env vars, dev run, prod build, deploy, how the API base URL is configured, how to set the API origin per environment.
