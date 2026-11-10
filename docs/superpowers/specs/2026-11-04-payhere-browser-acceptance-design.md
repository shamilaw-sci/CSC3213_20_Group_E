# Guarded Phase7 PayHere browser acceptance

Status: concrete test-setup design prepared for owner review2026-11-04.
No fixture, Docker, tunnel, credential, schema or application mutation performed.

## Authorization and observed preflight

Owner requested continuation after PayHere/browser acceptance was explained,
confirmed Sandbox configuration is ready and supplied the existing public origin
https://strep-reenact-rocket.ngrok-free.dev forwarding to http://localhost:5000.
No merchant secret or password was supplied in chat or read by this preflight.

Read-only Docker check confirmed the engine is reachable and the fresh Phase7
DB/REST pair is stopped. Retained Phase4 stacks remain stopped. Initial local
tunnel metadata was unavailable; after owner supplied running ngrok status, an
allowed read-only request verified exactly one HTTPS tunnel with the exact origin
and localhost:5000 target above. Browser inventory confirmed in-app browser access;
no page/payment was opened. Default sandbox socket restrictions required allowed
read-only Docker/tunnel checks. No desktop/browser setting changed.

The old Phase5 launcher is unsuitable unchanged: it selects retained stack-c,
reads the previous credential source, uses the former one-argument triggerPayment
interface and does not forward new request cancellation options in its API shim.
It must not be used to claim current Phase7 acceptance.

## Options

Recommended: two explicit stages using production payment hook/validators and
scoped test-boundary adapters. First verify deterministic browser behavior with
an inert SDK and in-memory API; then test actual PayHere Sandbox callbacks against
the existing fresh Phase7 database. Keep the two results distinguishable.

Running the old launcher risks an obsolete schema/interface and misleading
coverage. Pointing the normal app at a hosted DB would expand data/config scope
and is not proposed. No dependency, browser extension or toolchain install.

## Stage A — local browser, no provider or database

Create a test-only Vite entry with env loading disabled and an empty public
directory. Import actual usePayhere, paymentUiBoundary and relevant Review/form/
MyProperties modules, replacing only external API/auth/layout boundaries with
explicit fixture adapters. Do not load main.jsx/index.html or any OAuth/provider
script, real environment, real profile token, Storage/mail service or geodata API.

Bind a fresh loopback listener, fail on occupied ports and use a browser origin
separate from the normal development app. An inert mock PayHere popup is clearly
labelled simulated. Render safe fixture request counters/outcomes for observation;
no hidden browser-state mutation or arbitrary DevTools evaluation is required.
All browser API traffic stays on the test origin; a restrictive test-only CSP
blocks remote scripts/connections. No DB/Docker/tunnel changes in this stage.

Exercise visible UI loading/error/retry, valid fees/modes, changed-fee second-click,
one draft on retry, duplicate clicks, missing SDK, fixed SDK error feedback,
completed-versus-Paid state and navigation/unmount behavior. Test controls may
select fixture failure modes; they are not product UI and are never bundled in
normal app entry points. Record real-browser observations/screenshots separately
from the existing401 frontend tests. This stage is not actual PayHere acceptance.

## Stage B — actual Sandbox with fresh fixture DB

Adapt the browser runner to reuse integration/phase7/environment.cjs, state.cjs,
catalog.cjs and the existing readiness/provenance/retained-resource guards. Start
only the existing fresh Phase7 DB/REST pair after full stopped identity/image/
nonce/volume/network/127.0.0.1 binding checks. Do not provision anything, apply
SQL/DDL, change a role/credential, update images or touch retained stacks.
Verify exact ready/target/catalog/ledger/provenance before fixture writes.

Snapshot all19 application tables/catalog/ledger and retained resource states.
Require the expected empty fresh target. Seed only UUID/run-tagged disposable
SELLER/AGENT users and unpaid properties for Visa, Mastercard, cancel and decline.
Use synthetic identities/contact data, no real customer/account records. Exercise
the actual Node payment routes, current credential-bound fixture sessions and
locked checkout RPCs; no production data paths or alternate settlement logic.

