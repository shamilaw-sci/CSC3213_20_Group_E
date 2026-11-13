# Seller manual E2E - 2026-11-13

## Workflow

User operates localhost and verifies one case at a time. Assistant records outcomes and bugs. Fixes follow the Seller walkthrough unless the user requests an immediate fix. Skip accepted Buyer/common flows; Buyer/Admin handoffs cover only Seller-specific behavior. Older open cases remain open.

Use disposable listings prefixed SELLER-E2E-20261113. Do not record credentials or payment details. Payment cases require PayHere sandbox; unavailable dependencies mean Blocked, not Pass.

Source: current Seller dashboard/panels, original SE-01 through SE-06 plan and manual-e2e-run-log.md. Expand grouped cases when actual controls are encountered. This file is the active Seller run log; the older log's current-case pointer is historical.

## Checklist

| Case | Scope | Status |
| --- | --- | --- |
| SE-01A | Dashboard identity, loading, current totals/panels and refresh | Pass by user report; analytics issue SELLER-01 logged |
| SE-01B | Dashboard action links; My Listings baseline and count/status agreement | My Listings empty-state navigation/refresh Pass by user report; other links pending |
| SE-02A | Add Property required/invalid inputs, category-specific fields/pricing | Not run |
| SE-02B | Location search/map pin, address and coordinates | Not run |
| SE-02C | Specifications, amenities and category-dependent controls | Not run |
| SE-02D | Media upload/remove/order and HD/360 where offered; invalid media | Not run |
| SE-02E | Back/Next value retention, review accuracy and submit | Not run |
| SE-03A | Unpaid draft persistence, sandbox payment cancellation and retry | Not run |
| SE-03B | Sandbox decline/failure and retry without false Paid/duplicate listing | Not run |
| SE-03C | Sandbox success, backend-confirmed payment, refresh and receipt where configured | Not run |
| SE-04A | Paid/pending state, Admin receipt, rejection reason and correction/resubmit where offered | Not run |
| SE-04B | Admin approval, Seller status and exact public search/map/detail data/media | Not run |
| SE-05A | Edit disposable listing details/media; persistence and moderation/public behavior | Not run |
| SE-05B | Available status/visibility controls and Buyer saved-listing handoff | Not run |
| SE-06A | Seller fixture inquiry reaches correct Seller/thread; reply/refresh and dashboard counts | Not run |
| SE-07A | Ownership isolation: another account cannot see/manage private Seller listing records | Not run |
| SE-05C | Delete disposable listing: cancel/confirm, refresh, totals and public removal | Not run |
| SE-08A | Seller narrow-screen layout, empty/error states and remaining exposed controls | Not run |

## Observations and bugs

SE-01A: User reports all guided dashboard checks working correctly. Screenshot shows My Listings (0) and no active inquiries. This establishes render/refresh acceptance, not analytics correctness.

## Current guided case

SE-01A: Open Seller Dashboard using the approved Seller account. Check identity, loading, totals/panels and refresh. Do not modify listings. Empty data is valid. Capture totals as baseline and await user observation before advancing.


### SELLER-01 - Mock weekly engagement presented as actual analytics

- Case: SE-01A; severity: Medium (misleading dashboard analytics).
- Evidence: user screenshot shows nonzero weekly bars, +18.4% and High Demand with zero listings. Current SellerDashboard.jsx lines 206, 213-220 and 256 hardcode these values.
- Actual: Mon-Sun view counts 35/55/40/70/65/90/80; growth and Lead Velocity do not use database activity. The inquiries values in the static array do not render a separate inquiry series.
- Related distinction: Avg Views / Property and Save Rate are computed from API-loaded aggregate listing stats; they are not weekly time-series values.
- Expected: Seller-scoped recorded activity and calculated growth/demand, or a clear no-data/unavailable state.
- Status: Open; defer design and implementation until Seller walkthrough ends per user instruction.
- Next guided case: SE-02A.1 Add Property empty required fields.

### SE-01B observed result
User confirmed My Listings (0) opens the correct page with an empty state and retains that state after refresh. Other dashboard links are not implicitly accepted. Next: SE-02A.1 open Add Property and attempt Continue with empty required fields; await user result.


### SE-02A.1 empty title validation - Pass
User reports Continue shows: Please enter a descriptive property title. Empty-title validation accepted within reported scope. Next: SE-02A.2 enter title only, leave price empty, Continue and observe price validation.


### SE-02A.2 empty price validation - Pass
User confirms Please provide a valid asking price after entering title and leaving price empty in the guided case. Next: SE-02A.3 set price to 0 and attempt Continue; await user observation.


### SE-02A.3 zero price validation - Pass
User reports Please provide a valid asking price for price 0 in the guided Continue check. Next: SE-02A.4 negative price -1000; observe rejection or input-level prevention before advancing.


### SE-02A.4 negative price validation - Pass
User reports Please provide a valid asking price for -1000 during the guided Continue check. Next: SE-02A.5 enter valid price 25000000, leave district unselected and Continue; observe district validation. If a district is preselected and cannot be cleared, record that behavior instead.


### SE-02A.5 missing district validation - Pass
User reports Please select the property district with valid price and no district selected. Next: SE-02A.6 select Kandy district with existing title and price 25000000, Continue and verify Spatial Location opens; await observation. Category-specific pricing coverage remains pending.


### SE-02A.6 progression with blank contact - Needs change
User confirms valid title/price/district advances to Spatial Location despite Mobile Number remaining empty. Navigation works; required-contact validation does not. Do not mark the whole first step passed.

### SELLER-02 - Required contact number bypasses first-step validation
- Case: SE-02A.6; severity: Medium.
- Actual: Contact Number (WhatsApp / Call) has a required asterisk, but empty value allows Continue to Spatial Location.
- Source: CategoryPriceStep.jsx contact input lacks required; AddProperty.jsx validateStep(1) checks title, price and district only.
- Expected: required contact number must be validated with clear feedback before progression; invalid formats need coverage.
- Status: Open; fix deferred until Seller walkthrough completes. Final-submit/backend acceptance of empty contact has not been tested.
- Next: Previous Step; confirm title/price/district retained, set contact to 123 and Continue once to test invalid format.


### SE-02A.7 invalid contact number - Fail
User confirms Contact Number 123 advances to Spatial Location without validation. SELLER-02 now covers both empty and invalid-format contact at step transition. Back-navigation field retention was not separately confirmed. No final-submit/backend acceptance claim. Fix deferred as agreed.
Next: SE-02B.1 leave town/address empty on Spatial Location and click its Continue button once; observe required location feedback without submitting a listing.


### SE-02B.1 missing town/address validation - Pass
User reports Please specify the town or street address for empty town/address on Spatial Location. Next location/map guidance pending inspection of current controls.


### SE-02B.2 single pin placement - Pass
User confirms guided map loading, click-to-place and moving the single pin work. Saved coordinates and public placement not yet verified. Next: SE-02B.3 select Draw Boundary Polygon, add exactly two distinct points and attempt Continue with town Kandy retained; expect minimum-three-points feedback.


### SE-02B.3 two-point boundary validation - Pass
User reports Please click at least 3 distinct points on the map to define the boundary after guided two-point boundary attempt. Next: SE-02B.4 add a third distinct non-collinear point, verify visible triangle and progress to Specs & Photos; await user result. Boundary persistence/clear/mode-switch/GPS remain pending.


### SE-02B.4 valid three-point boundary - Pass
User confirms guided third non-collinear point displays triangle boundary and Continue opens Specs & Photos. This is UI progression, not saved geometry verification. Next: SE-02B.5 Previous Step to Spatial Location; verify Kandy, boundary mode and same three-point polygon retained. Do not refresh or clear geometry.


### SE-02B.5 back-navigation location retention - Pass
User confirms Kandy, boundary mode and same triangle remain after Previous Step from Specs & Photos. Refresh/database persistence not established. Next: SE-02B.6 Clear Boundary removes polygon/points and resets count; Continue must reject empty boundary with minimum-three-points feedback.


