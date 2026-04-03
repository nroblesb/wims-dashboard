
+      1: # 📊 WIMS Dashboard (wimsdash)
+      2: 
+      3: A Tampermonkey userscript that adds a live dashboard overlay to [Optimus](https://optimus-internal.amazon.com) for monitoring WIMS queue metrics in real-time.
+      4: 
+      5: ![Version](https://img.shields.io/badge/version-1.03-blue)
+      6: ![Platform](https://img.shields.io/badge/platform-Tampermonkey-green)
+      7: 
+      8: ## Features
+      9: 
+     10: - **Live Queue Metrics** — Real-time unassigned, escalated, and in-progress counts with auto-refresh every 15 seconds
+     11: - **Parent/Sub-team Hierarchy** — Organize queues into collapsible parent teams with individual sub-team breakdowns
+     12: - **Dwell Time Tracking** — Monitors oldest unassigned item age per queue with color-coded thresholds (green/yellow/red)
+     13: - **Customizable Thresholds** — Configure dwell time alert levels per sub-team via the built-in settings panel
+     14: - **Lobby Auto-Detection** — Detects currently selected WIMS lobbies and allows one-click import when adding sub-teams
+     15: - **Theme-Adaptive UI** — Automatically adapts to both light and dark mode on Optimus
+     16: - **Persistent Configuration** — All team/lobby configurations are saved to localStorage and persist across sessions
+     17: - **Drag-to-Reorder** — Reorder parent teams and sub-teams via the settings panel
+     18: 
+     19: ## Installation
+     20: 
+     21: 1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
+     22: 2. Click the link below to install the script:
+     23: 
+     24:    **[Install wimsdash v1.03](https://raw.githubusercontent.com/nroblesb/wims-dashboard/main/wimsdash-1.03.user.js)**
+     25: 
+     26: 3. Navigate to [Optimus](https://optimus-internal.amazon.com) — the dashboard will appear automatically
+     27: 
+     28: ## Usage
+     29: 
+     30: ### Dashboard View
+     31: 
+     32: The dashboard appears at the top of the Optimus page with collapsible parent team sections. Each section shows aggregated metrics across all sub-teams:
+     33: 
+     34: | Metric | Description |
+     35: |--------|-------------|
+     36: | Unassigned | Total unassigned items across all lobbies |
+     37: | Escalated | Total escalated items |
+     38: | In Progress | Total items currently assigned |
+     39: | Dwell Time | Age of the oldest unassigned item (worst across sub-teams) |
+     40: 
+     41: Click a parent team header to expand and see individual sub-team metrics.
+     42: 
+     43: ### Controls
+     44: 
+     45: | Button | Action |
+     46: |--------|--------|
+     47: | ⟳ | Force refresh all metrics |
+     48: | ⚙ | Open/close settings panel |
+     49: 
+     50: ### Settings Panel
+     51: 
+     52: From the settings panel you can:
+     53: 
+     54: - **Add/remove parent teams** and sub-teams
+     55: - **Edit sub-team lobbies** — manually enter lobby codes or auto-detect from current WIMS selection
+     56: - **Configure dwell thresholds** — set green (≤), yellow (≤), and red (≥) minute thresholds per sub-team
+     57: - **Reorder** teams using the ▲/▼ arrows
+     58: 
+     59: ### Dwell Time Thresholds
+     60: 
+     61: | Color | Meaning |
+     62: |-------|---------|
+     63: | 🟢 Green | Dwell time is within acceptable range |
+     64: | 🟡 Yellow | Dwell time is approaching the limit |
+     65: | 🔴 Red | Dwell time has exceeded the limit |
+     66: 
+     67: Leave threshold fields empty to disable color coding for a sub-team.
+     68: 
+     69: ## Default Teams
+     70: 
+     71: The script comes pre-configured with these parent teams:
+     72: 
+     73: - **C2C** — Click-to-Call queues (thresholds: ≤1m green, ≤3m yellow, ≥4m red)
+     74: - **Critical WIMs** — Critical priority queues (thresholds: ≤10m green, ≤14m yellow, ≥15m red)
+     75: - **High WIMs** — High priority queues (thresholds: ≤20m green, ≤29m yellow, ≥30m red)
+     76: - **Other WIMs** — Additional monitoring queues (no thresholds)
+     77: 
+     78: All defaults can be fully customized via the settings panel.
+     79: 
+     80: ## Changelog
+     81: 
+     82: ### v1.03
+     83: - Fixed infinite fetch loop caused by dashboard's own API calls triggering the fetch interceptor
+     84: - Fixed lobby auto-detection being overwritten by dashboard's own requests
+     85: - Fixed `parentDwellColor` threshold logic skipping the yellow range
+     86: - Fixed potential crash when dwell data has null `creationEvent`
+     87: - Added light mode support — dashboard now works in both light and dark Optimus themes
+     88: - Improved error handling in fetch operations
+     89: 
+     90: ### v1.02
+     91: - Added parent/sub-team hierarchy with collapsible sections
+     92: - Added dwell time tracking with customizable thresholds
+     93: - Added lobby auto-detection from current WIMS selection
+     94: - Added settings panel with team management
+     95: - Added team reordering
+     96: - Theme-adaptive UI matching Optimus native tiles
+     97: 
+     98: ## Author
+     99: 
+    100: Created by Jeffrey Robles Bataz ([@nroblesb](https://phonetool.amazon.com/users/nroblesb))

Creating: /workspace/README.md
