# Studio Booking Automation (n8n + Google Workspace)

This document matches the booking page at `/booking/` and the flow you requested:

1. Client sees available slots and submits a request.
2. Google Sheet stores booking details with status.
3. Google Calendar event is created/updated/deleted based on status.
4. Client gets pending email immediately, then confirmation/cancellation email after review.

## 1) Booking page webhook configuration

In [booking.html](../booking.html), set these `data-*` values on `data-booking-app`:

- `data-availability-endpoint="https://YOUR_N8N_DOMAIN/webhook/studio-availability"`
- `data-booking-endpoint="https://YOUR_N8N_DOMAIN/webhook/studio-booking-request"`
- `data-hourly-rate="175"` (or your current hourly rate)
- `data-business-start="09:00"`
- `data-business-end="21:00"`

The browser script is in [booking.js](../assets/js/booking.js).

## 2) Required Google Sheet columns

Create a sheet (example name: `StudioBookings`) with columns:

- `booking_id`
- `submitted_at`
- `status` (dropdown: `Requested`, `Confirmed`, `Cancelled`)
- `client_name`
- `client_email`
- `client_phone`
- `company_name`
- `project_type`
- `project_notes`
- `booking_date`
- `start_time`
- `end_time`
- `start_iso`
- `end_iso`
- `duration_hours`
- `hourly_rate`
- `estimated_price`
- `currency`
- `timezone`
- `calendar_event_id`
- `last_status_email_sent`

## 3) Workflow A: availability + booking intake

Build one n8n workflow with two webhooks:

- `GET /webhook/studio-availability`
- `POST /webhook/studio-booking-request`

### A1. GET `/studio-availability`

Purpose: return blocked windows from Google Calendar so the website can show open starts.

Nodes:

1. `Webhook (GET)`
2. `Google Calendar -> Get Many Events` for your studio calendar
3. `Function` to normalize to blocked ranges
4. `Respond to Webhook`

Expected response JSON shape:

```json
{
  "timezone": "America/Vancouver",
  "hourlyRate": 175,
  "minimumHours": 2,
  "businessHours": { "start": "09:00", "end": "21:00" },
  "blocked": [
    { "start": "2026-03-02T12:00:00-08:00", "end": "2026-03-02T14:00:00-08:00" }
  ]
}
```

### A2. POST `/studio-booking-request`

Purpose: save request, create calendar event as `Requested`, send pending email.

Nodes:

1. `Webhook (POST)`
2. `Set` (create `booking_id`, sanitize fields)
3. `Google Sheets -> Append Row`
4. `Google Calendar -> Create Event`
5. `Google Sheets -> Update Row` (write returned `calendar_event_id`)
6. `Gmail/SMTP -> Send Email` (pending confirmation)
7. `Respond to Webhook`

Use event title pattern:

- `Studio Booking - Requested - [client_name]`

Write back `calendar_event_id` so later workflows can update/delete the same event.

## 4) Workflow B: status watcher (Confirmed/Cancelled)

Create a second n8n workflow that runs on a schedule (or sheet trigger if available).

Nodes:

1. `Cron` (every 5 minutes)
2. `Google Sheets -> Read Rows`
3. `IF` status changed and `last_status_email_sent` is different from current status
4. Branch by `status`

### B1. When status = Confirmed

1. `Google Calendar -> Update Event` by `calendar_event_id`
2. Update title to:
   - `Studio Booking - Confirmed - [client_name]`
3. `Gmail/SMTP -> Send Email` (confirmed booking details)
4. `Google Sheets -> Update Row` set `last_status_email_sent = Confirmed`

### B2. When status = Cancelled

1. `Google Calendar -> Delete Event` by `calendar_event_id`
2. `Gmail/SMTP -> Send Email` (cancellation notice)
3. `Google Sheets -> Update Row` set `last_status_email_sent = Cancelled`

## 5) Suggested email templates

### Pending email (sent right after request)

Subject:

- `We received your studio booking request`

Body should include:

- requested date/time
- duration and estimated price
- note that status is still `Requested`

### Confirmation email (sent on status = Confirmed)

Subject:

- `Your studio booking is confirmed`

Body should include:

- confirmed date/time
- location access details
- arrival instructions and contact number

### Cancellation email (sent on status = Cancelled)

Subject:

- `Your studio booking request was cancelled`

Body should include:

- cancelled date/time
- short reason/instructions for rebooking

## 6) Security/CORS notes

- CSP was updated in [_headers](../_headers) to allow `https://*.n8n.cloud` in `connect-src`.
- If your n8n uses a custom domain, add that exact domain to `connect-src`.
- Configure n8n webhook CORS headers to allow:
  - `Origin: https://rainscopefilmworks.com`
  - methods `GET, POST, OPTIONS`
  - headers `Content-Type, Accept`