### SE-02B.6 clear boundary - Pass
User confirms Clear Boundary removes polygon/points, resets count to 0 and Continue rejects empty boundary with minimum-three-points validation. Next: SE-02B.7 redraw three-point boundary, switch to Single Pin Location and back to Draw Boundary Polygon; verify old boundary is cleared rather than restored. Await observation before advancing.


### SE-02B.7 mapping mode switch - Pass
User confirms switching from drawn boundary to Single Pin removes polygon, and switching back to boundary shows 0 selected without restoring old geometry. Next: SE-02B.8 select Single Pin Location and click My GPS; observe permission prompt, successful marker/map positioning or actionable failure. User need not disclose exact coordinates.


### SE-02B.8 My GPS - Fail
User granted location permission but reports map does not go to current location. GPS callback success, coordinate accuracy and marker movement are not yet confirmed.

### SELLER-03 - My GPS does not move map to current location
- Case: SE-02B.8; severity: Medium.
- Steps: Single Pin Location, My GPS, allow browser location access.
- Actual: user reports map does not navigate to current location.
- Expected: successful location lookup visibly centers map on returned position; failures provide clear feedback.
- Source observation: handleGetGPS updates form coordinates; rendered MapContainer receives center but no explicit setView/flyTo synchronization is present in this page. Likely recentering gap; callback result and actual geolocation accuracy remain unverified.
- Status: Open; fixes deferred until Seller walkthrough ends.
- Next diagnostic observation: ask whether My GPS changes to active appearance or any error appears; no exact location requested.


### SELLER-03 clarification - GPS position appears after step remount
User reports that after Continue and returning to Spatial Location, the pin correctly shows their current location. User-observed GPS acquisition and in-form coordinate retention work; immediate viewport recentering fails. This aligns with coordinates updating while MapContainer only applies center at mount. Database persistence and exact coordinate accuracy are not independently verified. Workaround: Continue then Previous Step. Issue remains Open for immediate recentering; do not label GPS acquisition broken.
Next: SE-02C.1 return to Specs & Photos, leave photos empty and click Continue; observe required-photo validation. Existing invalid contact fixture remains unresolved and must be replaced with valid contact before any final submission.


### SE-02C.1 required photograph validation - Pass
User reports Please upload at least 1 photograph of your property after Continue without photos. Next: SE-02D.1 attempt one ordinary property image larger than 5 MB, if available, and observe size-limit rejection with no added preview. Do not use HD/360 upload for this case. If no such fixture is available, mark deferred and proceed to normal image upload.


### SE-02D.1 oversized property photo - Rejection observed
User reports Upload failed: One or more files exceed the 5MB maximum size limit. Size validation message accepted; absence of an added preview was not separately confirmed. Next: SE-02D.2 choose one ordinary JPG/PNG under 5 MB; verify processing completes, one preview appears and prior error clears. Do not advance steps yet.


### SE-02D.2 valid photo upload and recovery - Partial pass / Needs change
User confirms valid image uploads successfully and HD Storage Used updates, but previous size-limit error remains displayed. Guided preview confirmation accepted in context; displayed storage value is not independently checked against hosted storage usage.

### SELLER-04 - Stale photo size-limit error after successful upload
- Case: SE-02D.2; severity: Low.
- Steps: reject an image over 5 MB, then upload a valid image under 5 MB.
- Actual: valid image accepted and HD Storage Used updates, while previous size-limit error stays visible.
- Expected: successful recovery clears the obsolete upload error without hiding unrelated errors.
- Status: Open; fix/retest deferred until Seller walkthrough completes.
- Next: SE-02D.3 remove the only uploaded image using its remove control; verify preview and storage indicator update, then Continue rejects zero photos. Await result.


### SE-02D.3 photo removal - Pass
User confirms guided removal clears the preview, reduces HD Storage Used and Continue with zero photos shows the required-photograph validation. This is UI state only, not hosted storage cleanup verification. Next: SE-02D.4 upload two distinct valid JPG/PNG images under 5 MB each; verify both previews, then remove only the second and verify the first remains. Await result; do not advance.


### SE-02D.4 multiple photos and selective removal - Pass
User confirms two distinct valid images show previews and removing only the second preserves the first. Next media case will be selected after inspecting exposed Specs & Photos controls. Photo count limit, unsupported formats, virtual tours and specification fields remain pending.


### SE-02D.5 photo count limit - Rejection observed
User reports You can upload up to 8 high-definition photos for guided total-nine attempt. Count-limit message accepted; batch atomicity and original-preview retention not separately confirmed. Next: SE-02D.6 inspect current previews: only the original image should remain after rejected batch. Await confirmation before next media/specification case.


### SE-02D.6 rejected photo batch retention - Pass
User confirms only the original photo remains after the rejected over-limit batch. Together with SE-02D.5, count-limit rejection and batch retention pass within observed UI scope. Next: inspect specification fields for selected asset class before giving category-specific input case.


### SE-02C specification controls observed
User lists Bedrooms, Bathrooms, House Size (sqft), Land Size (Perches), Description. Selected asset class has not been explicitly confirmed; do not infer category acceptance from fields alone.
Next: SE-02C.2 set Bedrooms to -1 while retaining valid photo, then click Review Property Details. Observe whether negative value is blocked or Review opens. Do not publish/pay; invalid fixture must be corrected before submission.


### SE-02C.2 negative bedrooms validation - Fail
User confirms Bedrooms -1 advances to Review & Publish without validation. Final submission was not requested or tested.

### SELLER-05 - Negative bedroom count bypasses specification validation
- Case: SE-02C.2; severity: Medium.
- Steps: retain valid photo, enter Bedrooms -1, click Review Property Details.
- Actual: Review & Publish opens without validation.
- Expected: reject negative bedroom count with clear field feedback before review.
- Status: Open; fix deferred until Seller walkthrough ends. Bathroom/area validation and backend enforcement remain unverified.
- Next: SE-02C.3 Previous Step, correct Bedrooms to 3, set Bathrooms -1 and click Review Property Details once. Do not publish/pay.


### SE-02C.3 negative bathrooms validation - Fail
User reports no validation for guided Bathrooms -1 attempt after correcting Bedrooms to 3. Extend SELLER-05 to negative bedroom and bathroom counts. No final-submit/backend enforcement claim. Next: SE-02C.4 return to Specs & Photos if necessary, correct Bathrooms to 2, set House Size (sqft) -100 and attempt Review Property Details. Do not publish/pay.


### SE-02C.4 negative house size validation - Fail
User reports no validation for House Size (sqft) -100 during guided Review attempt. Extend SELLER-05 specification validation scope to negative house area as well as bedroom/bathroom counts. Backend enforcement remains untested; no final submission requested.
Next: SE-02C.5 return to Specs & Photos, correct House Size to 1800, set Land Size (Perches) -5 and click Review Property Details. Await result; do not publish/pay.


### SE-02C.5 negative land size validation - Fail
User reports no validation for Land Size (Perches) -5 during guided Review attempt. SELLER-05 now covers negative Bedrooms, Bathrooms, House Size and Land Size at step transition. Fix deferred; backend acceptance remains untested.
Next: SE-02C.6 correct Land Size to 15, retain Bedrooms 3, Bathrooms 2, House Size 1800, enter description Seller E2E test property - not a real advertisement, then Review Property Details. Verify review shows correct specification values and photo. Do not publish/pay; contact 123 must still be replaced before final submission. Boundary/GPS location fixture also requires intentional test-location selection before publishing.


### SE-02C.6 valid specifications review - Pass
User confirms review correctly displays guided Bedrooms 3, Bathrooms 2, House Size 1800, Land Size 15, description and retained photo. This does not establish persistence or invalid-value enforcement.
Next: SE-02E.1 review title SELLER-E2E-20261113 Test House, price 25000000, district/town Kandy and displayed category/contact if present. Record mismatches or omitted fields; do not publish/pay. Contact 123 remains an invalid fixture to correct before submission.


### SE-02E.1 review details accuracy - Pass by user report
User confirms correct review and supplies screenshot: House (Sale), Rs. 25.00 Million, Kandy district/town, 3 beds, 2 baths, 15 perches, 2000 sqft, 3 photos, correct test title. Contact has been changed from invalid fixture to a populated local-format number; do not reproduce personal number in log. Current area/photo fixtures supersede earlier 1800 sqft/one-photo values. Screenshot does not independently verify description or hosted persistence.

