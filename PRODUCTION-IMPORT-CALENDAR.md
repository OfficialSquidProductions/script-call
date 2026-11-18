# Production Desk import and shooting calendar

The desktop release is based on public main `b090a0c` (0.3.16), with the requested changes carried over from reviewed feature commit `e1c917c`. The original feature branch was verified at `949738e`; its unpublished Apple-target history is excluded from this desktop release. Existing dirty work and Windows/mobile branches and assets remain untouched.

Production Desk was inspected read-only at source commit `6c10ec075c25212be05b67ae41bd8629dd7527a9`. Its current Mac appcast is
1.5.21 build 53, matching the supplied sidebar reference. The portable format
remains `org.squidproductions.productiondesk.project`, version 1, containing one
workspace-v1 production and its embedded original PDF dictionary.

## Imported data

| Production Desk source | Script Call destination |
| --- | --- |
| `project/name`, `company`, `description`, `_importNotes`, revision colors | Production title, reusable defaults, production notes and sheet colors |
| Selected `stripboards[]` scenario; primary `boards[].breakdownIds` day groups | Stable linked shooting days, original scene/banner order, daily schedules |
| Selected scenario's `calendars[].events` start/dayOff and `daysOff` weekdays | Shooting dates, calculated with the same skip-days rule as Production Desk; absent start stays blank |
| Scene `breakdowns[].id`, scene number, category 0/1/2/3/4/6 elements | Scene identity, slugline, day/night, script day, unit and location links |
| `description`, `comments`, pages, duration, `_scriptText` | Synopsis, editable scene notes, eighth-page lengths, duration and scene script |
| Every tagged non-cast department category (`ucid > 100`) | Category-labeled scene notes and **Daily Sheet → Notes & advance → Special instructions by department**, grouped by source category and source-order scene number |
| All scene element records | **Production Info → Scenes → Imported breakdown elements**, grouped by category; full records retained |
| Cast elements (`ucid = 100`), element IDs and scene membership | Character register, cast numbers, scene cast links, matching daily cast-call rows; performer/contact/call values remain blank |
| `_shots` | Scene-linked source shots and camera setups in Scene & shots |
| Entire production object | Source details and portable Script Call archive; three-way reimport preserves local edits and issued days |

The department mapping now includes Camera, Grip, Electric, Sound, Wardrobe,
Make-up, custom departments and other source categories, beyond the prior limited
props/notes subset. Imported department instructions are an editable initial
copy. Later manual schedule edits do not silently regenerate or overwrite those
instructions. Reimport updates an unchanged copy and retains locally edited text.

## Data requiring manual review or retained only

Production Desk v1 has character roles, not performer/contact records. It does
not provide verified call/preparation times, crew contacts, timezone, operational
weather or emergency/address verification. None is invented. Shot start-time
settings are not treated as crew calls. Location names do not become addresses.

Other scenarios, calendar settings, linked-element relationships, source
availability, custom extensions and annotation metadata remain in Source details;
source availability is not automatically converted into Script Call's different
availability model. Unscheduled scenes remain in Production Info. Strips outside
day groups remain unassigned. Day IDs derive from scenario/board/position because
v1 has no day IDs; inserted/regrouped source days require review. Fractional pages
are rounded to the nearest eighth; exact values remain in source metadata.

PDF originals are validated on import, but their bytes and editable lined-script
marks do not become Script Call assets; keep the original `.productiondesk` file.
The importer retains its existing 25 MB / 3000-record-list limits, which are
smaller than Production Desk's 200 MB complete-export capacity. Larger valid
source exports still require a smaller source production/export.

## Calendar and sidebar

Daily Sheet, Shooting Days and Production Info are peer tabs at the top of the
sidebar tool list. Production Desk's 204 px sidebar, 12 px labels, 19 px icon
column, 11 px icon gap, active accent edge and dark/light palette informed the
layout; Script Call retains its purple SP branding. Both supplied PNGs were
materialized and inspected (`image.png`, 72,102 bytes; `image(1).png`, 103,739 bytes).

Shooting Days opens a Monday-first monthly calendar. Scene cards stay in schedule
order; same-date units are separate cards. Month arrows, production-month selector
and All production dates reach every scheduled date and gaps across years.
Undated days have a separate Dates needed section. Empty-date + creates a day;
day selection, context/keyboard actions, date edit/delete, recovery and undo/redo
remain available, with explicit Open Daily Sheet links. Selected month/day survive
reopen. Narrow native windows scroll the seven-column grid horizontally.

[CineSched](https://github.com/ChrisTempel/CineSched/tree/main) was inspected
read-only at `79d8a2c8376304f1052f6eb7e378b8550dc17ca4`, particularly
`CalendarView.swift` and day-detail interactions. It inspired date cells with
scene cards and a direct daily-sheet action. No CineSched code was copied;
drag-and-drop scheduling was not introduced.

## Representative export and verification

`tests/fixtures/current-productiondesk.productiondesk` is a fresh export through
the current source's actual `project_file.import_project/export_project` code,
using the existing fictional Last Light fixture and disposable PDF storage.
It is 52,144 bytes, SHA-256
`84b4572a8c77c1626c9803b4723ace25b9707c5d3cc52d327a6b0561825c03cd`.
Exporter SHA-256:
`4984ce2757db1b238a510f20c6610b59ee0efea710ca192b6cd842b1e4749d40`.
Reproduce with `python3 tests/support/export-current-productiondesk.py SOURCE/windows-src OUTPUT.productiondesk`.
This uses the production exporter without opening an actual user's production.

Commands run with the checkout-local Node 24 runtime:

- `node --test tests/*.test.cjs` — original feature branch: 205 tests, 203 passed, 2 existing skips, 0 failed. Desktop release 0.3.18: 197 tests, 195 passed, 2 existing skips, 0 failed. The unpublished Apple-specific tests are excluded. Includes current exporter mapping, all department/cast/scene links, absent dates, three-way preservation, malformed/unsafe files, atomic rollback and calendar boundary/navigation logic. Local HTTP fixture tests need host access; the sandbox-only run failed two updater cases, which passed with local access.
- `node tests/productiondesk-desktop.cjs` — native Mac import acceptance passed: reviewed import, scenario selection, reimport, local edits, actual PDF exports, unsupported/malformed files, picker cancellation, reopen, preservation of existing production and no HTTP requests.
- `node tests/calendar-import-desktop.cjs` — native Mac calendar acceptance: current export, preview cancellation, three days/seven scenes, same-date units, month/year navigation, missing dates, notes and cast UI, edit/delete/cancel/undo/redo/restore, empty-date creation, selection persistence and light/dark layout checks.
- `node tests/shooting-days-desktop.cjs` — packaged Mac day-management regression; passed all 11 checks, including unchanged issued PDF bytes after reschedule/deletion, recovery, 27-day calendar navigation and deleting/restoring the final day. Selectors were adapted from the removed weekly sidebar to the calendar.
- On the original feature branch, Apple resource staging and the native Swift macOS build also succeeded. Those unpublished Apple targets are excluded from this desktop release branch.

Local evidence is in `verification/unit-results.txt`, `verification/import/`,
`verification/calendar-import/`, `verification/shooting-days/` and
`verification/apple-mac-build.txt`. Mac visual review used actual native Electron
windows; the Swift macOS host was compile-checked. No iOS device, Windows or Linux
runtime QA was performed. No installed app was replaced, and no release,
publication, submission or remote push was performed.

On the original feature checkout, open `Start Import Calendar Preview.command` to inspect the separate local Mac preview. Its projects, backups, diagnostics and preferences live under `build/shooting-days-preview/profile`, not the installed application profile.
