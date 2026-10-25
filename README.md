# Script Call

**0.3.8 makes Add Day default to the next calendar date after the final production day.** Manual date editing and Duplicate Day remain available. It retains confirmed recoverable production deletion/restore, cast/crew availability, shooting-day management/week overview, both templates, Production Desk import, immutable issued PDFs, portable projects, local reviewed reporting and signed updates. New productions start blank; existing saved/imported projects remain supported. The exact signed/notarized build passed 101 unit checks, 88 Mac UI checks, packaged smoke and all 19 real 0.3.7 → 0.3.8 native-upgrade checks. See [RELEASING.md](RELEASING.md) for evidence and platform limits.

A Squid Productions Software

Script Call **0.3.8** is local-first Electron software for production records, daily call sheets, schedule and cast/crew calls, G-Casper-style front/back layouts, Original Narrative templates, PDF export and immutable issued revisions. Production Desk project import and reviewed three-way reimport are included. Existing project records, scene/shot IDs, project formats and template choices are preserved.

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

**The source is public under MIT and the approved update endpoint is configured.** Notarized **0.3.8** passed all 19 real signed 0.3.7 → 0.3.8 native-upgrade checks. Pending edits, exact issued PDF bytes, imported IDs/local edits, availability, backup contents and preferences survived. Production recovery records created before the upgrade remained restorable afterward. Appended date defaults, cancel, repeated additions and reopen were tested after actual native replacement. Windows, Intel Mac and Linux distribution remain unvalidated. Only the public Ed25519 key ships; clients contain no GitHub token. Source commits do not ship an update. [Release instructions](RELEASING.md) describe preparation and publication.

Fresh profiles start with one blank production and an empty shooting day. Bundled Last Light and legacy Quiet Hours demos and their load buttons have been removed. Existing saved/imported example-derived productions remain intact and loadable. Regression fixtures live under `tests/fixtures/` and are excluded from app resources. Third-party licenses and font notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Squid Productions’ original code and test-only fictional fixtures are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for unchanged third-party font/dependency licenses and branding notices. The test-only Last Light fixture retains its stable scene, shot and import IDs for compatibility checks.

Download the [Apple Silicon Mac app](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip) (macOS 13+) or read the [0.3.8 release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.8). Older prototypes need one manual installation to establish update trust. The existing workspace launcher retains `.local-data`; a currently running 0.3.3 app can install this update through its existing updater. Existing update-enabled installations can use **Check for updates → Download update → Save, back up & restart**.

## Shooting day management

Use a shooting day's right-click menu, Shift+F10, or its **⋯** button to **Change Date** or **Delete**. Date edits retain the stable day/source IDs and all contents; only that day's weather approval resets. Issued snapshots and original PDF bytes stay frozen. The sidebar/overview sort by date, keeping production order for equal dates; the underlying source schedule order is retained.

Deletion moves the complete day into **Deleted days**, saved with the project and its portable archive. It leaves production registers, other days and all issued revisions intact. Restore is available after reopening; **Undo day change / Redo** cover date/delete/restore operations during the current project session. The last day can be deleted, leaving an empty production that accepts new or restored days. Archives containing deleted days require reader version 3 so older clients refuse them safely.

Deletion confirmation starts enabled. **Don't show again** is remembered only after a successful confirmed deletion. **Settings & help → Reset Warnings** restores it. This preference is local to the app profile.

The four-pane icon beside **Shooting Days** opens every active day in scrollable week strips. Weeks run Monday–Sunday, display their date range and skip weeks without shooting dates; undated records have their own group. Choosing a week selects its first day; choosing a particular day reveals its week and page. The sidebar shows at most seven records, with additional paging for multi-unit weeks. **Show selected day** returns to an off-page selection. Week/page/selection are remembered per production.

For isolated Mac QA, build with `python3 tools/package_mac.py --preview --out "build/shooting-days-preview/Script Call.app"`, then open **Start Shooting Days Preview.command**. The bundle embeds dedicated storage for direct launch, including settings, logs, crash diagnostics and backups, and blocks update downloads/install. It must remain in its development checkout. The regular installed app and launchers are separate. Run `node --test tests/*.test.cjs` and `node tests/shooting-days-desktop.cjs`; desktop dependencies use the existing `CALLSHEET_PLAYWRIGHT` override. Nothing in this development workflow publishes a release.

## Cast and crew availability

In **Production Data → Cast / Crew**, choose **Cast availability / Crew availability** beside Add. The spreadsheet shows every calendar date, including days off, with a 14-day navigator, date jump, person search and paged person rows. Sticky date/person headers and arrow-key navigation keep long productions manageable. Availability is attached to stable person IDs and production-local calendar dates; names and shooting-day dates do not reassign it. Dates outside the current shoot span and removed-person records are retained for recovery.

