# Script Call releases

Source: https://github.com/OfficialSquidProductions/script-call — public. Original code and test-only fictional fixtures are MIT licensed; third-party licenses and branding notices remain in THIRD_PARTY_NOTICES.md.

Binary assets and signed update metadata: https://github.com/OfficialSquidProductions/script-call-updates. A source push does not ship an update.

## 0.3.16 release validation

0.3.16 adds all reference department suggestions/canonical display aliases while retaining custom strings, offline shoot-local sunrise/sunset/civil dawn/twilight with contextual manual overrides, embedded proportional company images with explicit removal/default states, new-day automatic lunch six elapsed hours after crew call with manual/date-offset/reset behavior, two independently labelled Advance shooting days, and date-specific O/C personal-call presentation without clearing saved times. Civil twilight is the sun center6° below the horizon. Solar calculations are estimates; twelve independent USNO events across Washington/DST and Sydney/year-end had maximum deviation127.358 seconds (three-minute test tolerance). Missing/polar events stay explicit. New fields/snapshots use portable reader10; unchanged legacy records retain their earlier minimum reader.

The exact Developer ID signed/notarized build passed **192 unit/data checks** with two existing optional provenance skips, **176 Mac UI checks across16 acceptance suites plus packaged smoke**. The real **0.3.15 → 0.3.16 native upgrade passed all42 checks**, including authenticated public candidate download, actual native replacement/relaunch, persisted installation-local profile without launcher environment, pending edit, consistent recovery backup, warnings/update preferences, Production Desk IDs and local edits, legacy manual lunch/Advance/custom departments/O-C calls, original template and issued PDF, then all six new features and actual reader10 export/direct reopen. Original/after PDF SHA-256: `27b13d1eb8b3ede4d33c14fb8f02701ab361594dabc4965bc6d8ec8b699fedce`.

Apple accepted job `5f721e5f-b0df-44c4-a3fc-0a3b9936904c`. Signature/staple/Gatekeeper and runtime/source checks passed with normal trust access. ZIP131,353,138 bytes; SHA-256 `3b275fce6c5f101b85b902a0cc59ea99b119d348d74c2b1ed1ec8d659956326b`; Ed25519 metadata expires `2026-11-25T15:27:03.734Z`. Evidence: `verification/0.3.16-*` and `verification/live-update-0.3.15-to-0.3.16/result.json`. All tests use isolated disposable profiles/installations; the user app and nine real productions remain unchanged.

New test-only setup corrections preserve relative framework symlinks in the ordinary app copy, use the actual Electron evaluation context for image fixtures and the established native-popup Escape route, read saved label text independently of CSS uppercasing, and explicitly assert both revision references remap on import. Exact custom-name, day/date, data-preservation and PDF assertions remain required. Preliminary logs remain local. No shipping runtime correction was required after the tested feature commit. A sandboxed Developer ID probe lacked normal trust access; the normal security gates passed without changing security settings or permissions.

Apple Silicon/macOS13+ validated. Intel Mac, Windows/Linux distributions, physical touch and formal screen-reader auditing remain unvalidated. Images support bounded PNG/JPEG input; no external logo upload. Existing Maps opaque/viewport-only/manual and live short-link limitations remain. NWS requires supported US coordinates/connectivity/forecast horizon. No new credentials, DNS/domain changes, old-release deletion, installed-app replacement or App Store submission.

## 0.3.15 release validation

0.3.15 adds compact key positions with off-by-default linked phones, reference-informed G-Casper department columns/aliases, searchable collapsible cast/crew calls, independent parking/basecamp/hospital records and daily notes, date-matched NWS high/low boxes and a persisted Fahrenheit/Celsius preference. Existing day units are honored until selected; Celsius remains the new-production fallback and canonical storage. Manual values, stable IDs, legacy templates and exact issued PDF bytes remain intact. New fields/snapshots require portable reader9.

The exact corrected notarized build passed **173 unit/data checks** (two existing optional provenance skips), **162 Mac UI checks across16 suites plus packaged smoke**. Genuine **0.3.14 → 0.3.15 native upgrade passed all36 checks**, including public authenticated ZIP download and native replacement/relaunch, saved pending edit, actual recovery backup, warning/update preferences, Production Desk IDs, legacy Fahrenheit inputs with exact Celsius storage, new phone/logistics/unit settings, actual reader9 export/direct reopen and exact original issued PDFs. PDF SHA-256 before/after: `3db519cdebe577a9b19e2859b7537610e90f983c2e665de6f752f2641f02474b`.

