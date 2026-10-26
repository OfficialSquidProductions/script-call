# Windows parity with Script Call 0.3.16

Baseline: released source `b090a0c3243e680efcd588ddb27e2e126ec1a8ff`.
This is an implementation and acceptance plan, **not a Windows support claim**.
The Mac app, real project stores and historical releases are not build inputs.

## Architecture and implementation

Use the existing Electron 44.9.1 application, not a replacement UI. All production
editors, the sandboxed preload/IPC contract, SQLite store, archive reader/writer,
domain rules and HTML/PDF renderers are shared unchanged across platforms.
There are no Swift, AppKit or macOS-only database dependencies in application logic.
`node:sqlite` comes from Electron; no separate database runtime is installed.

Native integration remains Electron's BrowserWindow, menu roles, dialogs,
clipboard, shell and printToPDF. Installed Reross discovery is optional on both
platforms; licensed bundled Montserrat/Nunito and existing fallbacks remain.
Exact system-font rasterization need not be pixel-identical; data, content,
page bounds and functional behavior must match.

Implemented Windows foundations:

- Windows File/Help menus include Save (Ctrl+S), Close, Quit, About, Check for
  Updates and reviewed bug reporting, using the same renderer handlers as Mac.
- Suggested export names avoid Windows reserved devices and trailing dots.
- Windows explicit-store markers live beside the installation folder, with a
  per-user/path key, so replacing the app directory cannot silently reopen the
  default project store. Older internal markers remain readable. QA writes no
  marker into the real default profile. Native NSIS behavior still needs testing.
- `npm run preflight:win` is a read-only native environment check.
- `npm run build:win -- build/windows-preview-NAME` creates a native, unpacked
  development preview in a fresh checkout/build directory. It never makes an
  installer or publishes. Native architecture only, x64 or arm64. No signing key
  discovery; development executable signing is explicitly off, resource editing
  remains on, and update signature verification remains on.
- Every preview embeds a dedicated absolute profile before launch. Project DB,
  settings, Chromium storage, logs, diagnostics, crash dumps and backups stay
  there even on direct double-click launch. Update download/install is disabled.
  Do not relocate the unpacked build: rebuild in the intended test checkout.
- Build source includes all shared app/resources/production dependencies. Tests,
  private projects, developer evidence and demo fixtures are outside shipping
  file patterns. A preview config is excluded from ordinary builder inputs and
  injected only by the preview packaging hook.
- A shell-independent test runner enumerates all unit suites. POSIX permission
  assertions remain active on Mac; Windows does not pretend chmod tests prove
  ACL isolation. Directory-junction fixtures avoid requiring Windows symlink grants.

## Parity inventory and required Windows acceptance

All rows below use shared source and have existing unit/data coverage. Native
Windows acceptance is **pending** until the correct PC's task access is enabled.

| Capability | Shared implementation | Required native Windows evidence |
|---|---|---|
| Productions, records, IDs and save/reopen | `core/domain.cjs`, `core/store.cjs`, `web/app.js` | Blank/new/multiple productions, autosave, stale-save handling, relaunch |
| Shooting days/weeks/date defaults | `web/day-management.js` | Seven-day sidebar, week grid, change/duplicate/delete/restore, DST/year boundaries |
| Cast/crew and departments | `web/crew-departments.js`, `web/department-groups.js` | All printed groups/custom strings, native datalist mouse/Arrow/Enter/Escape/Tab |
| Availability and O/C | `web/availability.js` | Full spreadsheet, multiple/overnight windows, unknown/unavailable/all-day/O-C, start-only warning clear/reappear, O/C output |
| Personal calls, defaults and overrides | `web/call-defaults.js`, renderer | Cast shoot/crew general defaults, manual preservation, Advanced controls, long-list scroll/focus |
| Locations/Maps/logistics/hospital | `web/location-maps.js`, `core/map-coordinates.cjs` | Independent addresses/notes, coordinate suggestions/manual overrides, safe link opening, offline/error paths |
| Scenes and page fractions | scene management and domain | Collapse/search where available, exact eighths, partial input/Tab/Escape, linked deletion recovery |
| Lunch and solar | `web/lunch-timing.js`, `core/solar.cjs` | +6 elapsed hours, manual/reset, civil events, polar/missing events, effective zones/DST/date changes |
| Weather and display units | `core/weather.cjs`, time/temperature modules | Explicit-consent NWS/date/horizon/offline, C/F numeric mapping, AM/PM and 24h, no time reinterpretation |
| Company header image | `core/company-image.cjs`, nativeImage | Native PNG/JPEG chooser/cancel/invalid/large, contain fit, Default/None/Image persisted |
| Two-day Advance | `core/advance.cjs` | Independent next-two shooting-day data, gaps/missing days, long notes/pagination |
| PDFs and issued revisions | `core/sheet.cjs`, `core/gcasper.cjs`, Electron PDF | All four layouts A4/Letter, front/back/continuations, no clipping, exact stored issued PDF bytes after changes |
| Portable and Production Desk files | `core/archive.cjs`, `core/productiondesk.cjs` | Native dialogs, Unicode/spaced paths, legacy reader, stable imported IDs, reimport keeps manual overrides, Mac↔Windows round trip |
| Recoverable deletion/undo | record/day recovery modules, SQLite store | Named confirmation/cancel/repeat/stale selection/last item/restore, linked records, unrelated production unchanged |
| Backups and diagnostics | store, `desktop/diagnostics.cjs` | Startup/pre-mutation/upgrade backup, retained stores, crash report review/copy/export/mail fallback, user-profile ACL behavior |
| Keyboard/accessibility | shared HTML/ARIA, Electron roles | Ctrl+S, Tab order, native dropdowns, context menu equivalence, focus/scroll retention, DPI 100/150/200%, screen-reader labels |
| Updates and install/uninstall | `desktop/updates.cjs`, signed envelope policy, NSIS baseline | Approved Authenticode publisher, native signed installer, backup/save before update, genuine replacement/relaunch, preserved data/preferences/issued bytes, uninstall keeps user data |