### SELLER-06 - Low contrast price overlay in light-theme review card
- Case: SE-02E.1; severity: Low; assistant-observed in user screenshot.
- Actual: dark price text overlays a dark/busy photo area and is difficult to read.
- Expected: readable price contrast across listing photos and themes.
- Status: Open for feedback batch; no code changed.
- Next: SE-02E.2 use Specs & Photos Edit, change description to Seller E2E test property - updated review check, return to Review; verify edit retention and unchanged other details/photos. Do not publish/pay.


### SE-02E.2 review Edit and description retention - Pass
User confirms guided Specs & Photos Edit, description update, return to review and reopening retains description and other specifications/photos. Database/refresh persistence not established.
Next: SE-02D.7 optional 360 panorama fixture availability; ask whether user has a real equirectangular 360 image under 5 MB. If unavailable, defer tour-specific cases and proceed with remaining category/pricing checks before payment. Do not represent ordinary photo as valid panorama.


### SE-02D.7 panorama fixture available - Awaiting upload result
User confirms a real panoramic image is available. Guided case: in Specs & Photos use 360 Virtual Tours upload for one JPG/PNG under 5 MB; verify preview, Room / Area Label control and 360 Storage Used update, set label Living Room. Do not use ordinary Property Photos uploader or publish/pay. Await user observation.


### SE-02D.7 panorama upload - Pass
User confirms guided real panorama upload under 5 MB shows preview and Room / Area Label, accepts Living Room label and updates 360 Storage Used. Public panorama rendering and hosted storage persistence not yet tested.
Next: SE-02D.8 Review Property Details, verify one panorama and Living Room label in review, then Specs & Photos Edit to confirm preview/label retained. Do not publish/pay.


### SE-02D.8 panorama review and retention - Pass
User confirms Review shows one panorama with Living Room label; returning via Specs & Photos Edit retains preview and label. Public 360 viewer and database persistence remain untested.
Next: SE-02D.9 remove the panorama using its delete control; verify preview/label disappear and 360 Storage Used returns to zero while ordinary photos remain. Await result; do not publish/pay. Re-upload a valid panorama afterward for downstream public-view acceptance.


### SE-02D.9 panorama removal - Pass
User confirms deleting panorama removes preview/label, resets 360 Storage Used to zero and preserves ordinary property photos. UI removal only; hosted cleanup not established.
Next: SE-02D.10 attempt panorama upload over 5 MB using 360 Virtual Tours uploader. Expect 360-specific size error, no added panorama and zero 360 Storage Used. Ordinary oversized image fixture from SE-02D.1 may be used solely to exercise pre-upload size rejection, not valid panorama rendering. Do not publish/pay.


### SE-02D.10 oversized panorama - Rejection observed
User reports Upload failed: One or more 360 panorama files exceed the 5MB limit. Correct 360-specific rejection message observed; preview absence and zero storage were not separately confirmed.
Next: SE-02D.11 re-upload one valid real panorama under 5 MB via 360 uploader and label Living Room. Observe preview/storage recovery and whether prior 360 size-limit error clears. Keep valid panorama for downstream public-view test; do not publish/pay.


### SE-02D.11 valid panorama upload recovery - Partial pass / Needs change
User reports successful valid panorama upload but prior size-limit error remains. Navigating to Review and back clears the error. Label/storage details not separately restated in this response. Extend SELLER-04 stale upload-error scope to both ordinary photos and 360 panoramas. Workaround observed for panorama error: Review then return. Fix deferred until Seller walkthrough completes.
Next: SE-02D.12 panorama count limit: with one valid panorama retained, select five additional valid under-5-MB panorama files in one batch. Expect max-five rejection and original panorama/label retained. If fixture unavailable, mark pending rather than Pass. Do not publish/pay.


### SE-02D.12 panorama count limit - Pass
User confirms guided six-total panorama attempt triggers max-five rejection and retains original panorama/label. This is user-observed UI coverage, not server limit verification.
Next: SE-02A.8 return to Category & Price (review Edit or step navigation), select Rent House and observe Listing Type becomes For Lease / Rental and rental period selector appears with corresponding price preview. Do not alter price or publish; category switching may affect specifications, so recheck before final submission.


### SE-02D.12 screenshot clarification
Screenshot confirms native browser alert: You can only upload up to 5 virtual tours. Existing multiple panorama rows are visible (including Room and Living Room); supersedes assumption that fixture still contains exactly one panorama. Count guard message confirmed, but exact current count and rejected-batch retention are not independently established by screenshot.

### SELLER-07 - Inconsistent native alert for panorama count limit
- Case: SE-02D.12; severity: Low / UX.
- Actual: panorama count error uses blocking browser alert while other upload validation uses page messages.
- Expected: consistent, accessible in-page upload validation near relevant controls.
- Status: Open for feedback batch; count-limit functional rejection remains accepted by user report. No fix requested now.
- Next observation: dismiss alert and report number of panorama previews currently shown, so downstream fixture state is accurate. Do not upload more or publish/pay.


### SE-02D.12 current panorama fixture count
User confirms 5 panorama previews after dismissing limit alert. Current fixture count is 5, superseding earlier single-panorama assumption. Exact batch history not established. Limit UI observation accepted; native alert UX remains SELLER-07.
Next: SE-02A.8 navigate to Category & Price via step navigation or Review Edit, select Rent House and verify For Lease / Rental plus rental-period selector. Keep price unchanged for this control-only check; do not publish/pay. Category-switch specification retention must be rechecked before final submission.


### SE-02A.8 rental category controls - Pass
User confirms Rent House switches Listing Type to For Lease / Rental and displays rental-period dropdown. No rental submission or persistence established.
Next: SE-02A.9 set temporary rental price 75000, change rental period between available options and observe preview suffix follows selection. Await result and selected options; restore Sale fixture later before submission.


### SE-02A.9 rental period preview - Pass
User confirms temporary price 75000 retains amount while preview period changes Month to Year. Current fixture temporarily Rent House / 75000 / Year; restore intended sale data before submission.
Next: SE-02A.10 select Residential House and verify Listing Type For Sale / Outright Purchase, rental-period dropdown disappears and price preview has no Month/Year suffix. Restore price 25000000. Do not publish/pay; category switch may reset specification fields.


### SE-02A.10 rental-to-sale controls - Pass
User confirms Residential House restores For Sale / Outright Purchase, removes rental-period dropdown and Month/Year preview suffix; guided price restored to 25000000. Specifications need recheck following category changes.
Next: SE-02A.11 select Land Only, keep price 25000000, navigate through valid Spatial Location to Specs & Photos. Verify Land Size/Description shown and Bedrooms/Bathrooms/House Size hidden. Do not publish/pay; restore House fixture later. If town was cleared by category changes, restore Kandy without changing pin.


### SE-02A.11 land category specification fields - Pass
User confirms Land Only shows Land Size/Description and hides Bedrooms/Bathrooms/House Size. Current category temporarily Land; photo/panorama retention and hidden-field data cleanup not independently verified.
Next: SE-02A.12 select Rent Villa in Category & Price, verify rental type and period dropdown, then navigate to Specs & Photos and report visible size/bedroom/bathroom fields. Do not publish/pay; House Sale fixture will be restored afterward.


### SE-02A.12 Rent Villa category - Pass
User confirms rental listing type/period controls, Bedrooms/Bathrooms/House Size shown and Land Size hidden. Rental submission/persistence remains untested.
Next: SE-02E.3 restore Residential House / Sale and price 25000000; retain a valid contact number. Category switches clear some specification fields, so restore Bedrooms 3, Bathrooms 2, House Size 2000, Land Size 15 and existing test description. Return to Review and verify title, Kandy, photo count and panorama count/labels still match current fixture. Do not publish/pay. Await confirmation before payment readiness check.


### SE-02E.3 restored House Sale review - Pass
User confirms restored Residential House/Sale, price 25000000, valid contact, 3 bedrooms, 2 bathrooms, 2000 sqft, 15 perches and retained title/location/description/photos/panorama labels all correct in Review. Final exact media counts not restated. No listing submission/payment yet.
Next: SE-03 readiness observation: report One-Time Activation Fee amount and final button text, plus any payment configuration warning. Confirm PayHere sandbox/test mode before opening checkout; no real payment requested.