Apple accepted corrected job `951780c9-0b3b-4569-9a2e-2d394deafc93`. Developer ID, stapling, Gatekeeper and runtime/source checks passed. ZIP 131,341,009 bytes; SHA-256 `01c4b3cd0d4ee7d5cce6d17b506296d28f14536df937b7cb22d6e3a81177ab66`; signed metadata expires 2026-11-25T04:27:07.285Z. Evidence is in `verification/0.3.15-*` and `verification/live-update-0.3.14-to-0.3.15/result.json`. Release tests use ordinary-copy writable isolated installations; real installed app and all nine production records matched read-only baselines.

The first measurement failure was Playwright auto-scrolling an obscured checkbox before pointerdown; the test now establishes an unobscured target before taking the original strict anchor/focus measurement. That exposed a real last-expanded-card scroll-range clamp. A small temporary scroll tail now preserves the acted row until it returns to the natural range. Native CUA and the unchanged <3px/focus assertions passed. This shipping correction was rebuilt/re-signed/re-notarized as R2 before complete exact-build revalidation; R1 never became public. The feature harness also corrected a preview-load null guard and a stale post-relaunch locator. A legacy Maps assertion now matches the independent Parking button label, retaining all URL/coordinate/privacy assertions. Original diagnostic/failure logs are preserved locally.

Apple Silicon/macOS13+ validated; Intel Mac, Windows and Linux distributions, physical touch and formal screen-reader auditing remain unvalidated. Existing Maps opaque/viewport-only/manual fallback and live short-link verification limits remain. NWS needs supported US coordinates, connectivity and forecast horizon. No new credentials, domain/DNS changes, historical-release deletion, installed-app replacement or App Store submission.

## 0.3.12 release validation

0.3.12 adds title-only scene disclosures with bulk controls/persisted local open state, confirmed recoverable Delete Scene and exact slash page lengths. Stored lengths remain integer eighths; mixed/fraction-only/whole/exact decimal page-unit input commits on blur/Tab/Enter. Invalid/incomplete text remains visible, never rounds/overwrites saved values, and waits for correction/Escape before navigation/save/graceful close. Scene deletion retains full records and raw schedule links/times; independent calls remain unchanged. Draft/advance/totals/availability omit deleted scenes. Restore reactivates retained links; archive scene metadata requires reader7. Existing saved projects and issued snapshots/PDFs remain intact.

The exact notarized build passed **130 unit checks** (two optional private-provenance checks skipped), **129 Mac UI checks** and packaged smoke. The actual **0.3.11 → 0.3.12 native upgrade passed all28 checks**, including authenticated public download and real replacement/relaunch, pending saves, import/person/scene/location IDs, exact issued PDFs, backups, warning/update preferences, both templates and existing recovery/Maps/O-C. New scene editing, invalid-value safety, cancel/delete/reader7 export and direct-restart restoration/collapse all passed after upgrade. Original/after PDF SHA-256: `5b10ecbd19ad70e9af84055573142c21868d971ef110b8af90125335c1d351fe`.

Apple accepted job `e9c644c0-9533-4786-bd18-9395bb6aa3c0`. Signature, staple and Gatekeeper passed with normal macOS trust access. Immutable ZIP: 131,322,219 bytes; SHA-256 `d4e13133eab999ff9879dcd283974981d88f58f0c84f24fb3e7edc1149fd83ef`. Ed25519 metadata expires 2026-11-24T18:51:16.889Z. Runtime matches source. Evidence: `verification/0.3.12-release-checkpoint.json`, exact-build logs and `verification/live-update-0.3.11-to-0.3.12/result.json`. Ordinary-copy writable fixtures remain in use; no SecurityAgent inspection/control, security bypass, installed-app replacement, real production edit, new credentials, DNS changes or historical release deletion. Apple Silicon/macOS13+ validated; Intel Mac/Windows/Linux distributions, physical touch and formal screen-reader QA remain unvalidated.

