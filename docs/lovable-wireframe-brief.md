# HUZZ UI Wireframe Brief for Lovable

## Product Summary

HUZZ is a modern event operations and vendor marketplace app. It serves four audiences:

- Guests: discover events, register, buy tickets, and book providers without needing an account.
- Organizers: create events, manage tickets and registrants, book vendors, message providers, and view analytics.
- Providers: manage service listings, availability, bookings, payouts, analytics, and messages.
- Admins: manage users, events, service approvals, payout requests, support tickets, ticket sales, and reports.

The UI should feel like a polished SaaS operations platform: clear, premium, trustworthy, fast to scan, and useful for repeat workflows. Avoid a marketing-only landing page. The app should immediately show real product actions: find events, browse vendors, create an event, and manage dashboards.

## Visual Direction

Style: modern event-tech dashboard, clean SaaS marketplace, elegant but practical.

Tone:
- Professional, energetic, reliable.
- High trust for payments, ticketing, and event coordination.
- Premium enough for corporate events, simple enough for community events.

Recommended palette:
- Primary: deep teal or blue-green.
- Accent: warm gold or coral for key CTAs and status highlights.
- Background: near-white/light gray for main app, dark option supported.
- Text: strong charcoal, soft muted secondary text.
- Status colors: green confirmed, amber pending, red rejected/cancelled, blue published.

Typography:
- Use a clean modern sans-serif.
- Strong page titles.
- Compact table text and dashboard labels.
- Avoid huge hero text inside operational screens.

Component style:
- 8px radius for cards, tables, inputs, and dialogs.
- Use icon buttons for actions like edit, delete, share, copy, message, filter, download.
- Use chips for statuses, roles, event types, payment states, and ticket availability.
- Use tables for admin and dashboard management screens.
- Use cards only for repeated items like vendors, events, reports, and stat blocks.

## Global Navigation

Desktop public nav:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HUZZ    About  Portfolio  Services  Events        Sign In  Sign Up  │
└──────────────────────────────────────────────────────────────────────┘
```

Logged-in nav:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HUZZ    About  Portfolio  Services  Events       Avatar ▾  Contact  │
└──────────────────────────────────────────────────────────────────────┘
```

Avatar menu:
- Dashboard
- Settings
- Support
- Logout

Mobile nav:
- Top bar with HUZZ logo, menu icon, avatar if logged in.
- Drawer with public links, dashboard link, settings, support, auth buttons.

Dashboard layout:

```text
┌───────────────┬──────────────────────────────────────────────────────┐
│ Sidebar       │ Header: page title, user, primary action             │
│               ├──────────────────────────────────────────────────────┤
│ Dashboard     │ Stat cards                                           │
│ Messages      │ Main table/list/content                              │
│ Reports       │ Context panels / recent activity                     │
│ Settings      │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

Sidebar should collapse into a bottom sheet or hamburger drawer on mobile.

## Public Home

Goal: explain HUZZ quickly and route users to the two main marketplace actions.

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Hero image: premium event scene                                      │
│                                                                      │
│ HUZZ                                                                 │
│ Plan, book, and run events from one control center.                  │
│ [Browse Vendors] [Find Events] [Create Event]                        │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Create      │ Book        │ Ticket      │ Coordinate  │
│ events      │ providers   │ guests      │ messages    │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Featured events / provider categories                                │
└──────────────────────────────────────────────────────────────────────┘
```

Key sections:
- Full-width visual hero using a real event image.
- Three primary CTAs: Browse Vendors, Find Events, Create Event.
- Four capability cards: Planning, Verified Providers, Ticketing, Messaging.
- Featured events preview.
- Top provider categories preview.
- Footer with About, Services, Contact, Support.

## Authentication

Sign In:

```text
┌────────────────────────────┬────────────────────────────┐
│ Event operations image     │ Sign in                     │
│                            │ Email                       │
│                            │ Password                    │
│                            │ [Sign In]                   │
│                            │ Create account              │
└────────────────────────────┴────────────────────────────┘
```

Sign Up:
- Name
- Email
- Password
- Role selector: Organizer / Provider
- Optional provider onboarding hint: "You can add services after signup."
- Primary CTA: Create Account