### SE-03 payment readiness - Pass for UI
User confirms and screenshot shows One-Time Activation Fee Rs. 600 LKR, Test checkout and enabled Proceed to Payment (Rs. 600). Runtime PayHere launch/callback not yet verified. Screenshot current card shows 1500 sqft, superseding earlier 2000 sqft fixture observation; no automatic data-loss conclusion because intervening user edits are unknown. Other shown values: 3 beds, 2 baths, 15 perches, correct test title/Kandy/25 Million.
Next: SE-03A.1 click Proceed to Payment once; inspect sandbox checkout amount LKR 600, then close/cancel without paying. Record checkout launch/cancel message and resulting app view. Do not click repeatedly or create a second listing if launch fails; await result before draft persistence/retry checks.


### SE-03A.1 sandbox checkout launch - Pass; cancellation pending
User reports ngrok already running. Screenshot confirms PayHere modal, Sandbox Notice, listing-fee description and Rs. 600.00. Background shows Property saved! Initiating payment message. This establishes checkout launch only; persisted draft count, payment callbacks and Paid status are not verified. Do not infer ngrok callback reachability from modal launch.
Next: close checkout using top-right X without selecting payment method, then report exact app message and resulting page. Do not click Proceed again or create another listing before checking draft state.


### SE-03A.1 sandbox cancellation - Pass by user report
User reports Payment cancelled message, redirect to Dashboard and banner: You have 1 unpaid draft listing saved. Complete payment to submit for Admin review. This establishes cancellation feedback and visible unpaid draft; database payment state and duplicate count not independently queried.
Next: SE-03A.2 refresh Dashboard, verify unpaid draft count remains 1, open View Drafts/My Listings and verify exactly one matching SELLER-E2E-20261113 Test House with unpaid/draft state and a payment retry control. Do not initiate checkout yet. Await result before retry/decline case.


### SE-03A.2 unpaid draft persistence - Pass by user report/screenshots
User confirms refresh/navigation check. Dashboard screenshot shows My Listings (1), one unpaid draft banner, live 0 and under review 0. My Listings screenshot shows one matching test-title card, Drafts (Unpaid), correct Kandy/25000000, Payment Required to Submit and Pay Rs. 600. No duplicate visible. No direct database verification implied.
Next: SE-03A.3 retry from this existing draft via Pay Rs. 600 once; verify sandbox checkout Rs. 600 then cancel again. Refresh My Listings and verify same single unpaid draft remains, with no duplicate. This tests retry independently of decline; controlled decline remains pending.


### SE-03A.3 existing-draft payment retry - Pass
User reports retry worked with no duplicate after guided reopen/cancel/refresh sequence. Same unpaid draft retained within user-observed scope. Controlled payment decline and successful backend-confirmed payment remain pending.
Next: SE-03B controlled sandbox decline fixture readiness. Do not guess decline card credentials or use real card details. Determine whether checkout provides an explicit failure/decline simulation; if unavailable, defer decline and proceed with documented sandbox-success procedure.


### SE-03B.1 controlled sandbox decline - Awaiting user
User supplied sandbox success and specific decline test-card instructions. Use supplied Visa Insufficient Funds fixture for one simulated attempt on existing draft, explicitly in Sandbox mode, with synthetic valid name/CVV/future expiry. Do not record entered card form details. Observe gateway and app failure feedback, then refresh My Listings and verify same single unpaid draft remains and retry available. No success/payment state inferred until user reports. Other decline scenarios remain pending.


### SE-03B.1 sandbox insufficient-funds decline - Gateway rejection Pass
User reports Decline Message: Insufficient Funds; issuer declined payment and prompts a different method. This confirms gateway simulated decline only. App failure handling, callback state and unpaid persistence remain pending.
Next: close failed checkout without another attempt, record app message/page, refresh My Listings and verify exactly one matching listing remains Drafts (Unpaid) with Pay Rs. 600, not Paid or Under Review. Await user result before retry/success.


### SE-03B.1 post-decline unpaid persistence - Pass by user report
User confirms guided close/refresh leaves the same single Drafts (Unpaid) listing with Pay Rs. 600. Exact app message was not supplied; do not mark message wording accepted. Gateway decline and unpaid/retry UI state pass within observed scope.
Next: SE-03B.2 simulate Network Error with user-supplied sandbox Visa 4024007120869333 on same draft; await exact gateway result before any app-state/retry checks. Use synthetic valid card form data; do not log entered payment details. Do not retry automatically if outcome ambiguous.


### SE-03B.2 sandbox processor-network decline - Gateway rejection Pass
User reports Decline Message: Processor Network Unavailable, followed by issuer-declined/different-method guidance. This is explicit sandbox processor decline, not a browser disconnection or ambiguous payment timeout. App-state persistence for this attempt remains pending.
Next: close checkout, refresh My Listings and verify same single test listing remains Drafts (Unpaid), Pay Rs. 600 available, no Paid/Under Review transition. Record app message if shown. Do not make another payment attempt yet.


### SE-03B.2 post-network-decline state - Pass by user report
User confirms same single Drafts (Unpaid) listing and Pay Rs. 600 remain after closing checkout and refreshing. Exact app message not supplied. No false Paid/Under Review state reported.
Next: SE-03B.3 sandbox Limit Exceeded on existing draft using user-supplied Visa 4929119799365646. Await gateway result; use synthetic valid name/CVV/future expiry, no real payment details. Do not automatically retry. Do Not Honor and successful payment remain pending.


### SE-03B.3 sandbox limit-exceeded decline - Gateway rejection Pass
User reports Decline Message: Limit Exceeded for guided sandbox attempt. Gateway scenario accepted; post-attempt app state remains pending.
Next: close checkout and refresh My Listings; verify same single Drafts (Unpaid) test listing with Pay Rs. 600. Await result before remaining Do Not Honor scenario or successful payment.


### SE-03B.3 post-limit-exceeded state - Pass by user report
User confirms same single Drafts (Unpaid) listing with Pay Rs. 600 after closing checkout and refreshing. No false paid transition reported.
Next: SE-03B.4 final supplied decline scenario Do Not Honor on existing draft using supplied sandbox Visa 4929768900837248. Await exact gateway result before app-state verification; do not automatically retry. Sandbox success remains next after decline coverage.


### SE-03B.4 sandbox Do Not Honor decline - Gateway rejection Pass
User reports Decline Message: Do Not Honor for guided sandbox attempt. All four supplied decline messages have now been observed; post-attempt app state for this last scenario remains pending.
Next: close checkout, refresh My Listings and confirm same single Drafts (Unpaid) listing with Pay Rs. 600 before success attempt. No new payment attempt yet.


### SE-03B.4 post-Do-Not-Honor state - Pass by user report
User confirms same single Drafts (Unpaid) listing with Pay Rs. 600 after closing checkout and refreshing. All four supplied decline scenarios now have gateway-message and post-close unpaid-state acceptance within user-observed scope.
Next: SE-03C.1 successful sandbox payment on existing draft using user-supplied success Visa 4916217501611292 and synthetic valid name/CVV/future expiry. Confirm sandbox and Rs. 600, submit once, await checkout completion and app feedback. Do not repeat payment if confirmation delayed. Backend-confirmed Paid/pending state, refresh persistence and receipt remain separate follow-up checks.


### SE-03C.1 sandbox successful payment - Gateway success reported
User reports successful payment, Payment ID 320032688288. This establishes user-reported gateway success only. Backend callback, paid status, moderation state, persistence and receipt remain unverified.
Next: SE-03C.2 let checkout finish/return, open My Listings and refresh once. Verify same single test listing no longer Drafts (Unpaid), payment button removed and pending/under-review status appears. Record exact app message/status. Do not pay again if still unpaid; diagnose callback path later if necessary.


### SE-03C.2 successful payment reflected in app - Fail
After reported sandbox success Payment ID 320032688288 and guided My Listings refresh, user reports listing still Draft (Unpaid), payment control not removed and no Pending/Under Review state. User's answer to single-listing question is ambiguous (No, Still in Draft(Unpaid)); exact visible listing count must be clarified rather than recording a duplicate.

