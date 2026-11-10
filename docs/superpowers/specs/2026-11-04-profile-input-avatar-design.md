# Profile input and avatar preflight

Status: owner approved and implemented2026-11-04. Mocked/loopback regression
verification and scoped independent review completed; real Storage remains open.

## Confirmed evidence

The protected PUT /api/auth/profile route has no body schema. The controller
allowlists writable fields, but calls string methods on unchecked values,
forwards notification values unchanged and uploads avatars before password
verification. The upload repository trusts claimed MIME, uses timestamp names
and upsert, and returns a public URL. Existing global JSON size is10MB.

An offline VM loaded the actual controller with synthetic repository/bcrypt
boundaries and no config/dotenv/network:

- avatar_url={} forwarded a startsWith type error.
- email_notifications='false' reached a profile write as a string and returned200.
- Text bytes labelled data:image/png reached upload and returned200.
- The same upload occurred before a wrong-current-password400 rejection; no
  profile write followed. This demonstrates an unnecessary write/orphan path,
  not a privilege escalation: an authenticated user can already update an avatar.

No real Storage upload, SQL write, provider call or XSS exploit was attempted.

## Options

- Recommended bounded batch: typed profile inputs, size/type/signature avatar
  preflight and password checks before upload; keep dependency versions unchanged.
- Schema only: prevents type errors, but leaves claimed image bytes and upload
  ordering unchecked.
- Full image decode/re-encode plus durable object reconciliation: stronger content
  and recovery controls, but requires a separate decoder/dependency and persistence
  design. Do not introduce those implicitly in this batch.

## Proposed contract

Use a focused profile parser in the controller before repository access, rather
than changing the shared validator's merge behavior for unrelated routes.
Require a plain body object. Keep the existing writable field allowlist and
ignore unknown authority fields such as role/provider/password_hash. Parsed
known values alone populate the update map.

Optional fields: name trimmed1–255 characters; email trimmed/lowercased valid
email<=254; phone string<=20 (empty string/null clears); theme one of
light/dark/system; email_notifications actual boolean. Avatar empty string/null
clears, otherwise a bounded HTTP(S) URL<=2048 with no credentials, or the raster
data-URL form below. Arbitrary URL hosts remain compatible; the backend does not
fetch those URLs. External tracking/image-origin policy remains open.

Password/currentPassword must be strings<=1024 characters when supplied. Empty
new password retains current no-change behavior; nonempty password keeps minimum6
and requires currentPassword. Retain the existing no-password/social-account
policy for this batch; stronger provider reauthentication and bcrypt truncation
policy across registration/login/reset/change require coordinated separate work.
Do not trim passwords. Preserve credential-bound session rotation on confirmed
password write and ordinary-edit no-rotation behavior.

Avatar data URLs: JPEG/PNG/WebP only, canonical base64, nonempty decoded data
<=3MiB, encoded-length bound checked before decoding, and matching basic file
signature/container prefix. Reject SVG/GIF/other types, invalid padding/alphabet,
MIME mismatch and oversized content with400 before upload/write. Signature checks
are partial validation: no full image decoder, dimensions/pixel bomb protection,
malware detection, metadata stripping or guaranteed safe-content claim.

Order: parse/validate all fields and avatar bytes; load current user; check email
collision and any requested password change; only then upload a new avatar and
write profile. Generate user-ID plus randomUUID object names with fixed extension
and upsert=false; do not overwrite an existing avatar on a collision. Preserve
legacy URLs for display and do not delete any existing objects.

Upload failure must stop profile writes and return a fixed unavailable response,
with no raw provider error/contact/password/base64 data in logs. A later ambiguous
profile-write failure retains the object and emits a bounded recovery event;
never guess whether a write committed or delete an attachment on uncertainty.
Durable cleanup, process-crash recovery and atomic user/avatar persistence remain
open. Existing schema-column fallback behavior must not claim a requested avatar
was saved if that field was dropped; report the partial outcome explicitly.

Align the profile avatar picker with JPEG/PNG/WebP and3MiB, showing a useful
client-side error before FileReader; server checks remain authoritative. Keep
existing valid empty-avatar/name/email/phone saves and Admin replacement-token
cache handling. No broader UI redesign, dependency install, Storage policy/schema,
real account/provider, Docker startup or deployment.

## Verification

Test-first boundary/controller cases: invalid types/limits/notifications, accepted
Unicode names, normalized emails, optional clears, unsafe URL schemes, canonical
base64 and exact size boundaries, MIME/signature mismatches, accepted raster
fixtures, random object ownership/no overwrite, no upload on wrong password or
email conflict, upload failure/no profile write, later ambiguous write retention,
safe logs, legacy-schema partial outcome and session behavior. Exercise the real
route with mocked external boundaries. Frontend tests cover picker rejection and
valid selection/save. Then affected/full backend and frontend checks plus scoped
independent review; no real Storage/privacy acceptance claim from mocks.

Primary reference checked2026-11-04:
[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
It recommends allowlists, size limits, generated names and layered validation,
and explicitly cautions that signatures alone are insufficient.

## Implementation evidence

Controller regressions16/16 red before implementation, then green. Parser,
collision and authenticated HTTP cases included in full backend1170/1170 across
77 suites (49.998s). Review found WebP ASCII high-bit normalization; regression
failed then raw byte comparison fixed it. Reviewer cleared that P2 and found no
new actionable P1/P2 in backend/frontend scope.

Frontend regressions3 failed/4 passed with safe FileReader stubs; mock message
props were corrected, invalid picker errors made visible via toast on every tab,
and the legacy image/* expectation updated for the intentional allowlist. Fresh
full frontend305/305 across48 files (179.13s), lint/build passed. Existing build
warnings retained. No dependency/schema/provider/real Storage/Docker/Git/deploy
action. Earlier image acceptance predates this batch. See
[profile preflight evidence](../../phase7-profile-preflight.md) for limits.
