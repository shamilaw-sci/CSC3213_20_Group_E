# Thirasara evaluation access handoff

This tracked template contains no credentials. Copy it to `evaluation-access.private.md` in the repository root and fill that ignored copy locally. Submit the completed copy and required environment files only through the approved private evaluation channel. Do not attach credentials to a public issue or commit them to Git.

## Final version and availability

- Repository: https://github.com/shamilaw-sci/CSC3213_20_Group_E
- Evaluation branch: main
- Final commit SHA: TO COMPLETE AFTER MERGE
- Hosted frontend URL, or local URL: TO COMPLETE
- Backend URL: TO COMPLETE
- Map service URL: TO COMPLETE
- Hosted database project name/reference: TO COMPLETE
- Evaluation availability period: TO COMPLETE
- Team contact for access problems: TO COMPLETE

Use the root README for setup. Local addresses in its quick start are frontend http://localhost:5173, backend http://localhost:5000 and map service http://localhost:9090. Hosted URLs must be recorded from the actual deployment rather than inferred from configuration.

## Controlled test accounts

| Role | Login email | Password (private copy only) | Confirmed access |
| --- | --- | --- | --- |
| Buyer | TO COMPLETE | TO COMPLETE | TO VERIFY |
| Seller | TO COMPLETE | TO COMPLETE | TO VERIFY |
| Approved Agent | TO COMPLETE | TO COMPLETE | TO VERIFY |
| Admin | TO COMPLETE | TO COMPLETE | TO VERIFY |

Admin entry point: `/admin/login`. Use dedicated synthetic accounts, not personal accounts. If MFA is enabled, document how the evaluator completes it privately; do not disable it or publish recovery codes merely to fill this form.

## Private configuration package

Provide working configuration for independent execution, not only account logins:

- `backend-node/.env`: Supabase URL/server-only service-role key, JWT secret, frontend origin, configured email, AI, sandbox payment and social-provider values.
- `go-map-service/.env`: database connection URL with provider-required TLS, matching port and allowed origin. Confirm it points to the same database as Node.
- `frontend-react/.env`: public API/map URLs, current public payment callback and configured public provider identifiers. Never include server secrets.

Record package delivery location: TO COMPLETE PRIVATELY.

Do not provide the Supabase dashboard owner's personal password. Privileged backend configuration belongs only in the private server setup package. Keep third-party evaluation keys scoped and valid for the evaluation window.

## Integration instructions

| Integration | Ready / unavailable | Evaluator instructions |
| --- | --- | --- |
| Hosted database and Storage | TO COMPLETE | No local reset/migration required when using the prepared project |
| PayHere sandbox | TO COMPLETE | Supply approved sandbox test instructions and current callback availability; no real payment |
| Email/reset/notifications | TO COMPLETE | Explain access to a controlled test inbox or an agreed evaluator-owned address |
| AI chat | TO COMPLETE | Confirm key/quota availability; record any provider limitations |
| Google/Facebook/Apple | TO COMPLETE PER PROVIDER | Identify configured providers and permitted evaluation origins/accounts |
| Optional map imagery | TO COMPLETE | Record any token/domain restrictions |

A localhost PayHere callback cannot receive gateway notifications. If using a tunnel, record its active HTTPS URL, keep it running and update frontend configuration when it changes. A successful browser return alone is not proof of payment settlement.

## Synthetic fixtures and permitted actions

- Searchable approved property title/ID: TO COMPLETE
- Seller-owned disposable listing title/ID: TO COMPLETE
- Approved Agent profile: TO COMPLETE
- Safe complaint/archive fixture title/ID: TO COMPLETE
- Actions to avoid on shared fixtures: TO COMPLETE

Use synthetic data. Do not ask evaluators to delete real listings, modify unrelated users or repeat live purchases. Existing historical bookings are not claimed by matching email.

## Final handoff checks

- [ ] All four accounts sign in and have the intended role.
- [ ] Private environment files contain working values, not example placeholders.
- [ ] Database/Storage and third-party services will remain available.
- [ ] An independent clone follows README successfully with the supplied package.
- [ ] Final main commit matches the submission and hosted build, where deployed.
- [ ] No private package or real credentials appear in the staged Git changes.
- [ ] Completed private package delivered to the evaluator through the submission channel.

Known limitations or unavailable features: TO COMPLETE HONESTLY.