### SELLER-08 - Gateway success does not update listing payment state
- Case: SE-03C.2; severity: High (blocks paid listing submission/moderation).
- Steps: pay existing test draft once with sandbox success fixture; gateway reports successful Payment ID 320032688288; return and refresh My Listings.
- Actual: listing remains Draft (Unpaid), Pay control remains, no Pending/Under Review transition.
- Expected: verified successful server notification updates the correct listing payment state and submits it for moderation without duplicate payment/listing.
- Root cause: unconfirmed. Ngrok callback routing/configuration, notification delivery, backend validation and persistence require diagnosis during fix batch. Checkout success alone does not prove notification delivery.
- Status: Open; fixes deferred per user workflow. Do not pay again, manually mark Paid or create replacement listing. Paid/pending moderation and receipt acceptance blocked pending resolution; other independent Seller tests may continue.
- Next: clarify exact matching listing count and whether any app error/payment-verification message appeared after checkout; preserve existing payment/draft fixture.


### SELLER-08 merchant-portal evidence and fixture clarification
User confirms same single test listing, no duplicate and no app error after payment. Screenshot of PayHere sandbox merchant portal shows payment 320032688288, status Authorized, amount LKR 600, order ID ae66900a-a7be-4612-b8cd-38026db05fb3. Record status exactly as Authorized; do not infer settlement/capture or backend notification delivery from portal entry. Customer/contact/card details intentionally omitted. Listing remains unpaid by user report; end-to-end payment synchronization still fails. No repeat payment or manual Paid override requested.
Next independent case: SE-05A.1 inspect whether unpaid draft exposes Edit in My Listings or owner View. Open View once, observe correct owner detail and any Edit control, without deleting/changing payment or status. Paid moderation remains blocked until SELLER-08 resolution.


### SE-05A.1 saved draft owner view - View confirmed, Edit unavailable
User initially answered yes to combined View/Edit question. Later clarification confirms Edit is unavailable. Prior inference that Edit was confirmed is withdrawn. Saved edit persistence remains untested.
Next: SE-05A.2 open Edit, change only description to Seller E2E test property - saved edit check, use Save/Update control, then refresh owner detail and verify changed description persists. Observe save feedback and ensure no payment requested. Do not delete or change price/category/location/media/payment status. If no editable description/save control exists, report actual UI rather than following assumed controls.



### SE-05A.2 correction - Blocked by unavailable Edit control
User clarifies unpaid test listing has no Edit button. Screenshot confirms only Pay, View and Delete on card. Source search of MyProperties.jsx finds imported Edit2 but no rendered Edit control. Payment-dependent availability has not been established; recheck supported owner editing during fix batch. Preserve paid-but-unreconciled fixture. No description save performed.
Next independent case: My Listings filters. Drafts should show the one test listing; Pending Review, Live & Approved and Needs Changes should each show empty state/count 0. Return to All Listings and verify the one draft remains. Do not delete or pay again.


### SE-01B.2 My Listings status filters - Pass
User explicitly confirms Drafts shows the one test listing, Pending Review/Live & Approved/Needs Changes each show zero and empty state, and All Listings restores the single draft. Current fixture remains unpaid despite PayHere Authorized payment (SELLER-08).
Next: SE-07A.1 read-only account isolation check. In separate private browser/session sign in as another test account, open /my-properties, and verify original Seller test listing is absent. Report account role and visible result. Keep original Seller session and paid-but-unreconciled listing intact. Do not delete or attempt another payment.


### SE-07A.1 alternate-account listing visibility - Absence observed
User reports original Seller test listing is not showing in alternate account My Listings. Alternate account role and whether listing page loaded versus redirected are not yet supplied. Do not claim full Seller-to-Seller ownership acceptance or endpoint authorization from this observation.
Next clarification: identify alternate account role (Buyer, Seller or Agent) and whether My Listings loaded or redirected. Preserve original Seller fixture for payment diagnosis.


### SE-07A.1 alternate account role confirmed
User identifies alternate account as Seller. Original Seller test listing is absent by prior report. Whether /my-properties loaded normally or redirected remains unanswered. Next confirm normal My Listings load to complete scoped Seller-to-Seller list isolation observation.


### SE-07A.1 Seller-to-Seller My Listings isolation - Pass
User confirms alternate Seller My Listings loads normally and does not show original Seller's test listing. Scoped UI list isolation accepted. Direct object/API access and mutation isolation remain untested.
Next: SE-08A.1 original Seller Dashboard and My Listings at narrow viewport (approximately 390 px using browser device toolbar). Verify navigation/menu, cards, draft banner and Pay/View controls readable/reachable without page-wide horizontal overflow. Preserve existing payment fixture. Await observation.


### SE-08A.1 mobile layout - Deferred by user
User states mobile view is not yet optimized and explicitly requests no mobile testing now. Mobile acceptance remains deferred, with no detailed defects inferred and no mobile fixes added to this batch from this statement alone.
Next: SE-04 prepayment public visibility. In signed-out/private session open Buy/public property search and search exact title SELLER-E2E-20261113 Test House. Unpaid draft should be absent from public search. Keep original Seller draft/payment evidence intact. Await result before direct-link visibility test.


### SE-04 prepayment public search visibility - Pass
User explicitly clarifies unpaid test listing does not appear in public search results during guided signed-out/private search. Direct-link visibility remains untested.
Next: original Seller opens saved test listing using View and copies property detail URL. Open that same URL in signed-out private window and observe unavailable/not-found/access-denied versus full draft details. Do not share credentials or change/delete fixture. Await result.


### SE-04 prepayment signed-out direct-link visibility - Pass
User supplies screenshot showing Property Not Found / Property not found / Browse Properties for guided signed-out direct URL of unpaid/unapproved fixture. Public detail protection accepted within this UI scope.
Next: SE-07A.2 open same property URL in the separate signed-in second Seller session. Expect unavailable/not-found/access denied, without original Seller private draft details. Await result. Keep original paid-but-unreconciled fixture for SELLER-08 diagnosis.


### SE-07A.2 other-Seller direct draft access - Pass
User reports same Property Not Found message when opening original Seller draft URL as second signed-in Seller. Combined with list isolation, cross-Seller read isolation passes within guided UI scope. Mutation/API authorization remains untested.
Next: SE-05C.1 deletion cancellation only on original Seller test draft. Click trash, inspect confirmation, cancel/dismiss, refresh and verify listing retained. Do not confirm deletion because this fixture retains unreconciled payment evidence. If delete has no confirmation and removes immediately, report result; do not repeat.


### SE-05C.1 delete cancellation - Pass
User confirms trash opens confirmation, Cancel preserves listing and refresh retains it. Confirmed deletion remains untested; preserve this fixture for unreconciled payment investigation.
Next: SE-03C receipt observation. Check Seller test email Inbox/Spam for app listing-payment receipt associated with sandbox payment 320032688288 / LKR 600. Report whether receipt exists and sender type (Thirasara versus PayHere). No personal email content or address needed. Payment synchronization remains SELLER-08 and paid moderation/edit/public handoffs remain blocked.


### SE-03C receipt observation - Not received
User reports no receipt email and suspects app unpaid state caused it. Causal link unconfirmed. Receipt acceptance remains open alongside SELLER-08 payment synchronization. Do not claim email service failure without callback/email-path diagnosis.
Next: SE-08A.2 desktop dark theme on Seller Dashboard and My Listings. Use theme toggle, inspect text/cards/unpaid banner/actions for readability and overlapping content, then restore preferred theme. Mobile remains deferred by user. Await observation before summarizing remaining blocked Seller coverage and moving to fixes.


Next-case correction: skip shared theme testing already covered in Common/Buyer scope. Instead inspect saved Seller fixture media through original owner's View: photo gallery count/content and 360 Living Room labels/viewer after refresh. If owner detail is unavailable, report that and mark saved-media acceptance blocked. Do not recreate or pay again.