For this explicitly scoped Sandbox test, select only PAYHERE_MERCHANT_ID and
PAYHERE_MERCHANT_SECRET from the existing backend/.env test credential source
in memory. Owner's review must confirm these are the existing Sandbox credentials.
Never print, screenshot, persist or send the secret; use it only in server-side
hash/signature computation. Never inherit hosted DATABASE_URL/Supabase/SMTP/OAuth
or other environment values. The child process receives a clean allowlisted
environment with fresh DB credentials/test JWT and PAYHERE_MODE=sandbox forced.
Real DB/password rotation and all environment-file edits remain excluded.

Node outbound sockets/fetch remain restricted to the exact fresh loopback DB/REST
and private application listeners; disable SMTP, receipt delivery workers and
unrelated providers. Receipt boundary calls may be counted for scoped order UUIDs
only. Actual browser traffic may load the official PayHere SDK and Sandbox frames
for this test; no live-payment origin or real card/customer data is permitted.
Use the same SDK script URL as the product, recording its unversioned-path/browser
compatibility as observed rather than assuming the guide's versioned path matches.

The frontend stays loopback-only with empty env/public roots. Its fixture API shim
forwards timeout/AbortSignal options, sends only disposable scoped sessions to the
private loopback API, and refuses non-Sandbox/unknown-merchant order terms. No
service-role key or merchant secret reaches the browser. New expected-fee/quote
and config/busy interfaces must be used; do not weaken production validation.

Reuse the owner's existing ngrok session without changing account/domain/target,
starting a new tunnel or exposing the app. Only a narrowly guarded callback bridge
binds127.0.0.1:5000. Accept GET on one random per-run health path and POST on one
random per-run callback path; reject everything else, including auth, settings,
general API, source files and health details. Callback allowlist requires known
fixture order/merchant, form encoding and bounded body; the actual application
signature/settlement code still validates it. Verify the public health sentinel
and tunnel target before any Sandbox payment initiation.

Use only official published Sandbox cards with clearly fictional names/expiry/CVV
for Visa/Mastercard success and a published decline case. Verify Sandbox mode/
frame origin before input. Stop for unexpected live mode, credential/real-card
requests, bank OTP, CAPTCHA, new permissions, binding terms or security warnings;
follow the applicable handoff/confirmation rules rather than bypassing them.

## Observation and preservation gates

For successful cases require actual Sandbox callback receipt plus observed DB
Paid/pending-review state, one settled order/transaction/outbox per fixture, and
matching UI status. Client completion alone is insufficient. Cancellation/decline
must not produce Paid or a successful transaction/receipt. Check scoped duplicate
notification handling and exact amounts/merchant/order identity without forcing
arbitrary provider callbacks. Record no real payment completion claim.

Private evidence may retain scoped IDs, safe statuses/receipts and screenshots;
do not stage docs/evidence or log secrets/card fields/raw callback/request bodies.
Screenshot only appropriate non-sensitive test results. A browser screenshot is
not a substitute for callback/database preservation evidence.

On stop/failure/timeout: close only this run's listeners/browser tabs, stop workers,
remove only exact run-owned fixtures by UUID/owner/nonce predicates, and compare
all19 snapshots/catalog/ledger/provenance plus retained resources. Stop only the
fresh DB/REST pair if this runner started them, restoring their initial stopped
state. Keep all volumes/networks/images and the user-owned ngrok session. If exact
cleanup/preservation fails, retain private recovery evidence and report it rather
than deleting broadly or falsely claiming restored state. Bound overall session.

## Implementation and verification scope

New test-only files should live under integration/phase7/ (guard helpers, browser
runner and fixture entry/adapters), with corresponding guard/lifecycle regression
tests. Do not modify production hook/payment semantics to make acceptance pass.
Use red tests for wrong stack/origin/ports/path/order/merchant, secret/env leakage,
forbidden network/mail, stale sessions, startup interruption, callback tracking,
exact cleanup and new price/config contract. Independent bounded read-only review
before external Sandbox execution. Heavy checks sequential with existing limits.

Official [Sandbox guidance](https://support.payhere.lk/sandbox-and-testing) states
Sandbox payments are simulated; its published test cards are the only card inputs
proposed here. [SDK guidance](https://support.payhere.lk/api-%26-mobile-sdk/javascript-sdk)
requires backend notification verification. No real funds, real user contact,
Live PayHere account, credential changes, hosted DB/Storage access, dependency/
toolchain update, Git stage/commit/push or deployment is included. Existing unit
counts/backend1320/frontend401 remain baseline, not completed browser acceptance.
