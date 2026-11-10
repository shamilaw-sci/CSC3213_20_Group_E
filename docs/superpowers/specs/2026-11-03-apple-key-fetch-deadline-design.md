# Apple signing-key request boundary — proposed

Status: owner approved by continuing the preceding proposal; implemented2026-11-03. Mocked transport/real SDK and full backend verification complete. No real provider/token/DB/config/dependency change or service startup.

## Evidence and scope

Installed apple-signin-auth uses native fetch for https://appleid.apple.com/auth/keys without an AbortSignal. A fixture invoked the real SDK key getter using its supported _setFetch hook and observed the fixed endpoint with hasAbortSignal=false. First mock omitted the SDK's text() response method; corrected the fixture response contract and confirmed the result without network access. This establishes absence of an explicit request deadline, not that every network operation can hang forever.

Current backend audience/issuer/expiry/email/subject checks remain. Source also shows no nonce in frontend Apple initialization/request or backend verify options. [Apple's authentication guidance](https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple) describes associating client sessions using nonce; search excerpts were available, but full-page markdown fetch was tool-unsupported. No replay exploit or stolen real token was used. Key-fetch bounding does not close replay.

## Options

1. Recommended: install an Apple-SDK-only transport hook once, with a real five-second abort deadline, restricted signing-key URL/method and redirects refused. Preserve existing key parsing/cache and token verification.
2. Replace the SDK with a new verifier/JWKS implementation. More dependency/crypto/cache behavior change than this deadline fix requires.
3. Race verification against a timer. Rejected: it can stop waiting while the underlying network request continues; it does not establish cancellation.

## Proposed implementation

Use the installed SDK's documented _setFetch hook in a small dedicated Apple verifier module. Initialize once, not per request; never replace globalThis.fetch. The hook applies only to this SDK instance/module and restricts requests to exact HTTPS appleid.apple.com/auth/keys with GET, no URL credentials/query/fragment and redirect:error. Reject unsupported transport use rather than allowing future authorization/revoke calls silently through a signing-key-only wrapper. The repository currently calls only verifyIdToken; future SDK features need their own reviewed transport policy.

Provide an AbortSignal deadline of5000ms to the underlying native fetch, retaining any earlier caller cancellation. Use a request-scoped AbortController/timer with explicit disposal after response-body consumption, so stalled body reads remain bounded and timers/listeners do not leak. Preserve the Response contract needed by the SDK (its text() JSON parsing), successful key/cache behavior, audience/expiry verification, session/public fields and existing generic401 Apple failure handling. No raw network error/token logging. Runtime support must work with the repository's Node20 container as well as local Node24; [Node AbortController/timeout documentation](https://nodejs.org/docs/latest-v20.x/api/globals.html#static-method-abortsignaltimeoutdelay) is the version-specific reference. No dependency upgrade.

Because _setFetch affects the SDK module's other exports too, document its deliberate signing-key-only scope and verify there are no other runtime callers. Existing mocked SDK fixtures must provide the supported hook or mock the dedicated verifier boundary explicitly; do not skip assertions to accommodate missing mock methods.

## Acceptance and limits

Actual results:15 real-SDK/controller cases all failed on old code, then15/15 passed. Focused social-auth168/168 across5 suites and full backend1061/1061 across71 suites passed (24.371s),512MiB heap/semi-space4MiB. Synthetic2048-bit RSA/JWT keys exercised actual signature verification/cache, stalled headers/body abort at5000ms, parent cancellation, safe transport restrictions and timer/listener disposal. Existing mock SDKs now explicitly provide _setFetch; no negative assertions weakened. Independent bounded review found no actionable defects. Syntax/whitespace/index checks passed. Local Node24.14.1 used; Node20 runtime/real Apple acceptance not performed. Optional gaps: HTTP500, malformed key JSON and parent cancellation during body consumption. No frontend/Go/local DB profiles/build/deploy rerun.

Test before implementation with actual SDK plus mocked native transport: valid synthetic RSA key and signed-token verification, stalled initial response/body abort at deadline, caller cancellation if supplied, redirect and URL/method refusal, timer/listener cleanup, key caching and sanitized controller rejection before DB/session access. Use synthetic cryptographic material only. Run focused/full backend and independent review. No real Apple token/API, frontend activation, schema/env/dependency/Git/deployment action or local DB profile rerun.

Nonce/replay requires a separate browser/backend challenge design: server-generated challenge bound to the login session, expected nonce verified in the identity token and atomic consumption across workers. Merely trusting a nonce supplied with the token or maintaining a process-local consumed set is not adequate production closure. That coordinated flow, authorization-code exchange, cache refresh/key-rotation policy, concurrency/rate limits and actual Apple acceptance remain outside this bounded fix.