## Events Nearby

Goal: let guests discover public events and register or buy tickets.

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Events Near You                                   [Use my location]  │
│ Search events...  Date filter  Location filter  Sort by distance     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Event card   │ Event card   │ Event card   │
│ Image        │ Image        │ Image        │
│ Date         │ Date         │ Date         │
│ Location     │ Location     │ Location     │
│ [Details]    │ [Attend]     │ [Attend]     │
└──────────────┴──────────────┴──────────────┘
```

Event card:
- Image
- Event name
- Date/time
- Location
- Distance if geolocation available
- Ticket price range or "Free registration"
- Buttons: View Details, Attend

Attend modal:
- Name, email, phone
- Ticket selector if tickets exist
- Quantity stepper
- Total amount
- Submit registration or proceed to payment

## Event Detail / Public Event Page

Goal: one strong page for sharing, registering, and ticket purchase.

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Large event image                                                    │
│ Event name                         [Share] [Copy public link]        │
│ Date chip  Location chip  Status chip                               │
└──────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────────────┐
│ About this event              │ Register / Tickets                   │
│ Description                   │ Name, email, phone                   │
│ Map preview                   │ Ticket cards + quantity              │
│ Directions link               │ [Register] [Buy Ticket]              │
└───────────────────────────────┴──────────────────────────────────────┘
```

After registration:
- Show confirmation state.
- Show QR code if available.
- Show transaction/ticket reference.

## Browse Vendors

Goal: marketplace discovery and service booking.

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Find trusted event providers                                         │
│ Search...  Category ▾  Sort ▾             [Grid] [List]              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Vendor card  │ Vendor card  │ Vendor card  │
│ Image        │ Image        │ Image        │
│ Service      │ Service      │ Service      │
│ Rating       │ Rating       │ Rating       │
│ Price        │ Price        │ Price        │
│ [Details]    │ [Book]       │ [Book]       │
└──────────────┴──────────────┴──────────────┘
```

Vendor card:
- Provider image or service image
- Business/provider name
- Category
- Rating and review count
- Location
- Price
- Availability badge
- Buttons: View Details, Book

Vendor detail modal/page:
- Larger image
- About, services, pricing, contact
- Ratings/reviews
- Availability summary
- Book service CTA

Guest booking modal:
- Guest name
- Email
- Phone
- Booking date
- Notes
- Email verification code flow
- Submit booking

## Organizer Dashboard

Sidebar:
- Dashboard
- Registrants & Tickets
- Messages
- Analytics
- Providers
- Support
- Settings

Dashboard wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Organizer Dashboard                              [+ Create Event]    │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Total Events │ Vendors      │ Registrants  │ Ticket Sales │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────────────────────────────┬───────────────────────────────┐
│ My Events table                      │ Recent bookings               │
│ Name Date Status Vendors Actions     │ Provider Status Date Actions  │
└──────────────────────────────────────┴───────────────────────────────┘
```

Primary actions:
- Create event
- Edit event
- Delete event
- Share public event link
- Manage registrants/tickets
- Review completed provider booking

My Events table columns:
- Event
- Date
- Location
- Status
- Vendors
- Ticket/registrant shortcut
- Actions

Booking table columns:
- Provider/service
- Booking date
- Status
- Amount
- Actions: view, message, review

## Create Event

