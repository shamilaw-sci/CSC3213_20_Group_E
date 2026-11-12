# Repeated Seller request rejection

The failed manual rejection returned HTTP 409. A read-only hosted lookup of the
identified test request found it still pending and found an earlier rejected
Seller request for the same user. The recorded schema has a unique constraint on
`(user_id, status)`. The rejection function only updates request status; the
controller maps uniqueness violations to 409. The observed state is consistent
with that constraint blocking a second rejection. No failed RPC was replayed and
no request was changed during diagnosis; the live constraint definition has not
been independently read.

Recommended design: retain every historical request, replace the history-wide
unique constraint with a unique partial index on `user_id WHERE status='pending'`.
This preserves duplicate pending-request protection while allowing repeated
rejection after resubmission. Keep the existing atomic resolver and its execute
permissions unchanged. Removing the old rejected row would lose history; leaving
the schema unchanged would continue blocking this legitimate resolution.

The adjacent SQL is a proposed owner-executed change. It guards the exact old
constraint definition, owner and RLS state, locks out writes during adoption,
installs pending protection before dropping the old constraint, and changes no
rows, roles or privileges. Any guard/index/drop failure rolls back the transaction.
Do not remove guards to force adoption. This is intentionally not rerunnable;
inspect existing state if it says the constraint/index differs.

Runtime SQL verification has not been performed for this proposal. Owner review
and adoption are pending. After adoption, expect the unique partial index in the
first verification result and `old_constraint_count=0` in the second. Refresh the
Admin list, reject the identified pending test request once, confirm removal after
refresh, and confirm that its user remains BUYER. Rejection and concurrent pending
request protection require acceptance; static SQL review alone does not prove them.
