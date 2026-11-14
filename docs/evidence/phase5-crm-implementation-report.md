# CRM implementation evidence

CRM batch follows the supplied brief/design. Production repository/dashboard remain unchanged pending actual initial runs by the coordinator.

Commands executed:

- `node node_modules/jest/bin/jest.js tests/integrationState.test.js --runInBand --no-cache` from backend-node: red, 1 failed / 11 passed. New CRM snapshot case threw `Unsupported snapshot table.`
- Same focused command after four static key mappings: green, 12 passed.
- `node --check integration/crm.integration.cjs` and `node --check integration/run-local.cjs`: exit 0.

Added explicit CRM launcher/config and ten-table profile; existing profiles/setup transport/delivery rules retained. Real fixtures use exact generated UUID/email identities, real login cookies (banned fixture changes role only after login), image-free property/property and support conversations, older/latest messages, composite receipts and guest endpoint booking. Cleanup recovers guest inserts by exact generated agent owners after failure and removes receipts/messages/conversations/leads before property/users. Parent launcher compares all ten full snapshots and ledger after child exits.

Actual CRM and rendered tests are deliberately not run concurrently or independently by the implementer; coordinator runs initial failure capture before bounded production edits. No hosted environment loaded, services started, schema/dependency changes or git mutations performed here.

## Parent evidence and bounded corrections
Initial realCRM2failed/8passed (10total),14.401s;tenfullsnapshots/ledgerpreserved. APIignoredtimeframe/preapproval andacceptedinvalidtimeframe. InitialUI2failed/8passed,10.11s:staleopenmodalstage plus ambiguousDeleteLead testselector. Directupdates now includeonlysupplied mappedfields;omittedlifecyclepreserved. Dashboardrestorespreviousstageonrejection andsyncsopendetailonreload;testselectorcorrected;doublefailurecaseadded.
Parentfocusedchecks afterpatch:crmOffer8/8pass1.399s;Dashboard11/11pass (JSONprivateevidence). No additionalunitred resultisclaimedbeyondobservedrealAPI/UIred. Finalrealprofileattemptrefusedbeforewrites becauseDockerDesktopenginepipeabsent;checksumverify2migrationspass. UseraskedtoopenDocker. Parentownsremainingchecks;crm_batchinterruptedwhilependinginit,so noagenteditsinflight.

