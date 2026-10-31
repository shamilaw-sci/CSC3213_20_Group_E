# Seller checkout handoff

Approved: real frontend/backend seller screens against retained local stack-c, disposable seller and mock land; user enters sandbox payment. No hosted writes, email, worker, media uploads, normal environment changes or git mutations.

1. Add a separate guarded seller-UI launcher mode. Reuse checked local credential selection and tunnel verification. Keep actual authentication/property/payment handlers and actual frontend; adapt only frontend API transport to the private local listener while hook notify URL points to scoped ngrok ingress.
2. Seed a disposable seller with a real temporary password hash. Register created properties/orders from successful actual responses. Gate writes to the exact seller; forbid storage/email/worker. Save private recovery IDs before mutations, snapshot eleven tables and compare after exact cleanup.
3. Run focused checks and inspect guards, start fresh session, log in through the actual UI and add mock land. Hand the live checkout to the user, then verify signed callback and DB order/property/transaction/outbox.
4. Stop listeners, clean owned fixtures, preserve baseline, stop test services, save checkpoint. Never claim success from browser completion alone.
