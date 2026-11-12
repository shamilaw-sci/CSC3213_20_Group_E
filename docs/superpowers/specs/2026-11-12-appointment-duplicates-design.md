# Buyer appointment duplicate prevention

## Requested behavior

An authenticated buyer may have only one booking for the same property, calendar date and displayed time window. Notes, contact details and meeting format do not change this identity. Another property or another date/time window is allowed. Other buyers are independent. The property-booking identity does not include the agent, so selecting a different agent does not bypass the requested property/slot rule.

For consultations without a property, use buyer + agent + date + time window. Existing guest ownership remains unchanged; this change does not identify a guest by email or claim historical bookings. Cancelling currently deletes the lead, allowing a later rebooking of the same slot.

## Approach

Recommended: structured booking fields, a backend duplicate check for clear feedback, and database unique indexes for concurrent requests. A frontend-only guard prevents some double clicks but cannot enforce cross-tab requests. A backend SELECT-before-INSERT alone also races, so neither is sufficient.

Add nullable booking_date (date) and booking_time_window (text) to leads. Keep the existing lead_source display format so current Agent and Buyer views continue to work. Validate the form's actual date and time-window values at the API boundary; do not trust a body-supplied buyer ID. New authenticated bookings require a date/time window. Cancellation behavior and agent scheduling capacity do not change.

Create separate partial unique indexes for property bookings (buyer_id, property_id, booking_date, booking_time_window) and property-less consultations (buyer_id, assigned_agent_id, booking_date, booking_time_window). Scope them to non-null authenticated identities and complete structured slots. Keep non-booking CRM leads and unbound historical/guest leads outside these rules. Do not claim to prevent overlapping differently named windows or enforce one Agent booking globally.

Translate only a conflict attributable to these named booking indexes into HTTP 409 with a fixed message: "You already have an appointment for this property and time slot." Use a consultation-specific message when no property is selected. Do not translate arbitrary unique conflicts into duplicate-booking claims. The modal already displays backend error messages; add a synchronous in-flight submit guard if its current loading state permits repeated submissions.

## Historical bookings and rollout

Prepare owner-run SQL, not a live execution. Before index creation, inspect the current schema and inventory existing account-bound booking rows. Parse only the known, unambiguous lead_source date/time format into the structured fields. Report groups that would violate uniqueness, and stop adoption until the owner chooses which records to retain. Do not delete or merge existing bookings automatically. Report unparseable account-bound booking rows for review; historical coverage must not be silently claimed.

Apply the reviewed schema before the dependent backend. Retain the account-ID ownership boundary and backend-only lead-write grants. The user applies hosted SQL. Commits and pushes remain owner-controlled.

## Verification

Backend regression cases: identical property/date/window; changed notes; changed format/contact fields; different property/date/window/buyer; same property/slot across agents; consultation identity; cancellation and rebooking; arbitrary unique errors; trusted owner identity; guest compatibility. Exercise two concurrent identical inserts against disposable PostgreSQL and verify exactly one persists with a clear conflict for the other. Verify real HTTP conflict mapping and frontend feedback. Test historical preflight with duplicates and unparseable rows and confirm it refuses without data deletion. Browser acceptance remains user-operated after owner SQL adoption.

## Decision pending

Approve this interpretation and database design before implementation. In particular: property bookings are unique across agents; property-less consultations are unique per agent; existing duplicates require owner review instead of automatic deletion.
