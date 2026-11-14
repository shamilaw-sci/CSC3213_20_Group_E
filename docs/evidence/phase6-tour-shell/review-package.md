# Tour shell review package

The extraction moves the existing 360 upload and storage shell into `frontend-react/src/components/property/create/VirtualToursSection.jsx`. Its five props are `onUpload`, `currentSizeMB`, `maxSizeMB`, `progress`, and `children`. The original conditional rows remain literal JSX in `AddProperty.jsx`; their render-time object URL calls, index keys, metadata handlers, and removal handlers remain in the parent.

Run `python docs/evidence/phase6-tour-shell/verify-reconstruction.py` from the repository root. It reconstructs the original parent byte-for-byte, checks the transformed shell byte-for-byte, and compares the hook with its snapshot. The original rows are included directly in the reconstruction, so they are also checked byte-for-byte. This comparison covers all parent statements and other sections.

Verification: reconstruction passed; six focused wizard test files passed (40 tests); ESLint passed on both changed source files. The proof failed as expected before the component existed. Browser visual and focus evidence has not been performed. The full suite, full lint, and build remain for the root review and aggregate closeout.
