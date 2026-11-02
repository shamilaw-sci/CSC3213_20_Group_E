# Specs & Photos inventory — 2026-11-01

Initial Step3 inventory followed Step2 acceptance. Specification fields and HD presentation are now extracted; media handlers,360 rendering and navigation remain in [AddProperty.jsx](../../frontend-react/src/pages/AddProperty.jsx), with state/submission in [usePropertyForm](../../frontend-react/src/hooks/usePropertyForm.js). Fields/HD browser acceptance and the rest of Step3 remain pending.

| Visible area | Existing contract |
| --- | --- |
| Bedrooms/bathrooms/house size | Hidden for Land; raw native name/value changes |
| Land size | Visible for House or Land; hidden for rentals |
| Description | Four-row textarea, original raw handler |
| HD upload | image/*, multiple; reject any file above5MiB before count check; maximum8 including existing files |
| Compression | Promise.all; maxSizeMB1.2, maxWidthOrHeight1920, useWebWorker true; append compressed files/URLs in input order after full success |
| HD previews | Index keys; first preview PRIMARY; removal immediately revokes selected URL and filters aligned files/URLs |
| HD cleanup | Parent ref tracks current preview URLs; page unmount revokes remaining URLs; step navigation alone does not unmount the page |
| 360 upload | JPEG/PNG input; reject above5MiB before maximum5 count alert; append files with default room metadata |
| 360 preview/labels/remove | URL.createObjectURL runs during render; label updates metadata by index; removal filters aligned files/metadata without URL revocation |
| Storage meters | Parent sums file sizes;50MiB HD /25MiB tours; progress capped100%; display thresholds are not additional upload rejection rules |
| Review / Previous | Original parent handlers; review requires at least one HD photograph; tour optional |

Known risks to characterize before media extraction: mixed-success compression may create URLs before another promise rejects; concurrent upload batches use their current closure for count checks; input reset/reselect semantics are unchanged. Do not add URL memoization, cancellation, MIME/aspect validation, aggregate byte enforcement or cleanup corrections inside presentation extraction.

Existing integration tests cover one HD preview/removal, oversized-file rejection, compression failure, mocked multipart/tour label flow and ordinary-photo page-unmount cleanup. They do not exhaust upload-count boundaries, promise completion ordering/partial failures, repeated selection, multiple removals/metadata alignment,360 render-time URL creation or step/page URL lifecycles.

Recommended sequence: specs fields first, HD presentation second,360 presentation third. Characterize media lifecycle before the relevant extraction; retain all handlers/effects/state and render-time URL ownership unless a separately approved behavior change is requested. This subdivides Step3; the phase remains two wizard steps pending, with potentially multiple batches per step.

Fields-only implementation now exists in [PropertySpecificationFields.jsx](../../frontend-react/src/components/property/create/PropertySpecificationFields.jsx). Five new actual-parent scenarios strengthen the wizard/hook suite from29 to34 tests, passing against original and extracted source. Independent spec/quality review and exact source preservation proof passed. The unused test import found in review was removed and lint passed. Media/navigation markup and all lifecycle code remain unchanged. Browser appearance/native-focus checks are pending because browser tooling is unavailable; Step3 is not marked accepted/complete.

HD presentation is implemented in [HDPhotosSection.jsx](../../frontend-react/src/components/property/create/HDPhotosSection.jsx). Original upload/compression/removal/cleanup/storage logic and360 rendering remain in the parent. Six additional actual-parent media scenarios protect limits/precedence, async ordering, removals, navigation/unmount cleanup and existing resource leaks. Distinct output File identities and visible storage totals protect remaining membership, but the total alone does not distinguish remaining file order; no new listing submission occurs. Focused40/40; browser appearance/focus remains pending.

Tour upload/storage shell is now extracted into [VirtualToursSection.jsx](../../frontend-react/src/components/property/create/VirtualToursSection.jsx). Original conditional preview/room/removal rows remain literal parent children to preserve render-time URL behavior. Parent upload/state/effects/navigation and all other sections are preserved. User accepted prior fields/HD implementation; this does not imply browser verification occurred. No resource leak fix was included.