## Milestones and gates

1. **Shared source and safe developer build**: architecture inventory, foundation
   changes, shared regressions and local website preview. This checkpoint.
2. **Native Windows preview**: correct computer, clean dedicated checkout, pinned
   dependencies, unpacked build, direct-launch profile proof, complete acceptance
   inventory above. Record actual Windows version, CPU and Electron/Node versions.
   Test x64 first if that is the PC architecture; arm64 remains separate.
3. **Distribution**: unsigned, clearly labeled preview preparation/testing needs
   no paid signing subscription. No identity creation or security exceptions are
   authorized.
   The current `publisherName` is null, so Windows updates deliberately remain
   disabled. An existing approved full Authenticode publisher DN and release
   signing setup must be established/approved before a stable Windows update.
   Keep signature checks enabled. An unsigned preview is not a release gate pass.
4. **Genuine Windows upgrade**: two exact builds in a disposable per-user install,
   real native updater/NSIS replacement, relaunch and data/preferences/PDF hashes.
   Also test spaces/Unicode/long paths, antivirus locks and canceled/failed updates.
5. **Publication (separate approval/gates)**: keep Mac assets/feed available. The
   existing publisher supports one platform per version/tag and refuses existing
   releases. Design and test an additive multi-platform candidate/promotion flow
   before using it; never replace a Mac release or make a Windows-only release
   GitHub “latest” that strands the Mac stable-feed URL. The signed Windows and
   Mac envelopes, checksums and inventories must all remain verifiable.

## Native handoff

The parent has identified the user's Windows PC, but task execution is awaiting
authorized access. Host identity and access diagnostics belong in the private
local checkpoint, not public source. No Windows test run has been created. Wait
for parent confirmation; do not substitute a Mac VM or bypass the restriction.

On that PC, use a new local source checkout at this feature commit, outside real
production directories, with its own dependencies (never copy Mac node_modules).
Node 24 LTS is recommended; minimum developer Node is 22.13 with node:sqlite.
With ordinary user privileges:

```text
node tools/windows_preflight.cjs
npm ci
npm test
npm run build:win -- build/windows-preview-01
```

Before double-clicking `build/windows-preview-01/win-unpacked/Script Call.exe`
(or the architecture-specific unpacked folder reported by builder), inspect
`preview-build.json` and `resources/app/desktop/preview-profile.json`. All storage
must resolve inside that new build directory. Do not copy an installed app, real
database, private logo or real production file into the fixture. Use the native UI
through permitted workflows and synthetic fixtures. A new runtime-specific
automation approval may be required; prior Mac release grants are not blanket grants.

Record assertions and screenshots, including actual saved PDFs. Test run success
must state the operating system; a mocked Windows updater proves the contract,
not a Windows installer, signature, native dropdown or replacement.

## Website

The actual Script Call and Production Desk public pages were inspected visually
and the Production Desk HTML was read. The redesign follows its single-column
intro → download → requirements → feature list → source/support/footer structure,
retaining purple, the Mac 0.3.16 download, domain, privacy and release history.
There is no Windows download button before native artifact acceptance.
Development is on a separate local gh-pages-derived branch; production deployment
is not authorized by this checkpoint.

References: [Electron packaging](https://electronjs.org/docs/latest/tutorial/tutorial-packaging),
[code signing](https://electronjs.org/docs/latest/tutorial/code-signing),
[builder Windows options](https://www.electron.build/docs/win).
The pinned builder 26.15.3 schema was also checked for `dir`, `signExecutable`
and `verifyUpdateCodeSignature`; its native execution is still pending.

## Windows native follow-up

Native x64 build/acceptance work and the separately named portable preview are
recorded in [WINDOWS_NATIVE_VALIDATION.md](WINDOWS_NATIVE_VALIDATION.md). The earlier
handoff/access notes above describe the foundation checkpoint, not current access.
