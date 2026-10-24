# Script Call

**0.3.5 adds recoverable shooting-day management and a calendar-week overview.** It retains local bug/crash reporting addressed to alexanderhosier@squidproductions.org, with review before sharing and mail-draft/copy/export choices. Stable 0.3.5 is signed/notarized and passed the real 0.3.4 → 0.3.5 native upgrade and unmodified old/new production-feed checks. See [REPORTING.md](REPORTING.md) for privacy and tests.

A Squid Productions Software

Script Call **0.3.5** is local-first Electron software for production records, daily call sheets, schedule and cast/crew calls, G-Casper-style front/back layouts, Original Narrative templates, PDF export and immutable issued revisions. Production Desk project import and reviewed three-way reimport are included. Existing demo scene/shot IDs, project formats and template choices are preserved.

## Run locally

On this prepared Apple Silicon workspace, double-click **Start Script Call.command**. **Start Call Sheet.command** remains a compatible launcher. Both use the existing `.local-data/` folder. The local app is `build/mac/Script Call.app`. This build is ad-hoc signed for local testing, not a notarized distribution release.

From a clean checkout, use Node.js 24 or newer and npm:

```sh
npm ci
npm start
npm test
npm run test:desktop
npm run test:gcasper
npm run test:import
```

Desktop tests require Playwright (`CALLSHEET_PLAYWRIGHT` can point to an installed Playwright module) and an Electron executable (`CALLSHEET_ELECTRON`). For this prepared workspace `npm run build:mac` repackages the verified `.runtime/electron` runtime. For a release build use `npm run build:release:mac` or `npm run build:win` with the established signing environment. See [RELEASING.md](RELEASING.md).

## Data compatibility

The native app ID remains `org.squidproductions.callsheet.prototype`. The default profile remains **Call Sheet Prototype** under the OS application-data directory; its projects remain in `local-projects/`. `CALLSHEET_DATA_DIR`, the `callsheet://` origin, SQLite schema, database name and `.callsheet` archive format are unchanged. Branding does not move or rewrite existing stores. The desktop launcher continues using `.local-data/` in this folder.

Production Desk imports are previewed before commitment, backed up before changes, and merged against the prior imported baseline. Manual edits, explicit blanks, saved layouts and issued days win. Original issued PDF bytes remain in SQLite and portable archives. Keep the original `.productiondesk` export for its embedded original PDF attachments. A changing import never auto-issues a sheet. No real productions, output PDFs, private samples, development sibling snapshots or local profiles are tracked in this repository.

## Updates

The updater implementation uses `electron-updater`, an Ed25519-signed metadata envelope and SHA-512 artifact verification. It checks only compatible stable versions for the current platform and architecture, refuses downgrades, and requires native code-signature checks. Automatic checks run after startup and daily when enabled; download and restart require a choice. Installation flushes pending edits and makes a SQLite backup. Failed or offline checks keep the current app usable.

**The source is public under MIT and the approved update endpoint is configured.** Notarized **0.3.5** passed all 15 real signed 0.3.4 → 0.3.5 native upgrade checks. They preserved an unsaved edit, template choice, exact issued PDF bytes, import IDs and local edits, demo/images, actual recovery backup contents and update preferences, and verified reporting plus shooting-day warning suppression/reset across restart. Version 0.3.2 remains superseded/prerelease. Windows signing/runtime remain unverified. The approved per-app Ed25519 key remains in the local login Keychain; only its public key ships. Clients contain no GitHub token. Source commits do not ship an update. [Release instructions and blockers](RELEASING.md) describe the complete preparation and publication commands.

The fictional Last Light fixture is the shared released Squid Productions example: 8 scenes, 16 shots, 3 shooting days, scene 8 unscheduled. Quiet Hours remains a separately labeled legacy example. Third-party licenses and font notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Squid Productions’ original code and included fictional demos are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for unchanged third-party font/dependency licenses and branding notices. The Last Light demo remains included with its stable scene, shot and import IDs.

Download the [Apple Silicon Mac app](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip) (macOS 13+) or read the [0.3.5 release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.5). Older prototypes need one manual installation to establish update trust. The existing workspace launcher retains `.local-data`; a currently running 0.3.3 app can install this update through its existing updater. Existing update-enabled installations can use **Check for updates → Download update → Save, back up & restart**.

## Shooting day management

