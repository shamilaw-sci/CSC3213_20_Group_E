# Seller dashboard snapshot panels

Preserve current behavior and appearance while extracting only Recent Listings and Active Buyer Chats into SellerListingsPanel and SellerConversationsPanel. Keep state, effects, API calls, helper calculations, navigation ownership, chart, quick actions and advisor in SellerDashboard.

1. Snapshot the actual parent and characterize loading, empty, populated, paid/unpaid status badges, original server order/truncation and navigation against the original parent with controlled API/auth/router.
2. Move exact JSX roots into stateless panels, passing original free variables as props; retain classes, keys, callbacks and conditions.
3. Run focused parent and KPI tests, changed-source ESLint and exact normalized parent reconstruction/non-return preservation proof. Root coordinator runs aggregate acceptance and independent review. Browser verification is deferred; no git, environment, dependency or backend changes.