### Saved owner detail/media observation
User confirms owner detail shows and supplies screenshot for property 477e4341-6476-4398-b471-7cf6416e2df1. Screenshot shows correct test title, price 25000000, 3 beds/2 baths/15 P, three-photo gallery, View 360 Tour and Manage Your Listing. Owner detail visibility and saved photo presence accepted. Actual 360 viewer rendering/labels remain unconfirmed. User asked what owner Property Not Found meant; clarify owner refers to listing-creating Seller and conditional check is satisfied by current successful owner view.
Next: click View 360 Tour, verify panorama renders, drag to look around and switch rooms if available; check saved room labels. Await result. No payment attempt/deletion requested.


### Saved owner 360 viewer - Pass
User confirms guided View 360 Tour loads saved panoramas, drag-to-look works and switching via saved room labels works. Owner saved media acceptance passes within UI scope. Public approved media handoff remains blocked by SELLER-08.
Next: inspect Manage Your Listing action on owner property detail. Close tour, click Manage Your Listing and report destination and available controls. Editing availability remains unresolved. Do not delete or initiate payment.


### Owner Manage Your Listing navigation observed
User reports Manage Your Listing opens Dashboard. This action does not expose an editor in current walkthrough. Saved-edit coverage remains blocked/unavailable; review intended destination during fix batch.
### SELLER-09 - Owner listing management action leads to Dashboard
- Case SE-05A owner management navigation.
- Actual Manage Your Listing opens Dashboard, while no saved-listing Edit control has been found.
- Expected listing-specific management destination or clearly named navigation. Editing requirements/capability need source review before deciding implementation.
- Status Open UX/functionality review, fixes deferred.
Next independent case SE-01B.3 Dashboard Inquiries and Active Buyer Chats Open Inbox links should reach messaging page without errors. Existing empty inquiry state is valid. Do not send test messages until a Seller-specific receiving fixture is available.


### SE-01B.3 Seller inbox entry points - Pass
User confirms Dashboard Inquiries and Active Buyer Chats Open Inbox both open Messages page without errors. Empty state accepted. Seller-specific incoming inquiry delivery/count updates remain untested because fixture remains unpublished.
Next SE-04A.0 unpaid moderation exclusion: use authorized Admin session, open Listings/Pending Review and search test title. Verify unpaid fixture is absent from pending approval queue. Presence in a general all-listings admin view is a separate observation and must not be mistaken for pending moderation. Do not approve/reject or modify fixture. Await result.


### SE-04A.0 unpaid moderation exclusion - Pass
User confirms test listing is absent from Admin Pending Review queue while app marks it unpaid. No moderation action performed.
### Walkthrough checkpoint before fixes
Available guided desktop checks completed through unpaid moderation exclusion. Remaining coverage includes payment synchronization/receipt, paid moderation rejection/approval and public handoff, saved editing availability/persistence, Seller inquiry receipt/counts, final deletion and direct mutation authorization. Mobile explicitly deferred. Preserve original listing 477e4341-6476-4398-b471-7cf6416e2df1 and payment 320032688288 for diagnosis. Start fix batch with SELLER-08, then resume dependent manual acceptance. Open issues SELLER-01 through SELLER-09 remain unresolved.


### SELLER-08 diagnosis and local configuration correction
Applied systematic-debugging and Supabase skills. Frontend VITE_API_URL was localhost:5000 and public notification override absent, so checkout defaulted notify_url to localhost despite active ngrok tunnel. Ngrok inspector showed no captured requests at inspection time. Set VITE_PAYHERE_NOTIFY_URL in existing ignored frontend .env to current tunnel HTTPS /api/payment/notify. Public unsigned empty POST returns 400, proving ingress reaches validation without payment mutation. Payment hook suites pass 62/62. Restarted identified Vite dev server to load config. Read-only hosted query confirms order ae66900a-a7be-4612-b8cd-38026db05fb3 maps to correct property and remains pending. Existing payment requires original provider notification redelivery/reconciliation, not another charge or manual Paid override. No hosted writes performed. Other Seller bugs remain queued.


### SELLER-08 original payment recovery prerequisite
User screenshot shows no notification resend control. Official PayHere Retrieval API supports server-side order lookup using OAuth App ID/App Secret. Existing merchant secret is checkout-signing configuration and retrieval credentials must be checked separately. Original payment remains pending locally; no synthetic provider notification or manual Paid override performed.


### SELLER-08 Retrieval API credential verification
User saved App ID/App Secret locally. OAuth token issuance succeeds with SANDBOX scope. Payment search for original order returns HTTP 403, error access_denied, description Access is denied. Verified twice with sanitized output. No payment settlement or hosted writes performed. Need inspect API key permissions/allowed domain before continuing original-payment recovery. Secret/token/customer data not logged.


### SELLER-08 original sandbox payment recovered
After user enabled Payment Retrieval API, fresh OAuth/retrieval returned status 1 with exact original order, payment 320032688288, RECEIVED, LKR 600. Re-verified provider response and locked stored property/mode/merchant/currency/amount before existing settle_listing_checkout RPC. Authorized recovery applied original payment through existing transaction/outbox path. Result order paid, property Paid/pending, already_paid false. Receipt queue drain returned sent with attempts 1 and email_sent event. No second payment or synthetic webhook used. Correct public callback config is loaded in Vite; fresh gateway callback acceptance remains a separate manual retest. Other SELLER bugs remain queued.
Next manual acceptance: original Seller refresh My Listings, verify same one listing Pending Review with payment button removed, and check receipt Inbox/Spam. Then Admin Pending Review handoff.


### SE-03C recovered payment manual acceptance - Pass
User confirms original listing now appears under Pending Review and receipt arrived. Screenshot shows Thirasara Payment Successful receipt with correct test listing title and Rs. 600. Original payment recovery and delivered receipt accepted. Fresh automatic gateway callback still requires separate acceptance; SELLER-08 configuration corrected and original order recovered, not a fresh callback pass.
Next SE-04A.1 Admin pending receipt/details. Refresh authorized Admin Pending Review, find exact test listing and inspect title/price/location/specifications/photos/360. Verify one matching listing and pending state. Do not approve/reject until details confirmed. Other Seller fixes remain queued.


### SE-04A.1 Admin pending listing/details - Pass
User confirms test listing appears in Admin panel and all details are correct following guided pending receipt/details check. No moderation action yet. Next inspect available Reject flow with identifiable reason Seller E2E - please update description, then verify Seller Needs Changes and reason after refresh. Preserve paid state and avoid deleting fixture.


### SE-04A.2 moderation rejection status handoff - Pass
User answers yes and screenshots show exact test listing Rejected / Paid & Verified in Admin and Needs Changes in Seller My Listings. Seller counts All 1, Draft 0, Pending 0, Live 0, Needs Changes 1. Payment remains recognized after rejection within displayed scope. Reason entry/visibility not established by screenshots or combined yes. Seller card shows View/Delete with no Edit.
Next clarify whether Admin rejection requested a reason and whether Seller sees entered reason in View or notification/email. Do not mark reason delivery passed or approve yet. Saved correction/resubmission remains unavailable pending edit capability review.


### SE-04A.2 rejection reason delivery - Email received, Seller UI missing
User confirms Admin reason field exists, reason is not displayed in Seller UI and email arrives. Screenshot email says property listing Seller Test A, badge contains test property title, reason displays rejected. Exact entered reason needs confirmation before claiming reason fidelity. Email instructs correction/resubmission while no editor found.
### SELLER-10 rejection reason missing in Seller UI
- Expected rejected/Needs Changes listing exposes Admin reason to owner after refresh.
- Actual user reports reason only in email. Open, fix batch.
### SELLER-11 moderation email fields appear misassigned
- Screenshot puts Seller name in property-title sentence, property title in status badge and rejected in reason box. Suspected argument-order mismatch; source diagnosis required before fix.
- Status Open, medium. Email delivery accepted, content correctness not accepted.
Next clarify exact rejection reason entered by Admin. Preserve rejected paid fixture for correction/resubmission implementation and retest.


### SELLER-10 and SELLER-11 implementation
User confirms entered reason Seller E2E - please update description. Root cause email controller passed seller name into propertyTitle, property title into status and rejected into reason. Corrected approval/rejection argument order and email approved-status recognition. Seller My Listings now renders rejection_reason on rejected cards. Controller and UI regressions failed before fixes. Focused backend 11/11 and frontend 11/11 pass; frontend lint passes. Existing email remains unchanged; newly triggered moderation emails use corrected fields. Manual Seller reason-display and new email acceptance pending. Other Seller issues remain queued.