Use a shooting day's right-click menu, Shift+F10, or its **⋯** button to **Change Date** or **Delete**. Date edits retain the stable day/source IDs and all contents; only that day's weather approval resets. Issued snapshots and original PDF bytes stay frozen. The sidebar/overview sort by date, keeping production order for equal dates; the underlying source schedule order is retained.

Deletion moves the complete day into **Deleted days**, saved with the project and its portable archive. It leaves production registers, other days and all issued revisions intact. Restore is available after reopening; **Undo day change / Redo** cover date/delete/restore operations during the current project session. The last day can be deleted, leaving an empty production that accepts new or restored days. Archives containing deleted days require reader version 3 so older clients refuse them safely.

Deletion confirmation starts enabled. **Don't show again** is remembered only after a successful confirmed deletion. **Settings & help → Reset Warnings** restores it. This preference is local to the app profile.

The four-pane icon beside **Shooting Days** opens every active day in scrollable week strips. Weeks run Monday–Sunday, display their date range and skip weeks without shooting dates; undated records have their own group. Choosing a week selects its first day; choosing a particular day reveals its week and page. The sidebar shows at most seven records, with additional paging for multi-unit weeks. **Show selected day** returns to an off-page selection. Week/page/selection are remembered per production.

For isolated Mac QA, build with `python3 tools/package_mac.py --preview --out "build/shooting-days-preview/Script Call.app"`, then open **Start Shooting Days Preview.command**. The bundle embeds dedicated storage for direct launch, including settings, logs, crash diagnostics and backups, and blocks update downloads/install. It must remain in its development checkout. The regular installed app and launchers are separate. Run `node --test tests/*.test.cjs` and `node tests/shooting-days-desktop.cjs`; desktop dependencies use the existing `CALLSHEET_PLAYWRIGHT` override. Nothing in this development workflow publishes a release.

## Cast and crew availability (local development)

In **Production Data → Cast / Crew**, choose **Cast availability / Crew availability** beside Add. The spreadsheet shows every calendar date, including days off, with a 14-day navigator, date jump, person search and paged person rows. Sticky date/person headers and arrow-key navigation keep long productions manageable. Availability is attached to stable person IDs and production-local calendar dates; names and shooting-day dates do not reassign it. Dates outside the current shoot span and removed-person records are retained for recovery.

Choose **Unknown / not entered**, **Available all day**, **Unavailable**, or up to twelve time windows per date. Window ends are exclusive: 09:00–12:00 covers an assignment ending exactly at 12:00. Use **Ends next day** for overnight windows. A next-day Unavailable entry overrides availability carried from the preceding night. Unknown time is advisory and never silently becomes confirmed availability or a hard conflict. Save explicitly in the cell editor; Cancel leaves the register unchanged. Availability undo/redo is available during the current project session.

Set the **production default timezone** before using the checks. Calls and schedules are interpreted in their shooting-day timezone and converted to production-local availability dates, including overnight and daylight-saving transitions. Ambiguous/skipped local times remain unknown for availability checking. Ordinary date/time validation at issue review is unchanged.

Daily cast/crew rows turn red and show a text/icon warning when a known assignment conflicts. The daily warning panel explains the person, production date/time and allowed window. These are planning advisories: they do not change times or block saving. Personal call inherits the day's general call when blank; preparation and timed assigned cast scenes are checked through their full duration. Continuous duty extends through the last assigned scene or release; breaks do not release a person. Crew use their explicit **Release / end**, or estimated wrap and scheduled work when release is blank. Earlier release clock time means the following local day. Missing calls, untimed scenes or missing release/end keep the result unknown rather than confirmed green. Changing times, dates, schedules or the register recalculates the advice.

The register stays with save/reopen and portable project copies. Production Desk import/reimport retains manual availability without inferring availability from unsupported source fields. Legacy projects/archives still load; archives containing availability require reader version 4 so older apps refuse them safely. Existing issued snapshots and original PDF bytes remain untouched. Availability warnings are editor/review advice, not added to preserved PDFs.

Build a separate preview with `python3 tools/package_mac.py --preview --out "build/availability-preview/Script Call.app"`. **Start Availability Preview.command** opens only that local preview with dedicated project/settings/log/backup storage. For automated QA set `CALLSHEET_PREVIEW_HIDDEN=1`; this affects preview builds only, keeps the window hidden and avoids competing with other Mac GUI work. `npm run test:availability` exercises synthetic data in disposable profiles. No release or installed-app replacement is part of this development change.
