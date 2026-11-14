# Profile and avatar preflight — 2026-11-04

Owner approved the bounded design. PUT /api/auth/profile now parses only known
writable fields before repository access. Invalid types, lengths, themes,
notification strings, unsafe URL schemes and malformed avatar inputs return a
fixed400. Names/email are normalized; unknown role/provider/hash authority fields
remain ignored. Existing current-account binding and credential session behavior
remain in place.

New avatar input accepts JPEG/PNG/WebP canonical base64 with nonempty decoded
bytes<=3MiB and a matching basic signature. Encoded length is bounded before
decoding. URLs remain bounded HTTP(S) without credentials; empty/null clears are
supported. Password/email checks finish before uploads. Generated user-ID/random
UUID keys use a fixed extension and upsert=false. No existing object is deleted.

Upload failure stops profile writes and returns a fixed503. Generated object keys
are logged only as bounded recovery events; raw provider errors, password/contact
data and encoded bytes are excluded. Later uncertain profile-write errors retain
the object and return a sanitized error. Legacy column fallback reports partial
success with omittedFields and an explicit message; the UI displays that message.
The picker checks type/3MiB before FileReader and reports invalid selections from
every tab through a toast; server validation remains authoritative.

This is partial image preflight, not full decoding/re-encoding, dimension/pixel
bomb protection, malware detection, metadata stripping or guaranteed safe content.
Storage remains public for avatars; no bucket/policy or real Storage acceptance
was performed. Uncertain/crashed writes still need durable reconciliation. Social
accounts without password hashes retain the existing password-change policy;
stronger reauthentication and coordinated bcrypt/password-policy review remain
separate work. External avatar URL tracking policy remains open.

## Evidence

Sixteen controller regressions all failed against the original behavior, then
passed. Parser tests cover canonical padding, size boundaries, accepted signatures
and invalid shapes. Independent review found WebP ASCII decoding could accept
high-bit lookalikes; a red regression verified it and raw byte comparisons fixed
it. Mocked storage collision test preserves the existing object. A loopback HTTP
test checks actual protect/controller rejection before profile repository calls.
Full backend1170/1170 across77 suites passed (49.998s).

Frontend regressions initially3 failed/4 passed with FileReader stubbed. Initial
fixture errors from calling native FileReader with synthetic objects were fixed;
the SecuritySettings mock now renders its real message/error props. Full frontend
305/305 across48 files passed (179.13s); lint/build passed with existing large-
chunk/Lottie warnings. The first full run304/305 exposed only the legacy image/*
picker expectation; it was updated to the approved specific allowlist before the
fresh full green run. Independent source review cleared the
WebP P2 and found no remaining actionable P1/P2 in the reviewed code.

No real account/provider/Storage/SQL operation, dependency upgrade, Docker startup,
staging/commit/push or deployment. Earlier Node24 image smoke artifacts predate
this application change; no fresh image or production acceptance is implied.
