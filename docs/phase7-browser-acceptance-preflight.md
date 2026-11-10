# Browser/Sandbox acceptance preflight —2026-11-04

Owner requested continuation, confirmed Sandbox configuration ready, and provided
the running existing ngrok origin https://strep-reenact-rocket.ngrok-free.dev
targeting http://localhost:5000. Account email/version information is intentionally
not repeated. No secret was supplied, read or used.

Read-only preflight results:

- Docker engine reachable after an allowed socket-access check. Fresh Phase7
  DB/REST pair and retained Phase4 stacks observed stopped; nothing started.
- Initial tunnel service was unavailable. After owner supplied its online status,
  allowed local metadata request confirmed one exact HTTPS origin/target match.
- In-app browser controls available; no payment/app page opened and no screenshots
  or browser settings changed. Browser tool exploration was completed explicitly.
- Old Phase5 browser launcher targets retained stack-c and the former hook/API
  interface, so it was inspected but not run.

The [concrete proposed guarded test setup](superpowers/specs/2026-11-04-payhere-browser-acceptance-design.md)
separates local browser simulation from real Sandbox/fixture acceptance. It
requires design review before implementing the new adapter/runner. No credentials,
fixtures, database/schema, Docker resources, tunnel, dependency, Git or deployed
application state changed. Actual browser/Sandbox tests are not yet passed.

## 2026-11-09 browser and runner results

- Local browser simulation confirmed that a configuration failure disabled payment and retry recovered. When the fee changed from LKR 750 to LKR 800, the first click showed the new fee and the second opened checkout at LKR 800.
- A simulated completion left the listing awaiting server confirmation. After the fixture reported Paid, My Properties showed confirmation. The SDK error displayed generic feedback. Invoking the SDK's current completion slot after unmount made zero advisory requests.
- The fixture used an in-memory API and an inert SDK. Browser cancellation, the missing-SDK state and direct invocation of a callback captured before unmount were outside this browser run. The fixture tab and listener were closed afterward.
- All nine focused guard tests passed. The Sandbox launcher exited at the tunnel check before credential selection or Docker startup. The host-side request to the existing ngrok metadata endpoint on `127.0.0.1:4040` also returned connection refused.
- Actual PayHere Sandbox checkout, signed callback settlement and post-run database restoration remain pending. The next prerequisite is the existing approved ngrok tunnel forwarding to `http://localhost:5000`.

## 2026-11-09 retry after ngrok came online

The runner verified the tunnel metadata, started the isolated pair and seeded
four unpaid fixtures. The local callback health route returned HTTP 200. The
public HTTPS route closed the connection in both the browser and the host
probe. No checkout was initiated. All four fixtures had zero orders,
transactions, receipt rows and callbacks.

The runner restored all 19 application tables and the catalog. Its final
Docker cleanup check reported an error and retained the run lock. A separate
read-only check verified both stopped container identities and matched the
recorded retained container, volume and network baseline. The run's full
before-and-after Docker comparison was not confirmed.

## 2026-11-09 retry with a reachable callback

The previous lock was archived after the restore receipt, stopped container
identities and recorded retained resource baseline were verified. The new
run's public health route returned HTTP 200 through ngrok. The Visa fixture
created an unpaid order for LKR 500.00 and opened the official Sandbox frame.
PayHere showed “Unauthorized payment request” before card entry. No settlement
callback was observed. Mastercard, cancellation and decline remain pending.

The runner exited successfully after restoring all 19 application tables and
the catalog. The receipt confirmed both isolated containers stopped, and the
active lock was cleared.

## Sandbox acceptance on the registered localhost domain

The owner confirmed the localhost integration was active. The browser fixture
used localhost and the public ngrok callback health check passed. Visa and
Mastercard each received a signed status 2 callback with HTTP 200. Each
produced one paid order, one transaction and one receipt outbox row. Both
listings remained pending moderation. Cancellation left the order unpaid.
The insufficient-funds case showed Payment Declined, received a signed status
-2 callback with HTTP 200 and stayed unpaid. Neither unpaid case created a
transaction or receipt row. The runner restored all 19 tables and the catalog
and exited successfully after stopping both test containers.
