# AI database tool input boundary

Status: owner approved and implemented2026-11-03; verified with mocked dependencies and full backend regression suite. No Gemini request, real DB, account or environment file used for this batch.

## Confirmed issue

The HTTP chat validator bounds message/history, but model-produced function arguments bypass that schema. A synthetic invocation of the real aiController with mocked Gemini/Supabase returned200 while an object-valued maxPrice reached `.lte` and location filter grammar reached `.or` unchanged. This proves missing validation/query-construction control, not arbitrary SQL execution or an approved-status bypass. The properties query retains its independent status=approved condition.

Two fixed read tools exist; no database write or arbitrary SQL tool exists. Limits are five rows per tool and at most one executed tool per request. Chat is guest-accessible with optional application auth and an IP limiter. Name/role/chat history and selected tool results are sent to Gemini. Provider timeouts/output budgets, data-sharing UX and broader logging remain separate review items.

## Options

1. Recommended: validate tool arguments at the backend boundary and restrict search strings to literal human-readable characters before constructing filters. Small change with testable rejection semantics.
2. Encode every PostgREST reserved character in unrestricted strings. Wider input compatibility, but more grammar/SDK edge cases and integration verification.
3. Rely on Gemini tool declarations alone. Does not close the reproduced backend trust-boundary gap.

## Proposed behavior

Keep the two tool names, model, guest access, field projections, approved property condition, agent/seller role filter, result cap, normal text responses and property-card IDs.

Use independent Zod schemas for each tool's args. Require a plain object; reject null, arrays and unknown keys. Property location/type are optional nonempty trimmed strings (max120/max80 characters). Agent location is required with the same120-character rule. Accept Unicode letters/marks/numbers, Sinhala/Tamil joiners (U+200C/U+200D), spaces, straight/curly apostrophes, periods and hyphens; reject filter delimiters, wildcard characters, double quotes and backslashes. This deliberately treats search input as literal text and may reject unusual locality/type spellings; do not silently strip characters and search for a different location.

Property maxPrice is optional, finite numeric and nonnegative; never coerce strings/objects. Zero is a valid upper bound and must be applied. Missing property args should be represented by an explicit empty object, not silently accepting null or malformed shapes. Invalid known-tool args yield a fixed structured tool error for the model's follow-up response and perform no DB request. Unknown tool names perform no DB request and return a fixed unsupported-tool result. Do not echo rejected args in errors/logs.

Keep database searches inside the current controller unless a small validation helper materially simplifies tests; no broad AI subsystem rewrite. Successful search results retain their shape. Query/provider errors should cross the controller boundary as sanitized application errors; raw exception objects, tool args and chat contents must not be logged by this path or forwarded to the global handler. Provider error sanitization covers this controller only, not a repository-wide logger redesign. No claim of provider retry/deadline or cost-cap enforcement.

## Verification and rollout

Mock SDK and DB; run actual controller cases for valid tools, empty property search, zero price, Unicode/apostrophe/hyphen inputs, null/array/missing/unknown args, nonfinite/non-numeric/negative prices, length limits, delimiters/wildcards, unknown calls, provider/query failures and unchanged ordinary replies. Assert invalid tool calls make zero DB calls and private markers do not reach logs/global errors. Keep approved status, role filters, explicit projections and result limits in positive query assertions. Demonstrate failures on current code before implementing. Then run focused/full backend checks and independent review. No real provider/network/DB call, frontend change, dependency update, schema change, stage/commit/push/deploy.

Actual evidence:77 focused cases initially69 failed/8 passed. First implementation76 passed/1 failed because Sinhala text contains a joiner; allowing safe joiners corrected the language compatibility issue. Final focused77/77 and full backend908/908 across64 suites passed. Independent bounded review found no actionable defects. Syntax/whitespace/index checks passed. Optional coverage gaps: prototype-named unknown tools, agent-specific returned/thrown query failures and missing API-key sanitization. Real provider/HTTP acceptance, deadlines, output budgets and broader AI privacy/authorization review remain open.