Goal: simple event creation with ticket setup.

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Create Event                                                         │
├───────────────────────────────┬──────────────────────────────────────┤
│ Event Details                 │ Preview                              │
│ Name                          │ Image preview                        │
│ Type                          │ Name/date/location preview           │
│ Date/time                     │                                      │
│ Location + map coords         │                                      │
│ Description                   │                                      │
│ Image upload                  │                                      │
├───────────────────────────────┴──────────────────────────────────────┤
│ Tickets: ticket type, price, quantity, add/remove                    │
│ [Save Draft] [Publish Event]                                         │
└──────────────────────────────────────────────────────────────────────┘
```

## Registrants & Tickets

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Registrants & Tickets                         Event selector ▾       │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Registrants  │ Tickets Sold │ Revenue      │ Check-ins    │
└──────────────┴──────────────┴──────────────┴──────────────┘

Tabs: Registrants | Ticket Sales | Ticket Types

┌──────────────────────────────────────────────────────────────────────┐
│ Search table...                                  [Export CSV]        │
│ Name Email Phone Ticket Status QR Actions                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Provider Dashboard

Sidebar:
- Dashboard
- Messages
- Reports
- Portfolio / Services
- Availability Calendar
- Analytics
- Support
- Settings

Dashboard wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Provider Dashboard                             [Request Payout]      │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Pending      │ Confirmed    │ Completed    │ Available $  │
└──────────────┴──────────────┴──────────────┴──────────────┘

Tabs: New Requests | Confirmed | Completed | Payouts

┌──────────────────────────────────────────────────────────────────────┐
│ Booking table: Service, organizer/guest, date, status, amount, action│
└──────────────────────────────────────────────────────────────────────┘
```

Booking detail modal:
- Organizer/guest info
- Booking notes
- Service title
- Date
- Amount
- Actions: Accept, Reject, Mark Complete, Message

Payout panel:
- Earned
- Requested
- Available
- Request amount
- Request history table

## Vendor Services / Portfolio

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ My Services                                      [+ Add Service]     │
├──────────────┬──────────────┬──────────────┐
│ Service card │ Service card │ Service card │
│ Image        │ Category     │ Price        │
│ Status chip  │ Edit/Delete  │ Approval     │
└──────────────┴──────────────┴──────────────┘
```

Add/edit service form:
- Title
- Category
- Description
- Price
- Location
- Image upload
- Availability notes
- Submit for approval

## Vendor Availability Calendar

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Availability Calendar                         [+ Block Date]         │
├──────────────────────────────────────┬───────────────────────────────┤
│ Month calendar                       │ Selected date                 │
│ Blocked dates highlighted            │ Existing blocks               │
│ Booking dates highlighted            │ Add reason / remove block     │
└──────────────────────────────────────┴───────────────────────────────┘
```

## Messaging

Wireframe:

```text
┌──────────────────────┬───────────────────────────────────────────────┐
│ Conversations        │ Chat header                                   │
│ Search people        │ Messages                                      │
│ User row             │                                               │
│ User row             │ Composer: message input + send button         │
└──────────────────────┴───────────────────────────────────────────────┘
```

Mobile:
- Conversation list first.
- Selecting a conversation opens full-screen chat.

## Support

Support home:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Support Center                                                       │
│ Search help...                                                       │
├──────────────┬──────────────┬──────────────┐
│ FAQ card     │ Contact card │ My Tickets   │
└──────────────┴──────────────┴──────────────┘
```

Ticket list:
- Status filters: Open, Pending, Resolved, Closed
- Table/list of tickets
- Create ticket button

Ticket detail:
- Conversation timeline
- Status chip
- Reply composer
- Attachments if supported

## Settings

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Settings                                                             │
├──────────────────────┬───────────────────────────────────────────────┤
│ Account              │ Profile form                                  │
│ Security             │ Name, email, phone, image                     │
│ Notifications        │ Password change                               │
│ Preferences          │ Theme toggle                                  │
└──────────────────────┴───────────────────────────────────────────────┘
```

## Admin Dashboard

Sidebar:
- Dashboard
- Payments
- Messages
- Reports
- Service Approval
- Ticket Sales
- Support Tickets
- Settings

Dashboard wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                  [+ Create User]     │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Users        │ Events       │ Pending svc  │ Payout reqs  │
└──────────────┴──────────────┴──────────────┴──────────────┘

Tabs: Users | Events | Password Policy

