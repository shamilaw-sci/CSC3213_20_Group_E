# Chat attachment privacy — owner cutover procedure

The owner-approved ThirasaraDB cutover is applied. The bucket is private and
the restrictive client policy is active. The localhost chat routes passed
the hosted post-cutover upload and signed download smoke test.

## Delivery model

The backend stores new attachment references as chat-attachments/<conversation UUID>/<filename>. It recognizes historical public URLs only from configured SUPABASE_URL with the exact chat bucket/conversation namespace. No row migration, object relocation or deletion is needed. Authorized message reads (including previews/unread results) and send responses replace references with120-second signed URLs. Signing/invalid-reference failures hide the URL and preserve the message with an unavailable hint. Signed links remain usable by anyone who receives them until expiry; issuance checks do not constitute a per-download session check. Existing copied/downloaded files cannot be recalled.

## Preflight before any owner change

1. Confirm target project identity and take a private policy/bucket inventory and recovery snapshot. Do not export object contents, credentials or private messages into Git. Review all applicable storage.objects policies/roles, not only the known baseline policy names.
2. Confirm backend uses a trusted server-only key able to upload and sign private chat objects. This application uses custom session JWTs; do not assume auth.uid() policies map those users to Supabase Auth identities. Never grant public clients a service-role key or accept a browser-supplied object path as authority.
3. Inventory historical attachment reference shapes/counts without disclosing URLs, and identify references that the strict parser would reject. Generated references have exactly two object path segments: conversation UUID and filename. Resolve exceptions privately before cutover; do not broaden signing to arbitrary hosts/buckets/namespaces.
4. Validate the candidate code in an isolated environment with synthetic buyer/seller/admin/outsider accounts and synthetic files before applying hosted policy changes. Review upload/write/sign privileges and old/new attachment display. No retained integration container start or schema change is authorized solely by this document.
5. Generate any canonical migration using the project's reviewed CLI workflow only after the exact policy design is agreed. Do not alter the existing Phase4 baseline/checksum manifest. The SQL below is a review template, not an applied migration or a claim about current hosted state.

## Policy proposal for owner review

Make only chat-attachments private. Block direct anon/authenticated Storage operations for that bucket, while preserving their policies for other buckets and retaining backend service-role access. A restrictive policy avoids accidentally keeping access through another permissive public policy. Audit additional roles, privileged RPCs and alternate protocols that could bypass this boundary.

```sql
BEGIN;
DO $$
BEGIN
    IF (SELECT count(*) FROM storage.buckets WHERE id = 'chat-attachments') <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one chat attachment bucket';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity
    ) THEN
        RAISE EXCEPTION 'Storage object RLS must be enabled';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage'
        AND tablename = 'objects' AND policyname = 'phase7_chat_backend_only'
    ) THEN
        RAISE EXCEPTION 'Policy already exists; inspect it instead of overwriting';
    END IF;
END $$;
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';
CREATE POLICY phase7_chat_backend_only ON storage.objects
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (bucket_id <> 'chat-attachments')
WITH CHECK (bucket_id <> 'chat-attachments');
COMMIT;
```

This template must be reviewed against the actual platform's supported policy-management workflow and roles before execution. Do not change managed Storage schema structure. Existing broad chat policies become ineffective for these roles under the restrictive policy; remove obsolete policies separately only after confirming they are not shared with other buckets.

## Required verification and release gate

A rollback-only check on the isolated Phase 7 database used temporary read
grants to model the Storage roles. Before applying the candidate, anon,
authenticated and service_role could read the synthetic row. With the
candidate in effect, only service_role could read it. Other bucket visibility
settings were preserved. The transaction rolled back the grants, candidate
and synthetic row, and the test database was stopped.

A disposable local Storage HTTP run used the cached v1.84.19 image and a
fresh database. A synthetic object was readable through its public URL before
cutover. After applying the candidate, the same URL and direct anon and
authenticated download and signing requests were denied. The application
delivery adapter signed both legacy and managed references, and the returned
links delivered the expected bytes. A separate two-second link expired while
the adapter link still worked. The object and disposable resources were removed.
The focused application access and delivery suites passed 29 of 29.

The combined read test used the application's chat router, authentication,
controller and repository with disposable PostgreSQL, PostgREST and Storage.
The database used four fixture tables based on the baseline schema. Buyer,
seller and support admin requests each retrieved signed links for both
reference formats and downloaded the expected bytes. Outsider and banned
requests returned 403, and anonymous requests returned 401. None reached
signing. A reference scoped to a different conversation stayed hidden.
The synthetic file, containers and network were removed.

A separate disposable Storage HTTP run gave both client roles a permissive
fixture policy for the chat and unrelated control buckets. The candidate
hid chat objects from both roles and blocked upload, overwrite, upsert and
deletion. Backend reads confirmed that the existing object retained its bytes
and no new objects appeared. Both roles could still list, upload, update,
download and delete their own fixtures in the unrelated control bucket.
The backend could still upload, update and delete chat objects. Test objects,
containers and the temporary network were removed.

