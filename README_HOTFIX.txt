Hotfix V11.48 build chain.

Cause: V11.48 installs Resigres config 2026-FR-v3, but the legacy V11.46 consolidator rejected anything except v2.
This hotfix makes V11.46 compatible with both v2 and v3 and updates its static test.

GitHub: replace the two files while preserving their paths.
Render Build Command: node apply-v11.48-consolidated.js
Start Command: npm start