### SELLER-10 manual retest - Pass
User confirms Seller My Listings now shows exact saved rejection reason after refresh. SELLER-10 accepted. SELLER-11 new moderation email content still awaits manual acceptance.
Next SE-04B.1 Admin approve same rejected paid test listing if Inspect exposes approval. Verify Seller Live & Approved after refresh and new approval email names correct property/status. If approval unavailable for rejected listing, report control state and keep resubmission blocked pending SELLER-09 edit work. Do not charge again.


### SELLER-09 paid rejected correction scope clarified
User explicitly requests Edit and resubmit without another payment. Existing owner PATCH already returns listing to pending and clears reason while omitting payment changes; UI entry/editor absent. Prepared focused correction design in docs/superpowers/specs/2026-11-13-paid-listing-resubmission-design.md. Design review pending per brainstorming skill before implementation. Keep current paid rejected fixture for acceptance; do not bypass correction by approving it yet.


### SELLER-09 paid rejected correction implemented - manual retest pending
User approved focused correction design. Added Edit & Resubmit on paid rejected cards with prefilled title/description/price/contact/address/town/district/specifications and rental period. Save PATCHes same listing, retains existing payment/media/geometry, clears reason and transitions to pending. Cancel and save failures retain expected state, active save disables repeat action. Partial backend updates now preserve omitted fields. Repository write constrains owner and pending/rejected state so concurrent approval produces conflict. No schema change or new payment performed.
Verification: initial backend/frontend regressions failed before implementation. Final full backend 99 suites / 1413 tests pass. Focused frontend 2 files / 15 tests pass. Frontend ESLint/build and git diff check pass, existing large chunk/Lottie eval warnings remain. Code review found no blockers; added repository guard regression and rental-period correction coverage. Restarted identified backend, readiness 200.
Next manual case: refresh original Seller My Listings, Edit & Resubmit existing paid rejected test listing, change description to Seller E2E - corrected description, Save & Resubmit once, verify Pending Review and no payment prompt. Then refresh and verify Admin pending receipt. Other Seller bugs remain open as previously logged.


### SELLER-09 manual correction/resubmission - Pass by user report
User confirms guided My Listings refresh, Edit & Resubmit, description change to Seller E2E - corrected description and Save & Resubmit returns existing listing to Pending Review without asking for payment. Saved refresh persistence and Admin receipt of corrected description remain next acceptance checks.
Next SE-04A.3 refresh Seller My Listings to verify one pending listing persists, then Admin Pending Review refresh and Inspect same test listing. Verify corrected description, retained photos/360 and Paid & Verified. Do not approve yet; await result before approval-email/public handoff.


### SE-04A.3 corrected resubmission persistence/Admin handoff - Pass
User confirms Seller refresh retains one pending listing, Admin Inspect shows Seller E2E - corrected description, retained photos/360 and Paid & Verified. Correction/resubmission acceptance complete within guided scope.
Next SE-04B.1 approve exact resubmitted test listing once as Admin; Seller refresh should show Live & Approved with no payment control. Check new approval email exact property title, Approved status and approval copy to manually accept SELLER-11. Await result before public discovery/inquiry tests.


### SE-04B.1 approval handoff - Status Pass, email receipt pending
User confirms Seller Live & Approved but reports no new approval email. Local backend log shows approval PATCH 200 and three email_sent events around 2026-11-13 18:28:50 UTC, with saved-search matchCount 2, consistent with two search alerts plus seller moderation email. No email_delivery_failed in inspected log. SMTP send acceptance does not establish inbox delivery. Exact corrected approval email subject is Your Property is Approved!. Next user checks Seller mailbox via in:anywhere subject search before considering any resend; no repeated moderation or email mutation performed.


### SE-04B.1 approval email located - Delivery Pass
User confirms approval email found using Gmail in:anywhere subject search. Initial missing-email report resolved as email located; no resend or repeated moderation needed. Corrected title/status/body content remains next manual acceptance for SELLER-11.
Next open located approval email and verify exact title SELLER-E2E-20261113 Test House, approved status and live-listing approval wording. Await result before public discovery handoff.


### SELLER-11 approval email content retest - Pass
User confirms located approval email has correct test property title, Approved status and live-listing approval message. Approval email content fix manually accepted. Corrected rejection email content still requires a new rejection event if that path is retested; automated template/controller coverage passes.
Next SE-04B.2 signed-out public discovery: in private session open Buy, search exact test title, verify one correct approved listing, open detail and compare price 25000000, location/address, bedrooms 3/bathrooms 2, current saved areas and photos/360. Begin with discovery/detail identity; await result before inquiry handoff.


### SE-04B.2 approved public discovery/detail - Pass
User confirms guided signed-out Buy search shows one correct approved test listing and public detail matches price/location/specifications/photos/360. Public handoff accepted within guided scope.
Next SE-06A.1 Seller-specific inquiry delivery: separate signed-in Buyer opens approved test listing and sends one identifiable message Seller E2E inquiry check using property contact/chat entry point. Original Seller opens Inquiries/Inbox and verifies correct Buyer, test property context and exact message. Buyer common chat mechanics already covered, so focus this handoff on Seller recipient and property context. Await result before reply/count check.


### SE-06A.1 Seller inquiry receipt - Pass
User confirms guided Buyer message Seller E2E inquiry check reaches original Seller Inbox with correct Buyer/property context. Next SE-06A.2 Seller replies Seller E2E reply check in same thread, Buyer verifies receipt and both refresh for persistence. Then inspect Seller Dashboard Active Buyer Chats entry for correct Buyer/property. Conversation-count semantics remain separate; do not equate thread count with unread messages.


### SE-06A.2 Seller dashboard inquiry entry - Pass
User confirms correct Buyer/test-property Active Buyer Chats entry and click-to-Inbox navigation after refresh. Screenshot shows Live Listings 1, Under Review 0, My Listings 1, Inquiries 1, portfolio Rs 25.0M, views 11 and saves 0. Do not interpret Inquiries count as unread count. Shared Buyer chat reply/attachments are not repeated. Static engagement remains SELLER-01 open.
Next SE-04B.3 public map placement. Search exact approved test listing via Map Search and open its pin/card. Verify pin selects same title/price and map position matches saved Seller location. Report missing/misplaced marker or wrong linked property. No geometry changes requested.


### SE-04B.3 approved public map placement - Pass
User confirms map pin matches saved Seller location, card shows correct test title/25000000 and opens same property detail. Public map handoff accepted.
Next SE-05C.2 final deletion on disposable approved test listing. Original payment reconciliation is complete and order/payment identifiers retained in log. From owner My Listings delete exact SELLER-E2E-20261113 Test House and confirm once. Observe response and refresh My Listings to verify removal. Do not retry on error or remove other listings. Public/favorite/chat aftermath checked only after outcome. Fresh automatic callback still pending on a separate disposable fixture; other fixes queued.


### SE-05C.2 confirmed deletion - Fail
User screenshot shows Failed to delete property and approved test listing remains visible. Backend log confirms owner DELETE /my-listings/:id returns 500. Current repository physically deletes properties before image cleanup. Reviewed payment-orders.sql defines payment_orders.property_id REFERENCES properties(id) ON DELETE RESTRICT, and original checkout is known to reference this property. Paid-checkout FK restriction is the leading cause; exact live constraint/error code not independently queried. Do not replay deletion or delete financial history to bypass it.
### SELLER-12 paid listing deletion fails
- Severity Medium, blocks owner removal of paid listing.
- Expected owner can remove listing from active/public views while retaining payment/transaction history.
- Actual generic 500 and failed-delete toast.
- Status Open. Needs reviewed archive/soft-delete design or another history-preserving model before schema change. Hosted SQL remains owner-applied. Original approved fixture retained. No additional delete replay performed.


