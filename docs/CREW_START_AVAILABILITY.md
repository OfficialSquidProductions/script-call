# Crew list position and Personal Call availability

Implemented on top of released 0.3.13 and prepared for the explicitly authorized 0.3.14 patch release. User productions and the installed app remain untouched.

## Behavior and causes

The Called checkbox previously called the entire workspace renderer. Replacing the editor discarded its scroll container and focused checkbox. It now refreshes only the cast/crew list, captures the acted-on person's stable row and restores its position and focus. Full same-list renders also restore a visible row and editing focus. Advanced disclosure state is saved by production/day/type/person. Changing sections or productions does not carry unrelated scroll positions.

Availability advice now uses only the effective Personal Call, its day offset and shooting-day timezone, converted to the production timezone. It does not include pickup/preparation, scene timing, explicit release or inferred wrap. The stored timing fields and independent validation remain intact. Window starts are inclusive and ends exclusive. A next-day start uses that production-local date's entry and overnight carry-in; explicit unavailability overrides carry-in. Missing calls, unknown dates and ambiguous/skipped DST times remain neutral. All Day and O/C retain distinct labels. A conflict remains nonblocking and shows allowed hours until the start is corrected.

The reported screenshot and read-only saved example were inspected. The 19:30 personal call on October 26 was inside the recorded 10:00-to-following-midnight window in America/New_York. The earlier warning extended it through the 03:00 wrap. The new assessor and issue review clear that availability warning without changing any saved value. No private production fixture or screenshot is included in source.

## Verification

- Full Node suite: 155 tests, 153 passed, two pre-existing skips, zero failures. New coverage checks every minute of the 10:00-to-midnight day for both cast and crew; explicit/inferred late release; preparation and scheduled work independence; multiple windows and exclusive ends; corrected/re-invalidated calls; unavailable/unknown/missing calls/All Day/O-C; next-day offsets, timezone conversion and DST; AM/PM and 24-hour text; independent issue-review validation.
- Packaged Apple Silicon Mac preview built and launched directly with dedicated projects/settings/logs/crash/diagnostics/backup storage. Native CUA mouse/keyboard checks used 80 crew and 20 cast. Mid-list and final-row call/uncall kept the row visible and focused; repeated Space toggles stayed on the same checkbox. Advanced state survived uncall/recall, rerender and reopening. Save and display-preference rerenders retained list context.
- Native live advice checked 09:59 conflict, 10:00 valid, 23:59 valid, next-day 00:00 conflict and 14:30 valid, then invalid/corrected 12-hour times. Cast boundary checks also passed with a retained 03:00 release. Genuine warnings permit saving. Reopen preserved canonical calls, offsets, releases and display preference.
- Native issue generated a 654,031-byte PDF. Its exact SHA-256 remained `4d929ece410cc24f27fe74e22d912dfc5567290c50903d659938dd340b3c0ea2` after a new draft and conflicting call edit. Actual portable archive export/import retained all 100 stable person records, availability, canonical calls, display preference and the original issued PDF.
- Read-only before/after comparisons: all nine real project JSON hashes and all 654 installed-app file hashes unchanged. Current saved example evaluates as available with no availability warning in issue review.

Updated existing Playwright regression expectations for the explicitly changed start-only rule; syntax checks passed. Those desktop harnesses were not executed for this local task because the prior release-specific automation grant does not carry over. Native CUA provided the current UI verification. No native upgrade, signing/notarization or release test was needed or performed. Windows/Linux UI, physical touch and formal assistive-technology auditing remain untested.

Local preview: `build/crew-start-scroll-preview/Script Call.app`. Evidence is in ignored `verification/crew-start-*`; synthetic profile stays under the preview build directory. The preview was closed normally after testing.

## Authorized0.3.14 release gates

The subsequent feature-specific user grant covered Playwright release/upgrade tests and publication. All fifteen exact-notarized packaged regression/smoke suites passed:150 explicit Mac UI checks plus packaged smoke. The new nine-check harness verifies mid/last-row anchors, repeated keyboard/mouse actions, mounted preview retention, stable Advanced preferences, start boundaries, live correction, offset dates, AM/PM and save/reopen. The earlier missing-field failure was a synthetic fixture setup issue; required preparation strings were added and the complete harness passed on the exact signed/notarized build.

Apple accepted job `4f5b8dd9-049f-4768-a23b-f9503aff04e6`; Developer ID signature, stapling, Gatekeeper and runtime-source hashes passed. The signed updater ZIP SHA-256 is `cac4c3708182dea3f05e14d070e1c1262682be0b79ebd2be8ad09e062a9ffbe5`. Genuine public0.3.13→candidate0.3.14 native acceptance passed33 checks with all required assertions, including native replacement/relaunch, saved pending edit, direct reopen, actual database/PDF recovery backup, stable Production Desk IDs, portable preferences/recovery and exact issued PDF bytes. The pre-upgrade explicit03:00-release conflict clears under the new personal-start rule without rewriting the saved call/release. Source, stable/feed, website and fresh-download verification are recorded separately in the release completion checkpoint.