┌──────────────────────────────────────────────────────────────────────┐
│ Search/filter controls                                               │
│ Admin table with role/status/action columns                          │
└──────────────────────────────────────────────────────────────────────┘
```

Admin user table:
- Avatar/name
- Email
- Role
- Created date
- Actions: view, edit role, delete

Admin event table:
- Event name
- Organizer
- Date
- Location
- Status
- Actions: view, edit, delete

Password policy panel:
- Min length
- Require uppercase/lowercase/number/special toggles
- Save policy

## Admin Service Approval

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Service Approval                                                     │
│ Filters: Pending Approved Rejected                                   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Service table/card list                                              │
│ Provider, service, category, price, submitted date, status, actions  │
│ [View] [Approve] [Reject]                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Admin Payout Requests

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Payout Requests                                                      │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Pending $    │ Approved $   │ Paid $       │ Rejected $   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Provider Amount Status Requested Date Note Actions                   │
│ [Approve] [Reject] [Mark Paid]                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Admin Ticket Sales / Reports

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Ticket Sales                                                         │
│ Date range  Event filter  Status filter             [Export]         │
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Gross sales  │ Tickets sold │ Attendees    │ Refunds/voids│
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Sales table                                                          │
│ Event Buyer Ticket Qty Amount Payment Ref Date QR                    │
└──────────────────────────────────────────────────────────────────────┘
```

Reports pages:
- Date range picker
- KPI cards
- Revenue chart
- Bookings/tickets chart
- Export PDF/CSV buttons
- Recent activity table

## Admin Support Tickets

Wireframe:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Support Tickets                                                      │
│ Search... Category Status Priority Assignee                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Ticket table: ID, subject, requester, category, status, last update  │
└──────────────────────────────────────────────────────────────────────┘
```

Ticket detail:
- Requester profile
- Subject and category
- Status/priority controls
- Conversation thread
- Internal notes
- Reply box

## Analytics Screens

Organizer analytics:
- Event performance KPIs
- Registrations over time
- Ticket sales chart
- Top events
- Vendor booking status breakdown

Provider analytics:
- Booking requests over time
- Completion rate
- Earnings chart
- Top services
- Ratings summary

Admin analytics/reports:
- Platform users by role
- Events by status
- Service approvals
- Revenue/ticketing overview
- Payout overview

## Responsive Rules

Desktop:
- Public pages use max-width content and responsive card grids.
- Dashboards use sidebar plus main content.
- Tables stay visible with compact density.

Tablet:
- Sidebar can collapse to icon-only.
- Tables may become horizontally scrollable.
- Main dashboard stat cards use 2x2 grid.

Mobile:
- Public cards become single column.
- Dashboard sidebar becomes drawer.
- Tables become stacked data cards.
- Primary actions stay sticky at bottom only when useful, such as booking, ticket purchase, or save forms.

## Empty, Loading, and Error States

Every major page needs:
- Skeleton loading cards/tables.
- Empty state with a helpful action.
- Error alert with retry.
- Success snackbar/toast after create, save, register, book, pay, approve, reject.

Examples:
- No events: "No events published yet" with Browse Vendors or Create Event action.
- No providers: "No providers match your filters" with Reset Filters.
- No bookings: "No booking requests yet" with Manage Services action.
- No messages: "Select a conversation to start messaging."

## Key UI Components to Build

- AppShell
- PublicNavbar
- DashboardSidebar
- PageHeader
- StatCard
- StatusChip
- EventCard
- VendorCard
- DataTable
- FilterToolbar
- EmptyState
- ConfirmDialog
- BookingModal
- TicketPurchaseModal
- SupportTicketThread
- MessageThread
- PayoutRequestModal
- ServiceApprovalPanel
- ReportChartCard

## Lovable Build Prompt

Build a polished responsive React UI for HUZZ, an event operations and vendor marketplace platform. Use the wireframes and screen list above. Create a premium SaaS marketplace interface with public event/vendor discovery, event detail pages with ticketing and registration, role-based dashboards for organizers, providers, and admins, messaging, support tickets, settings, analytics, reports, provider services, availability calendar, admin approvals, payout requests, and ticket sales reporting.

The design should be clean, practical, and production-ready. Use real event/provider imagery, icon buttons, status chips, dense dashboard tables, clear form flows, skeleton loading states, empty states, and responsive mobile layouts. Keep dashboards operational and easy to scan. Do not make the first screen a generic marketing landing page; the home page should immediately route users to Browse Vendors, Find Events, and Create Event.
