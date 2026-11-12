# Hosted Seller approval adoption

The owner confirmed `to_regprocedure('public.resolve_seller_role_request(uuid,text)')` returns NULL. A fresh service-role OpenAPI metadata read also returned HTTP 200 with the RPC absent. No owner request was resolved during these probes.

Use `phase7-role-request-transaction.hosted-review.sql`, not the isolated candidate. Select the intended Thirasara Supabase project before running the entire script in SQL Editor as postgres. The script creates the function and grants only service_role execution, but does not approve a Buyer. It refuses an existing function, unexpected identifiers, tables without RLS/backend access, or client write grants. If a guard fails, stop and inspect; do not remove it.

The function body matches the isolated candidate. It locks the request and eligible Buyer, updates role and request within one database transaction, and rolls both back on any exception. No sequential fallback is enabled in the backend. Function permissions follow https://supabase.com/docs/guides/database/functions.

Verification result must show the function signature, anon_execute=false, authenticated_execute=false, service_execute=true. Then restart the Node backend and perform the pending request approval once; verify Admin removal and Buyer role after reload. Test rejection on a separate disposable request. Repeated resolved requests must be rejected; failures must not change either row.

Local runtime validation of this newly packaged hosted script remains unavailable because Docker engine is not running. Static review checked atomicity, identifiers, ACL and exact function-body parity; this does not prove hosted schema/trigger compatibility or concurrent execution. Hosted application and manual acceptance remain owner steps.