The local app upload and preview checks used the real router and repository
with disposable PostgreSQL, PostgREST and Storage. A buyer multipart send
stored a private attachment reference and returned a signed URL that
downloaded the original PNG. An outsider's multipart request returned 403
and created no object. Seller and support admin conversation previews
returned working signed URLs. The first unread check returned 500 because
the minimal fixture omitted the baseline messages-to-conversations foreign
key. A focused run with that relationship verified signed unread previews,
read receipts clearing unread counts, text-only send and empty outsider
previews. Both runs removed their disposable resources.

The hosted ThirasaraDB metadata query confirmed that the chat bucket is
public and object RLS is enabled. Three chat policies permit public reads,
authenticated uploads and authenticated deletion of owned objects. The
other three object policies are scoped to avatars. The query used only
SELECT and returned bucket and policy metadata. A second SELECT confirmed
that anon, authenticated and service_role have schema usage and object
SELECT, INSERT, UPDATE and DELETE grants. Only service_role among those
three roles has BYPASSRLS. The client roles are therefore subject to
the object policies for RLS-controlled requests. The owner confirmed that
the app currently runs on localhost. Its local backend configuration points
to ThirasaraDB and uses a legacy service-role JWT. The hosted Storage API
accepted that credential for a read-only bucket metadata request and
confirmed the chat bucket is public. Hosted CDN behavior and cutover
remain open.

For hosted verification, identify the deployment that serves the application
and confirm its Supabase project and server-side key type without exporting the
key. Validate a synthetic attachment upload and signed download through that
deployment before changing the live bucket. Use a separate hosted test bucket
for the cache rehearsal. Warm the public URL, make the test bucket private
under separate authorization, then compare the exact old URL with a fresh
cache key. Record status and cache headers without recording signed tokens.
Check the same warmed signed URL after token expiry as well. Supabase
documents independent token and CDN cache lifetimes, so the local expiry
result cannot establish when a cached hosted response stops serving.
[Supabase Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)

The hosted rehearsal used one uniquely named temporary bucket and a
synthetic text object with a 15-second cache setting. The public URL returned
HTTP 200 with a cache HIT before cutover. After the temporary bucket became
private, the exact warmed URL and a fresh cache key both returned HTTP 400
without the file. The signed URL returned the expected bytes before expiry.
After its eight-second token expired, the exact URL and a fresh cache key
both returned HTTP 400. These observations cover the test object's cache
settings and the edge reached by the probe. Cleanup removed the object and
verified the temporary bucket was absent.

After owner approval, one guarded SQL statement made the live chat bucket
private and added the restrictive policy. Its checks required the expected
public bucket, active RLS, service-role bypass and absence of an existing
policy with the target name. The dashboard confirmed `public=false` and
the restrictive policy for anon and authenticated. The configured backend
credential retained bucket metadata and object-list access. No existing
objects were used in the post-cutover probe. The cache rehearsal used only
the temporary bucket.

The post-cutover smoke test mounted the localhost chat router with its
configured hosted Storage and REST target. A synthetic buyer uploaded a
PNG to a support conversation. The stored message held a private object
reference. Both the send response and the support admin's message read
returned signed links that downloaded the exact PNG bytes. The unsigned
public URL was denied. Cleanup verified that the synthetic users,
conversation, messages and object were absent.

The first fixture used conversation type `agent` and was refused with
SQLSTATE 23514. The baseline conversation type check allows property and
support. That fixture was cleaned up before the support retry. The
owner approved the separate agent-conversation constraint change. The hosted
transaction now allows agent alongside property and support. The actual
agent route returned 201 on creation and 200 with the same conversation ID
on a second request. The database held one conversation for the synthetic
buyer and agent. Cleanup verified both users and the conversation were
absent. Existing customer URLs and cache entries were outside the smoke
tests.

- Confirm bucket is private and effective anon/authenticated read/list/sign/upload/update/delete access to synthetic chat objects is denied. Validate anonymous old public URL retrieval, authenticated direct retrieval and alternate serving paths, not just the app API.
- Participant/admin app requests must get usable short-lived links for both historical/new synthetic files. Outsider/anonymous/banned app requests must not obtain links or message metadata. Wrong-conversation/remote references must never be signed.
- Verify signed-link expiry, valid link reuse within the documented120-second window and renewed links after refresh. A copied valid signed URL is expected to work until expiry; do not report that as participant-only enforcement on each download.
- Verify old public URLs stop serving after provider/CDN/browser cache behavior is accounted for. Previously cached/downloaded content may persist; establish the provider's cache purge/TTL process and record its limits. Changing bucket visibility alone is not proof of immediate cache revocation.
- Verify text-only messaging, attachments, Admin messaging, read receipts, previews, unread counts and failure hints; object/message inventory and unrelated property/avatar access must remain unchanged.
- Record target identity, exact policy changes, test outcomes, expiry/cache limitations and preserved fixture cleanup privately. Only then consider S2 closure.

## Recovery

Preserve all message rows/objects and keep chat private. If signing/upload access fails, pause attachment rollout and correct the backend key/policy configuration or deploy a corrected delivery build. Keep text messaging available. Do not restore a public bucket as an automatic rollback. The old public-URL-only application cannot safely consume new managed references; an application rollback must retain the private delivery adapter or explicitly disable attachments until repaired. Previously issued signed links can remain valid until expiry.

Sources: [Supabase bucket access model](https://supabase.com/docs/guides/storage/buckets/fundamentals), [signed URL API](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl), [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
