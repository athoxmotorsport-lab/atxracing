# ACC restoration parity — work in progress

Reference: the checked-in `legacy-acc/` snapshot of `athoxmotorsport-lab/atx-racing`.
`sync_acc.py` copies its production HTML, CSS, JS and assets into each language
directory. It modifies HTML only for the multi-game Steam return URL, the
document language and the language/game controls. It does not modify the
production ACC CSS or JavaScript bundles.

| Production page | New ACC page | Source structure | Live-data script |
| --- | --- | --- | --- |
| `index.html` | `index.html` | copied | `main.min.js`, `home-experience.min.js` |
| `classement.html` | `classement.html`, `ranking.html` | copied, includes points/circuit/driver/team tabs | `main.min.js`, `ranking-session-labels.min.js`, driver/team premium |
| `calendrier.html` | `calendrier.html`, `calendar.html` | copied | `main.min.js` |
| `course.html` | `course.html`, `event.html` | copied | `main.min.js` |
| `profil-pilote.html` | `profil-pilote.html`, `profile.html` | copied | `main.min.js`, `profile-identity-enhancements.min.js` |
| `reglement.html` | `reglement.html`, `rules.html` | copied | `main.min.js` |
| `gtworld.html` | `gtworld.html`, `worldgt.html` | copied | `gtworld.min.js`, `category-sections.min.js` |
| `daily-race.html` | `daily-race.html` | copied | `category-sections.min.js` |
| `open-lobby.html` | `open-lobby.html`, `ballade.html` | copied | `category-sections.min.js` |
| `archives.html` | `archives.html` | copied | `main.min.js` |
| `confidentialite.html` | `confidentialite.html`, `privacy.html` | copied | `main.min.js` |
| `event-admin.html` | `event-admin.html` | copied | existing admin scripts |

The existing `records.html` route points to the original circuit ranking tab
on `classement.html`. The two older `events/*.html` files are also mirrored.

**Still to resolve before stage-2 approval:** the source application translates
only French and English. German, Italian and Spanish need complete translations
of original editorial and dynamic copy while keeping its markup and styles.
The Steam sign-in callback and all pages also need an end-to-end browser check
on the published preview. Do not treat the current generation as stage-2 sign-off.