Legacy scene-form tests now explicitly expand disclosure cards before original assertions. The new preview test selects scenes actually assigned to its shooting day (the fixture's first day schedules3–5), retaining all original fraction/PDF/total checks. Collapse all applies to active cards; deleted scenes retain their prior presentation. The test requires that retained state plus a separate restore→collapse-all→restart check. A final test refinement explicitly selects the disposable production for last-scene recovery after relaunch. All final exact-build suites passed, and original preliminary failure logs remain local. No shipping code or signed bytes changed during those test corrections.

## 0.3.11 release validation

0.3.11 adds recoverable member/location deletion, title-only location cards with persisted local expansion and bulk controls, yellow/text-labeled restricted availability and hidden location timezone inputs. Complete retained records and links restore through list toolbars or Settings; backup precedes mutation. A deleted primary/scheduled location requires explicit restoration or replacement before issuing. Saved zones and issued snapshots/PDF bytes remain unchanged. Portable projects with deletion flags require reader6; legacy projects remain readable.

The exact notarized build passed **121 unit checks** (two optional private-provenance checks skipped), **117 Mac UI checks** and packaged smoke. The actual **0.3.10 → 0.3.11 native upgrade passed all25 checks**, including real authenticated public download/replacement/relaunch, pending edits, exact PDF bytes, both templates, import/person/location IDs, backups, warning/update preferences, recovery across restart, actual reader6 export and yellow restricted styling. Original/after PDF SHA-256: `7edf7c725fd2d0938c026ddbfd39d8a9357df69112ba92b8d30756693154c120`. The ordinary-copy writable fixture is retained; no security bypass or SecurityAgent inspection/control was used.

Apple accepted job `ab8af84a-217d-4c0d-954b-1c875eeeecac`. Signature, staple and Gatekeeper passed with normal macOS trust access. Immutable ZIP: 131,318,820 bytes; SHA-256 `0fb1409f7d5764c2c0d9831ccdc381d06f2243c680c292048a57cb687408fe50`. Ed25519 metadata expires 2026-11-24T17:58:18.811Z. Shipping runtime matches the tested source. Evidence: `verification/0.3.11-release-checkpoint.json`, exact-build logs and `verification/live-update-0.3.10-to-0.3.11/result.json`. Apple Silicon/macOS13+ validated; Intel Mac, Windows/Linux, touch and formal screen-reader QA remain unvalidated. Installed user app and real productions are untouched.

Legacy form tests explicitly open location cards before their original assertions. Window-specific advice assertions now require the Restricted label and exact yellow color, while full-day green and all interval/conflict assertions remain. The new record suite waits for the existing immediate Create new draft action and targets the labeled advice child for accessible-text/color assertions. These test corrections changed no shipping code or signed candidate bytes; original failed-attempt logs are retained locally. An additional sandboxed signature probe lacked trust access; the normal elevated signature/staple/Gatekeeper checks passed without changing the app.

## 0.3.10 release validation

0.3.10 adds Maps-first independent shooting/parking records, manual address overrides and collapsed Advanced coordinates, plus distinct crew O/C — On Call availability. Explicit link text is a reviewed suggestion; short/opaque/place-path/coordinate-only links need manual address entry. No online geocoder or new credential is used. Existing template-specific basecamp overrides remain independent. O/C marks the whole entered production-local date as available, not on set; attendance/call times are unchanged. O/C archives declare minimum reader5; old projects/archives remain readable.

The exact notarized build passed **113 unit checks** (two optional private-provenance checks skipped), **105 Mac UI checks** and packaged smoke. The actual **0.3.9 → 0.3.10 native upgrade passed all22 checks**, including public signed ZIP download, real replacement/relaunch, existing project/import/person/location identities, pending edits, exact issued PDFs, backup and warning/update preferences, recoverable deletion, next-day defaults and department suggestions. Upgraded Maps/manual parking/O-C edits survived actual portable export and restart; call assignment/times were unchanged. No renderer errors occurred. Original/restored PDF SHA-256: `ff07150a81d5260d4ae01d6738a9b8bb3e500a56a4ce50b11241ba558b3a0351`.

Apple accepted job `2174947e-3c7d-4716-922f-9753b02363e7`. Signature, staple and Gatekeeper passed. Immutable ZIP: 131,314,299 bytes; SHA-256 `c1ed93f8b8f3060b01e21c7f7b54032b6e4df1ddfb987abda8aea233492e1281`. Ed25519 metadata authenticates SHA-512 and expires 2026-11-24T16:51:48.462Z. Exact source matches shipped runtime. Evidence: `verification/0.3.10-release-checkpoint.json`, exact-build suite logs and `verification/live-update-0.3.9-to-0.3.10/result.json`. Tests use authenticated ordinary-copy disposable fixtures, outside the command sandbox with Mac unlocked for normal native authorization. No security bypass or manual helper/service changes. Installed user app and real productions remain untouched. Apple Silicon/macOS13+ target validated; Intel Mac, Windows/Linux and formal touch/screen-reader audits remain unvalidated. No new credentials, DNS changes, historical-release deletion or App Store submission.

The native-input test helper now waits up to five seconds for actual macOS activation after authorization/relaunch before checking its unchanged focus guard and sending key pairs. The first0.3.10native attempt stopped at that guard after18checks; its actual replacement had succeeded. The corrected helper passed the exact-build department suite and the complete22-check rerun. No application/runtime code or published candidate assets changed for this test correction. Original failure logs remain retained.

## 0.3.9 release validation

0.3.9 adds native editable crew Department suggestions with the exact 17 requested presets. Existing/custom department strings, IDs and crew grouping are not normalized. Keyboard filtering/selection, mouse selection, Escape and normal focus remain native behavior. Cast fields stay unchanged.

The Mac department test uses `tests/support/native-popup-keyboard.cjs` for popup navigation. In the recorded 0.3.9 probe, CDP fill/typing delivered trusted ArrowDown/Enter DOM events to a focused, visible field but left `cam`; Electron `webContents.sendInputEvent` key-down/up selected `CAMERA`, matching native CUA input. This corrects test input routing for the native popup. It never assigns a DOM input value, and the original CAMERA/focus/save/PDF assertions remain required. Native popup QA needs a visible, focused isolated window. No shipping code changed for this correction. Evidence: `verification/0.3.9-input-probe.json` and the corrected department suite log.

Native acceptance authenticates the public ZIP, extracts it unchanged, then makes an ordinary user-owned disposable installation with `tests/support/native-upgrade-fixture.cjs`. Every file and symlink is compared to the extracted public app and signature/staple/Gatekeeper checks are repeated. No file modes, attributes or security settings are changed. Prelaunch write access does not prove runtime write access: the running native updater still required normal macOS authorization. A sample of the stalled attempt showed Squirrel waiting in `AuthorizationCreate`; CUA confirmed the Mac was locked. The complete rerun outside the command sandbox with the Mac unlocked passed actual replacement/relaunch and all original acceptance assertions. Never bypass authorization or claim a locked/pending attempt passed. Optional `CALLSHEET_UPGRADE_DIAGNOSTICS=1` records passive native events and app lifecycle; it does not replace the updater or weaken native replacement assertions. Evidence: `verification/0.3.9-native-upgrade-unlocked.txt` and its native event log. No shipping updater code changed.

The exact notarized app passed **104 unit checks** (two optional private-provenance checks skipped), **95 Mac UI checks** and packaged smoke. The real **0.3.8 → 0.3.9 native upgrade passed all 20 checks**, with actual public ZIP download/native replacement/relaunch in an isolated installation. Legacy custom crew names, person/import/day IDs, availability, pending edit, templates, exact PDFs, backups and preferences survived. After upgrade, all 17 suggestions, typed selection/Tab and custom department save/reopen passed. Preexisting deleted productions, restoration and next-day defaults also passed. No renderer errors occurred. Original/restored PDF SHA-256: `c87c591142a2e5d59067bea0df2e34fb189046596a148661a5c4516927d9445d`.

Apple accepted job `0e360265-15bf-44c2-ba39-24f83fe87e91`. Signature, staple and Gatekeeper passed. The immutable ZIP is 131,310,689 bytes, SHA-256 `a285f2b06ca08c3bc26247b5ddb346105afb85170bdcafbd90d730f401563bca`; Ed25519 metadata authenticates its SHA-512 and expires 2026-11-24T01:09:24.695Z. Evidence: `verification/0.3.9-release-checkpoint.json`, exact-build logs and `verification/live-update-0.3.8-to-0.3.9/result.json`. The installed user app and real projects remain unchanged. No new credentials, domain changes, historical-release deletions or App Store submission. Apple Silicon/macOS 13+ validated; Windows, Intel Mac and Linux distributions remain unvalidated.

## 0.3.8 release validation

0.3.8 makes Add Day propose the date after the final active production-order record, independent of sidebar sorting and selection. Manual date entry and Duplicate Day remain supported. Calendar arithmetic is UTC date based; first-day/unusable-date fallback retains today. Existing records are not changed.

The exact notarized build passed **101 unit checks** (two optional private-provenance checks skipped), **88 Mac UI checks**, and packaged smoke. The real **0.3.7 → 0.3.8 native upgrade passed all 19 checks** using the public candidate ZIP and actual replacement/relaunch in a disposable installation. It preserved pending edits, templates, exact PDFs, import/person/day IDs, availability, backups and preferences; preexisting production recovery records remained restorable. The upgraded app verified new date defaults, cancellation, repeated additions and reopening without changing original day records or PDF bytes. No renderer errors occurred. Original/restored PDF SHA-256: `efa0686a33bf3a8a1c7e675ab8c96619248763eb92fe19c85f95584fb181b0da`.

Apple accepted job `36554c52-ad5a-4476-8654-eaaed47e78cd`. Signature, staple and Gatekeeper passed. The immutable ZIP is 131,309,530 bytes, SHA-256 `01255aa3aeb9257b8fac9985d99067b7cce9d808f9ff031e5fa9bf1040127ad3`. The existing Ed25519 key authenticates SHA-512. Metadata expires 2026-11-24T00:46:54.291Z. Evidence: `verification/0.3.8-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.7-to-0.3.8/result.json`. Windows, Intel Mac and Linux distributions remain unvalidated. Tests never replace the installed user app or touch real projects; no domains, credentials or historical releases change.

## 0.3.7 release validation

0.3.7 adds Settings & Help → Delete Production with a named, scoped confirmation and a recoverable Deleted productions → Restore workflow. SQLite tombstones retain the complete original production and issued revision/PDF bytes; unrelated productions, app settings and external files remain unchanged. Backup precedes delete/restore; deleting the last active production creates one blank. Stale versions, repeated clicks and an active PDF issue fail safely. This additive change keeps older project files and availability/import identities compatible.

Release gates use disposable profiles and separate bundle copies only. The feature unit suite covers atomic rollback, legacy databases, exact issued PDFs/portable archives, import matching and retained recovery records; the Mac UI suite covers cancel, confirmation scope, repeated clicks, stale selection/version, backup failure, active PDF issue, restart and last-production restore. The native 0.3.6 → 0.3.7 acceptance test additionally checks deletion/recovery of an upgraded production with exact project/PDF contents and an unrelated imported production intact. Publish only after all exact-build and native-upgrade gates pass.

The exact notarized build passed **96 unit checks** (two optional private-provenance checks skipped), **81 Mac UI checks** (19 general, 12 G-Casper, 12 importer, 8 reporting/crash, 11 shooting-day, 11 availability, 8 production-deletion) and packaged smoke. The real **0.3.6 → 0.3.7 native upgrade passed all 17 checks**, using the public candidate ZIP and actual Squirrel replacement/relaunch in a disposable installation. Pending edits, import/local person IDs, availability, templates, exact issued PDF bytes, backup contents and update/warning preferences survived. The upgraded app then confirmed/canceled/deleted/restored the upgraded production across restart, preserving unrelated import data and original PDF bytes. No renderer errors occurred. Original/restored PDF SHA-256: `a45e073c3ccf0f63e361abef0b1ae2d1f1db90074c68d6b2dbd5227b7b63dea1`.

Apple accepted job `e8918c18-2956-49c6-b149-92b8ba1458c3`; signature, staple and Gatekeeper passed. The immutable ZIP is 131,309,334 bytes, SHA-256 `0b178461a24ea6c95f232f9d575e6967d12b61ed2580994cbe5a4dbf53445058`. The existing Ed25519 key authenticates its SHA-512. Metadata expires 2026-11-24T00:14:47.662Z. Local evidence: `verification/0.3.7-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.6-to-0.3.7/result.json`.

Apple Silicon/macOS 13+ is the supported validated target; Windows, Intel Mac and Linux distributions remain unvalidated. Preserve the installed user app and real projects, old releases, support email, domains and credentials. No App Store submission is part of this release.

## 0.3.6 release validation

0.3.6 combines cast/crew availability with removal of bundled Last Light and legacy Quiet Hours demo loaders/resources. Fresh profiles and new productions are blank. Existing saved/imported projects, stable source/person/day IDs, availability, templates, issued PDFs and portable archives remain supported. Synthetic fixtures live under `tests/fixtures/` only.

The exact signed/notarized app passed 89 unit/update/release checks (two optional private-provenance checks skipped), 19 general desktop, 12 G-Casper, 12 importer, 8 reporting/crash, 11 shooting-day and 11 availability checks, plus packaged smoke. The real **0.3.5 → 0.3.6 native upgrade passed all 16 checks**, including actual public download/native replacement/relaunch, the same custom profile without launcher environment, pending save, exact issued PDF bytes, import IDs/model/local edits, manually recorded availability, recovery backup contents, update preferences, warning suppression/reset across restart and blank new productions. No renderer errors occurred. Original/after PDF SHA-256: `a1c1580998c7bfd02d06bc924c06fd5ba24904da69245d888697a0481c196f26`.

Apple accepted job `4a5bce70-3ce7-4a65-94fb-2c7cd9ed79db`. Signature, staple and Gatekeeper checks passed. The ZIP is 131,307,874 bytes, SHA-256 `d708080ac132707cd161ab480a732f50223a5293b8dfd1d695309fcaaf6230d8`; its SHA-512 is authenticated by the existing Ed25519 update key. Metadata expires 2026-11-23T22:21:38.131Z. Evidence: `verification/0.3.6-release-checkpoint.json`, exact-build regression logs and `verification/live-update-0.3.5-to-0.3.6/result.json`. Promotion still requires matching native acceptance evidence and public asset verification.

Apple Silicon/macOS 13+ is validated. Windows, Intel Mac and Linux distributions remain unvalidated. The installed user app, real projects, domain/DNS settings and old releases remain unchanged. No new credentials were created.

## Previous 0.3.5 status and website coordination

**0.3.5 was the previous public stable Developer ID signed and Apple-notarized release.** It adds stable-ID shooting-date editing, recoverable deletion, confirmation suppression and Reset Warnings, and the seven-record sidebar with a scrollable calendar-week overview. G-Casper, Original Narrative, both demos, Production Desk import/reimport, local reviewed reporting and the existing update trust key remain included.

The exact notarized app passed 73 unit/update/release checks, 19 general desktop checks, 12 G-Casper checks, 12 packaged import/reimport checks, 8 reporter/crash checks, 11 shooting-day checks and packaged smoke QA. The real signed **0.3.4 → 0.3.5 native upgrade passed all 15 checks**, including actual bundle replacement/relaunch, the same profile without launcher environment, pending save, original issued PDF bytes, import IDs/model/local edits, the contents of the recovery backup, update preferences, and warning suppression/reset across restart. PDF SHA-256 before/after: `05e57b7926443c7f98a088902ff260bc686e75f693bfaa7bd0ca9ca26729c946`.

Anonymous public verification passed: the stable alias ZIP matches the immutable artifact at **131,315,002 bytes**, SHA-256 `3e4c8b888174ba051032a36fa6e52163b0027b8eed37318b227787352e82a04f`; its SHA-512 matches the Ed25519-signed feed. Unmodified signed 0.3.4 offers 0.3.5 through the production feed; unmodified 0.3.5 reports current. Local evidence: `verification/live-update-0.3.4-to-0.3.5/result.json`, `verification/0.3.5-notarization.json`, `verification/script-call-public-0.3.5.json` and the exact-build regression logs. Apple accepted job `29e15617-40d9-43e2-8685-667779cd21a2`. Signed metadata expires 2026-11-21T23:39:49.696Z.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.5 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.5/Script-Call-0.3.5-darwin-arm64.zip)
- [0.3.5 release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.5)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