Choose **Unknown / not entered**, **Available all day**, **Unavailable**, or up to twelve time windows per date. Window ends are exclusive: 09:00–12:00 covers an assignment ending exactly at 12:00. Use **Ends next day** for overnight windows. A next-day Unavailable entry overrides availability carried from the preceding night. Unknown time is advisory and never silently becomes confirmed availability or a hard conflict. Save explicitly in the cell editor; Cancel leaves the register unchanged. Availability undo/redo is available during the current project session.

Set the **production default timezone** before using the checks. Calls and schedules are interpreted in their shooting-day timezone and converted to production-local availability dates, including overnight and daylight-saving transitions. Ambiguous/skipped local times remain unknown for availability checking. Ordinary date/time validation at issue review is unchanged.

Daily cast/crew rows turn red and show a text/icon warning when a known assignment conflicts. The daily warning panel explains the person, production date/time and allowed window. These are planning advisories: they do not change times or block saving. Personal call inherits the day's general call when blank; preparation and timed assigned cast scenes are checked through their full duration. Continuous duty extends through the last assigned scene or release; breaks do not release a person. Crew use their explicit **Release / end**, or estimated wrap and scheduled work when release is blank. Earlier release clock time means the following local day. Missing calls, untimed scenes, zero/unknown scene durations or missing release/end keep the result unknown rather than confirmed green. Changing times, dates, schedules or the register recalculates the advice.

The register stays with save/reopen and portable project copies. Production Desk import/reimport retains manual availability without inferring availability from unsupported source fields. Legacy projects/archives still load; archives containing availability require reader version 4 so older apps refuse them safely. Existing issued snapshots and original PDF bytes remain untouched. Availability warnings are editor/review advice, not added to preserved PDFs.

Build a separate preview with `python3 tools/package_mac.py --preview --out "build/availability-preview/Script Call.app"`. **Start Availability Preview.command** opens only that local preview with dedicated project/settings/log/backup storage. For automated QA set `CALLSHEET_PREVIEW_HIDDEN=1`; this affects preview builds only, keeps the window hidden and avoids competing with other Mac GUI work. `npm run test:availability` exercises synthetic data in disposable profiles. Preview commands do not publish or replace the installed app; distribution uses the separate gated release workflow.

## Delete Production (local development)

**Settings & help → Delete Production** always opens a confirmation naming the selected production and explaining the full scope. Cancel leaves it active. Confirmation first saves pending edits and makes a local recovery backup, then removes only that production from the active list. Its shooting days (including deleted days), registers, schedules, calls, availability, layouts, import links, issued snapshots and original PDF bytes remain recoverable in **Settings & help → Deleted productions**. Restore retains the original identities and contents, including after reopening. Other productions, app preferences and external imported/exported files stay unchanged.

Deleting the last active production opens a new blank production. Restoring the deleted one leaves that blank production available too. Deleted productions stay in the local profile and database backups; exporting a different production does not include them. Restore a production before exporting it. No permanent purge is provided. Stale confirmations, repeated requests and saves from before a delete/restore are rejected; deletion is blocked while a PDF is being issued or when its recovery backup fails. Rapid backups use unique, ordered filenames so repeated delete/restore actions cannot overwrite a recovery copy.

Build a separate preview with `python3 tools/package_mac.py --preview --out "build/production-delete-preview/Script Call.app"`. Its embedded direct-launch profile isolates projects, settings, logs, diagnostics and backups. `node --test tests/*.test.cjs` covers store/recovery regressions. The disposable Mac UI suite is `node tests/production-deletion-desktop.cjs`; it requires the session's explicit authorization for Playwright when a CUA-only restriction is active. Release QA also runs this suite against a disposable copy of the exact signed build via `CALLSHEET_PRODUCTION_DELETE_APP`. Never point a test at a real profile or installed user app.

## Next shooting-day date

Add Day defaults to the calendar date after the final active day in production sequence, independent of the selected day or the sidebar's date sorting. Manually edit the proposed date as needed. Duplicate Day keeps its selected source date. A first day or unusable preceding date retains the existing today fallback. Date arithmetic uses calendar dates in UTC so host timezone and daylight-saving transitions cannot skip or repeat a day. Existing day dates and IDs are untouched.

The isolated preview is `build/next-day-preview/Script Call.app`, with dedicated direct-launch profile storage. Distribution follows the gated release workflow; preview builds do not update or replace installed apps.

## Crew department suggestions

Production Data → Crew keeps Department editable and adds a native dropdown with the 17 supplied department presets. Type to filter, choose with the keyboard or mouse, or enter any custom name. Escape dismisses suggestions without accepting the highlighted option; typed text follows the existing autosave behavior. Tab follows normal form order. Existing department strings and crew grouping are not normalized, and cast fields remain unchanged. Distribution follows the gated release workflow; development previews keep dedicated storage and do not replace installed apps.
