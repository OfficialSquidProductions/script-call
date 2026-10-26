# Departments, solar times, company image and day planning

Introduced in Script Call 0.3.16, building on 0.3.15. Existing production records, manual overrides and issued PDFs remain intact.

## Department suggestions

The original 17 editable suggestions remain, followed by all 28 groups from the referenced call-sheet back. Assistant Directors, Continuity, Production Office, Accounting, Video, Construction, Set Decoration, Property, Special Effects, Medic / Fire Safety, Additional Labor, Legal, Craft Service and Vehicles are available alongside the existing departments.

`web/department-groups.js` owns the printed columns and canonical display aliases. Assistant Director / AD and Assistant Directors share one band; Script Supervisor maps to Continuity. Custom strings remain allowed. Names, IDs, role assignments and stored department strings are never migrated automatically. A Script Supervisor currently assigned to Production remains there until explicitly reassigned.

## Sun and civil twilight

Weather & sun displays calculated sunrise, sunset, civil dawn and evening civil twilight. Calculation is offline with the existing SunCalc 1.9.0 dependency. Civil twilight uses the sun's center six degrees below the horizon. Candidate events on adjacent UTC dates are filtered to the requested shoot-local date, using the effective location/day timezone and its DST rules. No production/location data is sent to a solar service during normal use.

Missing coordinates, invalid dates/zones and polar events remain explicitly unavailable. Zero coordinates are valid. A day can hold selected manual event overrides, including an explicit blank or following-date event. The override stores its date/location/coordinate/timezone context. Changing that context retains the manual values but shows fresh calculated values and a review notice; values are only reapplied after explicit review. Ambiguous or skipped DST manual times require review instead of selecting an arbitrary occurrence. Manual times also work without coordinates when date/zone are known. Use calculated times clears the override.

Times follow the existing 12/24-hour preference in editor, preview and new output. Issued snapshots/PDFs keep their original values.

These are astronomical estimates, not observed conditions or terrain-adjusted predictions. Three independent US Naval Observatory cases cover Washington on October 26 and its November 1 DST transition, plus Sydney on December 31. The maximum observed difference across all twelve events was 127.358 seconds; the test tolerance is three minutes. The first Washington-only check passes a tighter two-minute tolerance. Actual atmosphere, terrain and high latitudes can differ further.

References: [USNO API](https://aa.usno.navy.mil/data/api), [NOAA twilight definitions](https://gml.noaa.gov/grad/solcalc/glossary.html), [NOAA calculation limits](https://gml.noaa.gov/grad/solcalc/calcdetails.html). Public reference responses are reduced to data/provenance in `tests/fixtures/solar-usno.json`.

## Per-production company/header image

Production data → Production offers Choose/Replace, Remove and Restore SP image. Legacy productions retain their default SP image until explicitly changed. Removal is an explicit state and does not silently fall back to SP after reopening or import.

PNG/JPEG input is limited to 5 MB, 12,000 pixels on either side and 24 MP. Native decoding scales proportionally to at most 1600 px, reducing further if needed to keep the embedded PNG under 1 MB. Metadata is removed. The canonical PNG is split into bounded base64 chunks to fit existing project guards. SVG, arbitrary URLs, animated PNG, corrupt data, oversized files and invalid dimensions are rejected. The source file remains untouched. No image is uploaded externally.

All layouts use `object-fit: contain`; the existing header image box remains the boundary. Wide, tall, transparent and square images retain their aspect ratio. Project exports embed the image; issued snapshots embed the selected image state.

## Automatic lunch

New days start in automatic mode. Lunch follows crew call plus six elapsed hours in the shooting-day timezone, including midnight/DST rollover. Missing crew call leaves lunch blank. A skipped/repeated crew call requires review or a manual lunch. An unknown date/zone produces a clearly labelled provisional clock estimate.

Any valid direct lunch edit makes the day manual and preserves the displayed lunch date offset. Later crew-call edits leave it alone. Lunch date can explicitly be the shoot date or following date. Use crew call + 6 hours restores automatic mode. Day duplication retains the source mode. Existing days without a mode keep their inherited or explicit legacy lunch values. Production Desk reimport does not introduce the new automatic default into an existing legacy day. Source meal/break schedule rows are independent and are not silently rewritten.

## Two-day Advance

Notes & advance has separate optional overrides for the next shooting day and day after next. Existing `day.advance` remains the first override; `advanceSecond` is independent. Blank overrides print each corresponding day's scenes. The established production-record order is retained, including nonconsecutive dates, multiple units and gaps. Labels include day, date and unit. Missing days or empty schedules are stated explicitly; one day's scenes are never repeated into the other slot.

G-Casper and flowing layouts render both slots. Long manual notes continue across pages; historical snapshots without the new `advanceDays` metadata keep the previous rendering path.

## O/C printed personal calls

For a called cast/crew member whose availability on the sheet's shoot date is On Call, new snapshots print `O/C` in the personal-call column. The numeric call, advanced times, attendance and availability records remain stored. Changing away from O/C restores normal call display; other dates are independent and uncalled people remain excluded. O/C still means available, not on set, distinct from All Day.

## Compatibility and verification

The new optional project fields validate without rewriting legacy projects. Archives containing these features/new snapshots require reader 10 so older apps fail clearly instead of silently discarding the new state. Existing reader 1–9 archive fixtures remain covered explicitly. Stable person/day/location/import IDs and immutable issued-PDF bytes survive round trips. Manual Production Desk import data remains intact.

Final unit/data suite: 194 tests, 192 passed, 2 existing provenance-fixture skips, 0 failures. Nineteen new feature tests cover calendars/DST, manual overrides, raster validation/fitting, all four layout renderers, canonical department grouping, O/C, portable reader 10, Store reopen, import preservation and exact issued bytes.

Native Mac QA uses a separately packaged Apple Silicon preview with dedicated project/settings/log/crash/backup storage, including direct launch. Tested native editing, department filtering/keyboard selection/custom values, automatic/manual/reset lunch, solar invalid/cancel/save, PNG/JPEG/cancel/invalid/replace/remove/restore, save/reopen and actual portable export/import. Five actual PDF exports cover A4/Letter, 24/12-hour clocks, wide/tall/no image, G-Casper front/back and Narrative, normal two-day schedules and 180 distinct long note lines. All 22 pages were rendered for visual review. PDFKit inserts extraction whitespace around some kerning glyphs; the content check normalizes only that whitespace and still requires every numbered note in order exactly once.

The first externally seeded disposable SQLite profile stalled in a native file-open during startup. It was retained for diagnosis. A fresh app-created isolated profile started normally, imported the same fixture through Open Project and passed subsequent reopen checks. No shipping workaround, permission change or real-profile access was introduced.

Initial local GUI QA used CUA. The subsequent authorized0.3.16 release validation passed192 unit/data checks,176 Mac UI checks plus packaged smoke and all42 genuine0.3.15-to-0.3.16 native upgrade checks, including exact issued PDFs/backups/preferences and the six-feature round trip. Apple notarization, Developer ID, staple and Gatekeeper passed. Windows/Intel Mac/Linux distributions, physical touch and formal screen-reader auditing remain unvalidated.
