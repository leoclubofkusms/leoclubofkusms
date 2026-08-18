---
name: Firebase public collections
description: Firestore rules needed for public admin-managed content in the club portal.
---

New public sections backed by Firestore must be added to the Firebase rules alongside the existing collections.

**Why:** Firebase denies reads to collections that are not explicitly covered, which can make a page appear empty even when the UI and admin editor are working.

**How to apply:** When adding a public collection, allow public reads and restrict writes to the configured admin email. Keep the canonical rule examples in `replit.md` and apply them in the Firebase Console.