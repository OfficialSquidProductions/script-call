# Production records and location cards

Introduced in Script Call 0.3.11, based on released 0.3.10 (`2813495`).
Release QA uses disposable profiles; installed user apps and projects are untouched.

## Behavior

- Each cast/crew card has a named Delete Cast/Delete Crew button. Each expanded
  location card ends with Delete Location. The confirmation names the record,
  counts links, explains its effect on drafts, and offers cancellation.
- Deletion adds a `recordTrash` flag. Original records, IDs, calls, scene membership,
  availability, location references and timezone strings remain stored. Active
  lists and new draft output omit deleted records. A backup precedes each change.
- Restore is available beside the relevant list and in Settings & help → Deleted
  members & locations. It removes the flag and reactivates retained links, without
  overwriting later edits to unrelated records. There is no permanent purge.
  Restore is the recovery mechanism; record deletion does not use the day or
  availability undo stack.
- A deleted primary or scheduled location needs explicit restoration or
  replacement before issuing another sheet. It is never silently reassigned.
  Linked days retain the deleted location's timezone until explicitly changed.
- Original issued snapshots and PDF bytes remain immutable. Opening an issued
  revision continues to show its historical records.
- Locations use native keyboard-operable disclosure controls: title-only when
  closed, edit form when open. Collapse all/Expand all are provided. Expansion
  preferences persist locally per production and stable location ID; a newly
  added location opens for editing. These presentation preferences are not part
  of a portable project.
- The location timezone input is hidden. Existing saved zones and the daily
  timezone override retain their meaning. Coordinates remain in Advanced.
- Restricted availability windows are yellow and labeled Restricted, with times.
  Valid assigned intervals receive explicit restricted-window advice, including
  carry-in from an overnight window. Full day remains green; O/C remains blue
  and says available, not on set. Conflict text remains explicit and a conflicting
  restricted grid cell keeps its red border.

## Compatibility

Legacy projects load without inserting recovery data. Portable archives with
active deletion flags require reader version 6 so older readers cannot revive
hidden records accidentally. Restoration removes that requirement when all flags
are cleared; other features can still require their existing reader version.
Production Desk reimports retain deleted record fields and flags. Import-as-copy
keeps member/location IDs and links and normally remaps global revision IDs.

## Validation

- 121 unit tests passed, 2 optional private-provenance tests skipped, zero failures.
  Includes deletion/restoration, stale/repeated operations, atomic backup failure,
  linked calls/scenes/availability/zones, reopen, portable round trips, retained
  issued PDF bytes, Production Desk merge and overnight restricted advice.
- Native Mac QA used only the dedicated preview profile and synthetic data:
  collapsed/expanded cards and bulk controls, keyboard disclosure, saved expansion,
  hidden timezone field, cast and crew yellow/full-day/O/C display, named deletion,
  cancel/confirm, deleting the last active crew member, draft omission, deleted
  location issue blocking, retained timezone, portable export, quit/reopen and
  restoring all three record types through Settings.
- An actual native-issued G-Casper PDF and frozen snapshot were compared before
  deletion and after restore. Exact PDF SHA-256:
  `7bb3069b5c36d5e3841f1a5a6f5feda631e1e2e640143cfbcb042478b18a7989`.
  The native-exported reader-6 archive was imported into another disposable store,
  restored and checked for stable data and expected revision-ID remapping.
- Final ad-hoc Mac preview signature verified; 34 packaged runtime source files
  match the checkout. All 648 regular files in the existing installed app match
  their pre-test hashes. Direct launch embeds dedicated project/settings/log/
  crash/backup storage; update installation is disabled for this preview.

Evidence is in `verification/record-delete-cards-unit.txt`,
`verification/record-delete-native-data-proof.json`,
`verification/record-delete-cards-integrity.json` and the final feature report.

## Limits

Native QA covered this Mac only. Windows, Intel Mac, touch and formal screen-reader
QA were not run. The subsequent explicitly authorized release suite passed 117 exact-build Mac UI
checks, packaged smoke and 25 real 0.3.10 → 0.3.11 native-upgrade checks. The release
is Developer ID signed and Apple notarized. The separate local preview remains
ad-hoc signed. See RELEASING.md for exact release evidence.