### SELLER-12 soft-delete implementation and owner rollout pending
User approved soft delete. Implemented deleted_at archival for owner/admin, active listing visibility across owner/public/Admin/AI/favorites/agent views and Go search/cache. Payment and chat history/media retained; new activity guarded in SQL. Reviewer found no confirmed blockers; hardened reference guard for property_id reassignment too. Local Docker runtime failed WSL startup; user explicitly requests skipping Docker and receiving hosted SQL. No hosted schema writes or listing archive performed by assistant. SQL file docs/database/phase7-property-soft-delete.hosted-review.sql must be applied by owner before Node/Go restart. Existing server still uses pre-rollout backend code. SQL runtime validation remains unrun by user choice.


### SELLER-12 owner SQL adoption and local rollout
User screenshot reports new_activity_guards 3 after running hosted-review SQL. Read-only hosted API lookup independently confirms deleted_at exists and original test listing remains active (null). Go updated binary built successfully. Restarted identified Node 5000 and Go 9090 processes to load soft-delete behavior. No assistant archive mutation; await guided user deletion retest. Other policy/index/trigger live definitions not independently queried. Docker runtime skipped per user instruction.


### SELLER-12 service readiness verified
Node /health/ready and Go /health/ready both return 200. Go required project-root working directory to load existing root .env DATABASE_URL, corrected after first launch failed without local env. New Go binary now running with updated active search/cache filtering. Next user refresh My Listings, delete exact disposable test listing once, confirm and refresh. Verify success/removal before public visibility and retained-history checks.


### SELLER-12 manual delete retest - Pass by user report
User reports successful deletion after soft-delete rollout. Supplied screenshot shows pre-delete native browser confirmation with history-retention wording; disappearance after refresh is accepted from guided yes/success report, not screenshot alone. Public removal and retained-history verification remain pending.
### SELLER-13 native delete confirmation presentation
User flags browser localhost confirmation popup appearance. Replace native window.confirm with consistent in-app confirmation dialog, retaining explicit action/cancel and history-retention explanation. Low severity UI issue; cancellation/duplicate-click/error behavior must be preserved. Open for UI fix batch, related to SELLER-07 panorama alert consistency.
Next signed-out public removal check: search test title in Buy and Map Search, then open saved direct URL. Expect no result/pin and Property Not Found. No new delete attempt requested.


### SELLER-12 public removal and retained-history acceptance
User confirms signed-out Buy/Map Search no longer show deleted fixture and direct URL returns Property Not Found. Read-only hosted checks confirm property deleted_at populated, payment_status Paid, original payment order paid with provider ID 320032688288, one transaction and one conversation retained. Soft-delete removal/history persistence accepted for this fixture. Existing chat UI continuity and new archived-property activity rejection remain separate manual cases.
Next original Seller and Buyer open existing Seller E2E inquiry thread. Verify earlier messages/property context remain readable after listing removal. Do not create a new inquiry or repeat shared attachment tests.


### SELLER-12 existing chat continuity - Pass
User confirms Seller and Buyer can read earlier inquiry messages and property context after soft deletion. Historical chat UI retention accepted.
Next final inventory-count check: original Seller Dashboard/My Listings refresh should show My Listings 0, Live Listings 0, Under Review 0 and portfolio value 0; Admin normal active listings should no longer contain exact test title. Historical inquiry count may remain because conversation intentionally retained. Static weekly chart remains open SELLER-01.


### SELLER-12 final inventory counts - Pass
User confirms Seller My Listings/Live/Under Review and portfolio reset to zero, and Admin active list excludes archived fixture. Screenshot confirms zero active listing metrics and retained inquiry. Soft-delete manual acceptance closed for removal, history, chat continuity and active counts.
### Remaining fix checkpoint
Open fixes SELLER-01 real weekly engagement, SELLER-02 contact validation, SELLER-03 immediate GPS recenter, SELLER-04 stale upload errors, SELLER-05 negative specification validation, SELLER-06 price overlay contrast, SELLER-07 panorama native alert and SELLER-13 delete native confirmation. SELLER-08 original payment recovery accepted but fresh callback manual acceptance remains open. SELLER-09/10/12 guided acceptance passed. SELLER-11 approval email accepted; new rejection email content not manually retested. Mobile deferred. SQL concurrency runtime scenarios remain unrun per owner choice.


## 2026-11-14 remaining fixes implementation checkpoint

- SELLER-01 implemented. Seller-scoped endpoint reads paginated daily view buckets and new property inquiry threads using Asia/Colombo day boundaries. Seven current days plus previous seven; incomplete/zero prior history never produces invented percentage. Daily tracking starts at rollout, with no cumulative-view backfill. Average views/save rate retained as all-time current-listing metrics. Fixed promotional/demand figures removed.
- SELLER-02/05 implemented. Shared wizard/final-submit contact/specification checks, plus server create/update validation. Optional supported zero/empty values retained.
- SELLER-03 implemented. GPS/district map recenter occurs once per explicit request; prior GPS request does not replay on step remount.
- SELLER-04 implemented. Successful uploads clear obsolete owned feedback, with revision guards for late success/failure and newer unrelated feedback.
- SELLER-06 implemented. Review photo price has white text on dark backing.
- SELLER-07/13 implemented. Panorama count message is inline; delete uses accessible in-app confirmation with cancellation, mutation lock, retry/error and account-change safety.
- Verification: full backend 104 suites / 1432 tests pass; full frontend 67 files / 479 tests pass. Latest dashboard-only rerun 10/10 after retaining all-time metrics. ESLint and production build pass; existing large chunk and Lottie eval warnings remain. Diff check passes. Code review found and fixed stale compression failure; final review has no blockers.
- SQL rollout pending. Owner runs docs/database/phase7-seller-activity.hosted-review.sql. New private daily-count/config tables and atomic view RPC are server-controlled; no visitor identity stored. No hosted schema writes performed by assistant. Docker SQL execution skipped per user instruction, database concurrency/rollback execution remains unverified.
- Current local Node process intentionally not restarted for new analytics/validator code until SQL is applied. Vite source updates present, so weekly activity may show unavailable before endpoint restart.
- Next owner SQL result: tracking start timestamp, service_execute true, anon_execute false, authenticated_execute false. Then restart identified backend, verify activity API/readiness and guide contact validation first. Fresh automatic sandbox callback remains a separate acceptance case; mobile remains deferred. Rejection-email corrected content still awaits a new manual rejection event if retested.

### Remaining fixes SQL rollout - owner adoption
User screenshot shows service_execute true / anon_execute false / authenticated_execute false for weekly view RPC. Read-only hosted checks confirm tracking config started_at present and daily table readable. Restarted identified Node port owner with validation/activity fixes. No activity writes or new payment performed. Next manual retest: Add Property title/price/district filled but Contact Number empty, Continue must reject with contact-specific feedback. Preserve archived original fixture; use unsaved form for validation checks.


### Remaining fixes retest 1 - Empty contact validation Pass
User reports Please enter a valid Sri Lankan contact number (0771234567 or +94771234567) for guided blank-contact Continue attempt. Required-contact step validation accepted. Next retest enter 123 and Continue, confirm same rejection before testing valid recovery.


### Remaining fixes retest 2 - Invalid contact validation Pass
User reports valid-Sri-Lankan-contact message for 123. Empty/invalid contact step rejection now manually accepted. Next enter valid test contact, Continue and verify Spatial Location opens with prior contact error cleared. No listing submission requested.


### Remaining fixes retest 3 - Valid contact recovery Pass
User confirms valid test contact clears prior error and advances to Spatial Location. SELLER-02 guided step-validation acceptance closed; final-submit/server rejection covered automatically.
Next SELLER-03 GPS retest: remain on Single Pin Location, pan map away from current area, click My GPS and allow permission. Verify map immediately moves to returned location and pin without navigating away/back. Do not reveal exact coordinates; await user result.


### Remaining fixes retest 4 - Immediate GPS recenter Pass
User confirms My GPS immediately recenters map and shows current-location pin without leaving/reentering step. SELLER-03 reported issue manually accepted. No exact coordinate audit claimed.
Next SELLER-05 Bedrooms validation: fill Town/City Kandy if empty, continue to Specs & Photos, upload one valid photo if needed and set Bedrooms -1. Click Review Property Details once and observe field-specific rejection. Do not publish/pay.

