# Paid rejected listing correction and resubmission

## Requested behavior

A Seller can correct an owned paid rejected listing and resubmit the same listing for Admin review without paying again.

## Recommended design

Add Edit & Resubmit to paid Needs Changes cards in My Listings. Open a prefilled editor for title, description, price, contact, address/town/district and applicable specifications. Display the saved rejection reason. Existing photos, panoramas and geometry remain attached to the same record during this correction flow.

Save & Resubmit uses the existing owner PATCH /api/properties/my-listings/:id endpoint. Preserve payment status and transaction linkage, set moderation status to pending and clear the old rejection reason only after successful save. Cancel leaves the saved listing intact. Failed save keeps entered corrections visible with an actionable error. Disable duplicate submission while saving.

The backend checks ownership and supported moderation state, validates editable fields and prevents client payment/status overrides. The update must retain ownership/state predicates at write time so concurrent approval cannot silently be overwritten. No database schema change is intended.

## Alternatives considered

- Reuse the full Add Property publisher. This requires separating creation, media uploads and checkout from update behavior and substantially expands this fix.
- Use a focused correction editor backed by the existing update endpoint. Recommended for the current rejected-listing correction gap. Media replacement remains a separate queued Seller edit case.

## Verification

Cover paid rejected correction to pending with payment preserved, cross-account rejection, invalid values, approved-state conflict, no duplicate creation or payment API calls, cancel and save failure, and refreshed rejection-reason removal after successful resubmission. Manually correct this existing test listing and verify Admin receipt before approval.

## Acceptance

User approved this design in the Seller E2E conversation on 2026-11-13. Commits and pushes remain with the owner.