The existing website uses the stable download alias; its `/updates/` stays HTML and is not the native feed. Bug/crash reports remain addressed to **alexanderhosier@squidproductions.org**, reviewed before sharing. Release tests used disposable profiles and installations; the installed user app and real projects were not replaced or opened. Apple Silicon/macOS 13+ is validated. Windows/Intel native distribution remains unvalidated. No new credentials, signing keys, domain or DNS settings are needed.

## Previous 0.3.4 release verification

**0.3.4 was the previous public stable notarized release; its real signed 0.3.3 → 0.3.4 native upgrade passed.** It adds local bug/crash reporting to alexanderhosier@squidproductions.org with full review, explicit mail draft and copy/export fallback. The tested candidate has been promoted after remote asset verification; no report is sent automatically.

Native acceptance passed all 14 checks, including real download/native replacement/relaunch, the same custom data store without launcher environment, pending edit, Narrative template, exact issued PDF bytes, import IDs/local edits, backup, demo/images and the reporting review flow. PDF SHA-256 before/after: `ff98e07218ccad06355bd2ce928871d54003dd27aabac6fb3e763cf267b12378`. The exact signed/notarized app also passed all eight isolated reporting/crash checks. Unit/update/release checks: 68; existing desktop: 19; G-Casper: 12; packaged importer: 11. Local evidence: `verification/live-update-0.3.3-to-0.3.4/result.json`, `verification/script-call-0.3.4-notarized-reporter.json` and release logs.

