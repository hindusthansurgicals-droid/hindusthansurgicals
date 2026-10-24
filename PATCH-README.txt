HINDUSTHAN SURGICALS — PATCH 4.3.1

Included changes
- Bumped application version to 4.3.1 in the existing project files.
- Updated public/sw.js to hs-v4.3.1, calls skipWaiting(), claims clients, and keeps the existing network-first navigation behavior. It intentionally does not cache Firestore data.
- Added a Firestore users/{uid} session marker and client listener in public/fb.js.
- Added a narrowly scoped users/{uid} rule while retaining existing rules for existing collections.
- Updated version query parameters in index.html.

IMPORTANT SAFETY / COMPLETION NOTES
- This patch does NOT migrate the existing `bill` collection to `bills`; doing so safely requires a schema-aware migration and verification against live data. Existing collection names and old records are retained.
- Branch assignment, branch-specific query filtering, and branch theme/dropdown are NOT fully implemented in this patch. Do not represent this ZIP as completing those requirements.
- The session lock writes users/{uid}.currentSession. Deploy the updated rules before testing; if your Firebase rules are managed elsewhere, merge the rule change rather than blindly replacing production rules. The lock is client-side and is not a substitute for authorization rules.
- Test with a staging Firebase project first. Confirm staff/owner permissions and all existing features before deploying. Back up Firestore before any migration.
- No live Firebase deployment or end-to-end test was performed here.

Deployment
1. Keep a complete Firestore export and a copy of the current project.
2. Review the diff.
3. Deploy rules to a staging project and test login on two devices.
4. Test bill creation, stock, customers, filling, attendance, imports and backup/restore.
5. Only then deploy to production.
