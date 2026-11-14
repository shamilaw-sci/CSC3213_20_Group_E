# Phase 7 — tracked database credential containment

Owner decision2026-11-04: after the exposure/rotation distinction was explained,
owner stated 'No need to change password.' Credential rotation/revocation is
owner-deferred. Do not attempt or request it again without new owner direction.
The existing exposure/activity findings remain unverified and this item is not
recorded as remediated. Existing manual-Git ownership and no credential use or
disclosure restrictions remain in force. The procedure below is retained as
reference, not an action authorized for the agent to execute now.

2026-11-02. Git currently tracks go-map-service/.env. A value-shape check found a non-loopback DATABASE_URL with a password component and no obvious placeholder marker. No credential value is reproduced here. Activity, database permissions, repository visibility and access history have not been verified.

## Owner actions

1. Privately identify the database/provider and determine whether this credential remains valid. Do not paste the value into chat, screenshots, issues or commits. Do not test it using an untrusted tool.
2. If active, treat it as exposed: use the provider's trusted management interface to revoke/rotate the affected credential, review available access logs and identify legitimate services sharing it. Coordinate replacement values and existing connections so recovery does not leave stale access or unexpectedly interrupt the application. Merely changing a local file does not revoke database access.
3. Update each legitimate deployment/local secret privately. Verify service recovery and revocation using the provider's documented procedure. The agent has not performed these actions.
4. From the repository root, stop tracking the file while preserving the working copy:

```powershell
git -c core.fsmonitor=false rm --cached -- go-map-service/.env
git -c core.fsmonitor=false status --short
git -c core.fsmonitor=false check-ignore --no-index -- go-map-service/.env
```

Expected: staged deletion for go-map-service/.env, local file still present, and .gitignore matches the path. Root .gitignore already ignores .env. Do not use an unscoped git add command; docs/evidence/ is private and untracked. The owner performs this index change under the existing manual-Git agreement.
5. Review changes using explicit safe paths. Avoid displaying the staged deletion patch because it contains the old credential. Commit/push after the owner's normal verification. Untracking takes effect in shared repository state only after the change is committed and propagated.
6. Old commits/clones may retain the value. Rotation is the primary containment step. Evaluate provider/Git-host secret alerts and coordinated history cleanup separately; do not force-push or rewrite history without a dedicated owner decision.

## Safe setup

New developers copy go-map-service/.env.example to an ignored local .env and privately fill DATABASE_URL. The example uses placeholders only, includes PORT/ALLOWED_ORIGIN and matches main.go. Percent-encode username/password special characters; use the database provider's required TLS configuration. Never copy an exposed credential from Git history.

## Closure evidence

Record confirmation of rotation/revocation where applicable, access review outcome, legitimate service recovery, committed untracking and a fresh tracked-secret review without recording values. Until these exist, S1 remains open. The example correction alone does not contain exposure.
