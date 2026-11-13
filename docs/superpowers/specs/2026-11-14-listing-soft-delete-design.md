# Listing soft deletion

Approved direction is soft deletion with retained payment/transaction/chat history.

## Behavior

Owner/Admin Delete stamps properties.deleted_at. Ordinary lists, metrics, search, map, favorites and property detail exclude archived rows. A repeated owner deletion remains successful. Existing conversations, bookings and financial records retain their references and metadata. Media stays attached for history. There is no restore UI in this change.

## Integrity

New checkout, favorite, conversation and property-linked booking creation require an active property. Database checks serialize with archival using the property row lock. Already verified payment completion may settle a checkout started earlier, including after archival, without clearing deleted_at. Archived properties cannot be edited or moderated back into active views.

## Rollout

Add nullable timestamptz deleted_at and active-listing indexes. Keep existing rows active. Add restrictive Data API visibility for archived properties, guard new property-linked inserts and adjust checkout/view/search RPCs. Owner applies reviewed SQL before restarting updated Node/Go services. Existing SQL functions keep their execute ACLs. Validate on disposable local PostgreSQL if available and record any unavailable runtime checks.

## Cache

Go map cached results recheck active/approved IDs before returning, preventing a previously cached marker from surviving a fresh query after deletion. Existing browser content updates on refresh.
