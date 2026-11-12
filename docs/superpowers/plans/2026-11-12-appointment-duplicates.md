# Appointment duplicate prevention implementation plan

> Execution: subagent-driven-development for the SQL task and independent review; primary agent owns application integration.

**Goal:** Enforce the approved buyer/property/date/time identity under concurrent requests while preserving other bookings.

**Architecture:** Structured date/window fields and named partial unique indexes; repository precheck plus precise unique-conflict mapping to owned public errors. Owner applies hosted SQL before backend adoption. Keep this dirty active testing workspace intact; no commits/pushes or hosted writes.

**Stack:** Node 24, Supabase PostgREST, PostgreSQL, React/Vitest/Jest.

## Tasks

- [ ] SQL: create docs/database/phase7-appointment-duplicates.hosted-review.sql and a metadata-only preflight. Validate table/ACL identity, parse only known historical slots, refuse duplicates/unparseable rows without deletion, add booking_date/booking_time_window and named unique indexes. Preserve lead_source display and support 2000-character notes by widening its current varchar(100) storage to text. Names: leads_buyer_property_slot_uidx and leads_buyer_consultation_slot_uidx. Validate with disposable PostgreSQL including concurrent inserts, cancellation/rebooking and preflight refusal; never apply hosted SQL.
- [ ] Backend TDD: add appointmentDuplicates.test.js exercising the real repository with a stateful DB seam. Assert notes/format/contact-independent duplicates, property/date/window/buyer differences, cross-agent property duplicates, consultation scope, trusted owner, guest compatibility and precise SQL conflict mapping. Add exact date and supported time-window validation for signed-in bookings. Keep guest compatibility. Run failing tests before implementation, then focused suites and full backend regression.
- [ ] Frontend: guard synchronous repeated submit with a ref; preserve form/error message on HTTP 409. Test a held pending request and a returned duplicate response with real rendered modal. Run focused frontend tests, lint and production build.
- [ ] Integrate/review: independent scoped review of SQL and app changes; correct findings. Record evidence and owner rollout instructions, including existing duplicate resolution and the distinction between local validation and live adoption. Do not restart dependent backend until owner SQL succeeds.

## Public behavior

Property duplicates: HTTP 409, "You already have an appointment for this property and time slot." Consultation duplicates: HTTP 409, "You already have a consultation with this agent for this time slot." Cancellation allows rebooking. No automatic duplicate deletion or historical email ownership. Agent scheduling capacity is outside scope.