Final public verification passed: an anonymous stable alias ZIP matched the signed immutable artifact (131,308,390 bytes; SHA-256 `88103ffeec717dd6d05ad12f7221e2857ada9de4f570fdbbc5d709ce3d02942b`). Fresh unmodified signed 0.3.3/0.3.4 clients checked the production feed with no test metadata override: 0.3.3 offered 0.3.4, and 0.3.4 reported current. Evidence: `verification/script-call-public-0.3.4.json`.

- [Stable download](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/Script-Call-Mac.zip)
- [Immutable 0.3.4 ZIP](https://github.com/OfficialSquidProductions/script-call-updates/releases/download/v0.3.4/Script-Call-0.3.4-darwin-arm64.zip)
- [Release notes](https://github.com/OfficialSquidProductions/script-call-updates/releases/tag/v0.3.4)
- [Signed stable feed](https://github.com/OfficialSquidProductions/script-call-updates/releases/latest/download/stable-darwin-arm64.json)

Apple Silicon, macOS 13+. Older update-disabled prototypes need one manual bootstrap. Currently running 0.3.3 users can install through Check for updates; the existing local app and original `.local-data` have not been replaced or opened by release tests. Automatic install-on-quit remains disabled. Version 0.3.2 remains superseded/prerelease after its historical asset-permission bug; never reactivate or overwrite its files.

The website at https://scriptcall.squidproductions.org/ uses the stable download alias. The website now retains its 0.3.4 reporting guidance and visible support address; release/download text updates use the existing gh-pages workflow. Its `/updates/` is HTML, so the app retains the signed GitHub JSON feed. Windows/Intel signing and native distribution remain unvalidated.

## Local signing key and trust

The approved per-app Ed25519 key is stored in the local encrypted, non-synchronizing login Keychain: service `org.squidproductions.script-call.release-signing`, account `ed25519-v1`. Existing Developer ID/Apple account setup is reused; no new Apple credentials or broad access grants were created. The signed `tools/release-key.swift` helper creates that item once and refuses replacement. It exposes only public-key and signature operations; private key bytes stay in the helper/Keychain. Normal Keychain access controls remain in effect.

The helper is compiled locally as `.runtime/script-call-release-key` and signed with the existing Developer ID and stable identifier `org.squidproductions.scriptcall.releasekey`. Publisher commands use it by default; `SCRIPT_CALL_RELEASE_HELPER` can select the same approved helper at another path. The helper is never bundled into client apps. Only its PEM public key is embedded in `desktop/update-config.json`. An existing explicitly approved key file remains supported via `SCRIPT_CALL_UPDATE_KEY_FILE`; do not create or export a plaintext key file for this Mac workflow. Never upload keys or credentials to GitHub or clients.

The first enabled version must be installed manually to establish the trusted public key. Key rotation must ship through the existing trusted chain, or require a manual trust-reset install. Losing the key requires a manual trust reset unless a separate recovery copy was explicitly approved.

## Build, sign and notarize

Use Node.js 24+ and the locked dependencies. Run `npm ci`, `npm test`, `npm run test:desktop`, `npm run test:gcasper`, `npm run test:import` and the packaged smoke test. `CALLSHEET_PLAYWRIGHT`/`CALLSHEET_ELECTRON` can select already installed test tools. All tests use temporary stores; never use a real production folder as a test profile.

The prepared Apple Silicon workspace uses `npm run build:mac` to stage an ad-hoc local bundle from its verified Electron runtime. A clean configured release environment can use `npm run build:release:mac`. The Mac signing configuration includes only the V8 JIT entitlement needed by Electron. No device/personal-data entitlements or disabled library validation are required.

Create a separate signed archive using the existing identity/team:

```sh
python3 tools/archive_mac.py --app 'build/mac/Script Call.app' --out build/release/Script-Call-VERSION.xcarchive --identity EXISTING_DEVELOPER_ID --team EXISTING_TEAM
xcodebuild -exportArchive -archivePath build/release/Script-Call-VERSION.xcarchive -exportOptionsPlist /existing/nonsecret/developer-id-upload-options.plist -exportPath build/notarization/VERSION
xcodebuild -exportNotarizedApp -archivePath build/release/Script-Call-VERSION.xcarchive -exportPath build/notarized/VERSION
```

Use existing Xcode authentication and manual developer-id options. Upload success alone is not notarization acceptance: confirm the archive's `Submissions/*/notarization-log.json` says Accepted, then verify the exported app with `codesign --verify --deep --strict`, `xcrun stapler validate` and `spctl --assess --type execute`. Stop for user action if new credentials, permissions, terms or costs are required. Do not add automatic provisioning grants to work around an account problem.

## Prepare immutable artifacts

Increase `package.json` and lockfile versions and write release notes. Preserve the app ID, origin, profile, SQLite/archive schema, recovery filename and stable demo/import IDs. Exclude test-only fixtures and demo scripts from shipping resources; preserve previously saved/imported project records. Do not replace an already published versioned artifact.

```sh
npm run release:prepare -- build/Script-Call-VERSION-darwin-arm64.zip 'build/notarized/VERSION/Script Call.app' arm64 release-notes/VERSION.txt build/releases
```

The command checks the exact Developer ID signed, notarized bundle and architecture, makes its ZIP, hashes it and signs the release envelope with the Keychain helper. Output: `build/releases/VERSION/darwin-arm64/` containing the immutable versioned ZIP, `stable.json`, `stable-darwin-arm64.json`, release notes and `SHA512SUMS`. Metadata authenticates identity, version, stable channel, expiry, architecture, minimum kernel version, artifact URL, byte size and SHA-512. Artifact URLs include `/releases/download/vVERSION/`.

## Publish and verify

The CLI requires an explicit candidate or promotion operation. Candidate publication uploads to a draft, verifies every asset digest/size, then marks it prerelease with `latest=false`; stable clients keep the previous release. Use existing GitHub authentication only.

```sh
npm run release:publish -- build/releases/VERSION/darwin-arm64 --candidate
CALLSHEET_UPGRADE_FROM=PREVIOUS CALLSHEET_UPGRADE_TO=VERSION CALLSHEET_CANDIDATE_FEED=https://github.com/OfficialSquidProductions/script-call-updates/releases/download/vVERSION/stable-darwin-arm64.json node tests/live-update.cjs
# Review/stage source and secrets, commit and push main after checks pass.
git push origin main
npm run release:publish -- build/releases/VERSION/darwin-arm64 --promote verification/live-update-PREVIOUS-to-VERSION/result.json
# Verify public stable metadata/alias and unmodified old/new native clients, then:
git tag vVERSION
git push origin vVERSION
```

Replace PREVIOUS/VERSION with exact versions. The pre-promotion native test routes only the disposable old process's metadata fetch to the exact public candidate URL; no distributed app config or trust check is changed. The actual public ZIP download and Squirrel native code-signature/install/restart path are exercised. Promotion requires a passed result for this version, matching artifact SHA-512 and native relaunch PID, then verifies the public candidate inventory/digests again before selecting latest. Refuse existing versioned artifacts instead of overwriting them. If a check fails, leave the candidate prerelease and stable unchanged; preserve evidence.

Verify the final public path anonymously: Ed25519 metadata signature, alias byte count/SHA-512 equal to the immutable ZIP, Developer ID/staple/Gatekeeper, and an unmodified previous client discovering the new version through the stable feed. The updates repository's tags refer to minimal release metadata; the corresponding source tag lives in the public MIT source repository. No new CI, subscription or paid hosting is used. Keep `/updates/` HTML out of the native feed. The website should use the stable download alias and update release text only after promotion.

Native acceptance uses signed notarized N and N+1, actual metadata/download/install/relaunch, an isolated persisted custom store, local edits, both templates, Production Desk import IDs, an issued PDF byte hash, stable saved fixture records, availability, and blank new production after upgrade. Record signature/ticket/Gatekeeper checks and exact public URLs/hashes. Also test offline, invalid signatures/hashes, wrong OS/architecture/channel and failed save/backup handling.

## Data safety and recovery

Native macOS restart need not retain launcher environment variables. An explicit `CALLSHEET_DATA_DIR` choice is therefore remembered in a user-private installation-local `.script-call-profile-USER.json` beside the app, outside its signed bundle. Native bundle replacement preserves it. If the setting cannot be persisted, installation is blocked; malformed/shared settings refuse silent fallback. No project data is moved. Ordinary installations retain the legacy Call Sheet Prototype profile and `local-projects/` path. The original project launcher retains `.local-data/`.

Updating saves edits and creates a consistent SQLite backup before restart. Automatic install-on-quit is disabled. Failed saves/backups or an active PDF issue block installation. Preserve the previous signed app and backups for manual recovery; do not auto-downgrade or overwrite current databases.

Signed metadata expires after 30 days to limit replay. Publish a new, tested version with fresh metadata when shipping subsequent changes; expired/offline checks fail gracefully and never remove the installed app. Preserve the signing Keychain item and existing Developer ID account. No new hosting subscription or signing credentials are required.
