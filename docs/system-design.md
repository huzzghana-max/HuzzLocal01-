# System Design (Mermaid)

## High-Level Architecture

```mermaid
flowchart LR
  subgraph Client
    UI[React + Vite + MUI]
  end

  subgraph Backend
    API[Express API]
    MAIL[Nodemailer SMTP]
    PAY[Paystack / Stripe]
  end

  subgraph Data
    DB[(MySQL)]
  end

  UI -- REST/JSON --> API
  API -- SQL --> DB
  API -- Email --> MAIL
  API -- Payments --> PAY
```

## Core Data Flows

### Guest Service Booking (Email Verification)

```mermaid
sequenceDiagram
  participant U as Guest User
  participant FE as Frontend
  participant BE as API
  participant DB as MySQL
  participant EM as SMTP

  U->>FE: Enter email & request code
  FE->>BE: POST /api/service-bookings/verify-email
  BE->>DB: Insert verification code (expires in 10 min)
  BE->>EM: Send code via email
  EM-->>U: Verification code

  U->>FE: Enter code + booking details
  FE->>BE: POST /api/service-bookings
  BE->>DB: Validate code + create booking
  BE-->>FE: Booking confirmed
```

### Public Event Registration

```mermaid
sequenceDiagram
  participant U as Guest User
  participant FE as Frontend
  participant BE as API
  participant DB as MySQL
  participant EM as SMTP

  U->>FE: Enter name/email
  FE->>BE: POST /api/events/:id/attend
  BE->>DB: Create event_attendee
  BE->>EM: Send confirmation + QR
  BE-->>FE: Registered
```

### Ticket Purchase (Authenticated)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as API
  participant DB as MySQL
  participant PAY as Paystack

  U->>FE: Select ticket
  FE->>PAY: Paystack checkout
  PAY-->>FE: Payment reference
  FE->>BE: POST /api/events/:id/purchase
  BE->>DB: Create ticket_sale + QR
  BE-->>FE: Purchase confirmed
```

## Key Components

- **Frontend**: React + Vite + MUI
- **Backend**: Express API with JWT auth
- **DB**: MySQL for events, services, bookings, tickets, messaging
- **Email**: SMTP via Nodemailer
- **Payments**: Paystack (primary), optional Stripe

## Core Tables (summary)

- `users`
- `events`
- `services`
- `service_bookings`
- `guest_booking_verifications`
- `tickets`
- `ticket_sales`
- `event_attendees`
- `messages`
- `payout_requests`
- `vendor_availability_blocks`

---

If you'd like, I can expand this into a full architecture document with deployment topology and scaling plans.
