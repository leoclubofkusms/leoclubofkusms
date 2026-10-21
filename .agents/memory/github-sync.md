---
name: GitHub sync
description: Safe push workflow when this workspace and GitHub main have diverged.
---

When this project’s local branch is behind GitHub, fetch and integrate the remote commits before pushing. Do not force-push to bypass divergence.

**Why:** GitHub `main` advanced independently while this workspace had local work, and the changes overlapped in several portal files. A force-push could have removed newer project work.

**How to apply:** Before pushing a substantial change, fetch the target branch, inspect divergence and overlapping files, merge/rebase without discarding either side, then run the portal checks again.
