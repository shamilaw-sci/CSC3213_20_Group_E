# HD photo presentation extraction

Owner continued the discussed preservation-first Step3 work, requesting efficient focused verification. Work in current checkout without git mutations.

Scope: original High-Definition Photographs upload/previews and HD Storage Used siblings only. Create components/property/create/HDPhotosSection.jsx as a stateless fragment. Parent retains motion root,31 non-render statements, upload/compression/removal/cleanup, hook and all other fields/360/navigation/map markup.

Seven props: imageCount={images.length}, previewUrls={previewUrls}, onUpload={handleImageUpload}, onRemove={removeImage}, currentSizeMB={currentHDSizeMB}, maxSizeMB={MAX_HD_MB}, progress={hdProgress}. Copy original markup, replacing only these references. Preserve input ID/label association, image accept/multiple, keys, index removal, PRIMARY, labels/classes/conditions/progress styles/native types/events. No URL creation/lifecycle, defaults, validation or style fixes. No generic widgets.

- [x] Preserve current parent and exact media subsection privately; confirm six existing media characterization tests pass before extraction (already recorded by implementer).
- [x] Extract only specified siblings; remove only newly unused icons; add executable exact reconstruction proof for parent outside scope/module markup/hook bytes.
- [x] Run media + wizard focused tests and changed-source lint, then independent source/spec/quality review; resolve findings before aggregate.
- [x] One final full frontend run, lint/build and hygiene; retain browser visual/focus as pending if tooling remains interrupted. Update owners/checkpoint without claiming full Step3 acceptance.

No real services, dependencies, environment, behavioral corrections, staging/commit/push. Evidence remains untracked. Known HD/tour resource leaks remain recorded, not fixed.

Runtime/source gates complete; visual/native-focus gate remains pending. No full Step3 acceptance claim.
