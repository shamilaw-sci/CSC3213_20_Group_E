# Legacy SQL reference archive

These fourteen files were moved byte-for-byte out of supabase/migrations during Phase 4. Their original paths and SHA256 hashes are recorded in source-map.json. They are historical fragments, not a runnable migration chain; do not replay them against an existing or empty database.

The canonical fresh isolated chain is now in supabase/migrations. It consolidates the captured actual schema and reviewed isolated-target differences described in ../phase4-state-comparison.md and ../phase4-baseline/README.md. Original P2 review/verification SQL remains separately in ../p2-review/ and must not be copied into the chain.

No legacy file was dropped from the archive, no database history was rewritten and no live SQL was applied. Existing installations must follow the separate adoption procedure; an absent migration ledger is not permission to replay the new baseline.
