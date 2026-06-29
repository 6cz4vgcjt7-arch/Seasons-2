# Changelog

## v1.1.6 — Seasonal Change Reflection

- Adds a conservative Seasonal Change detection engine.
- Shows “We’ve noticed a seasonal change” only after several Weekly Reviews, with fewer reviews required in Beta Mode for testing.
- Uses debt movement, foundation movement, and repeated pattern notices to suggest when the current season may no longer fit.
- Adds a reflective question before making a season recommendation: “What feels most important right now?”
- Keeps the user in control with “Enter [Season]” or “Continue in [Current Season]”.
- Clears/dismisses the seasonal change prompt after the user chooses, so the app does not nag on the same review history.
- Updates season start date when the user actually changes seasons.
- Version bumped to v1.1.6 / Build 116.

## v1.1.5 — Beta Review Testing

- Added Beta Mode in Settings.
- Allows multiple Weekly Reviews to be entered in one sitting using a selected review date.
- Added backdated test review seeding to quickly trigger multi-week pattern recognition.
- Added review history clearing for testing without changing current balances.
- Beta snapshots are marked in exported review history.
- Version bumped to v1.1.5 / Build 115.

## v1.1.4 — Weekly Pattern Recognition

- Adds several-week balance pattern recognition across all active accounts, not just the Focus account.
- Debt accounts are watched for balances that increase or fail to meaningfully decrease across several reviews.
- Foundation accounts are watched for balances that decrease or remain mostly flat across several reviews.
- Weekly Review now shows a gentle “Pattern noticed” card when an account has been off track for several reviews.
- Account detail pages now include a Balance Pattern status.
- Excel export now includes current balances, pattern status/message, and historical Weekly Review snapshots.
- Version bumped to v1.1.4 / Build 114.

## v1.1.3 — Foundation Export Season Drilldown

- Removed debt-only behavior from Foundation accounts: no APR, minimum payment, statement day, or promotional APR fields are saved for Emergency Fund / Retirement accounts.
- Added Excel-compatible account balance export from Settings.
- Updated Current Season page so the current season card drills into more detailed season guidance.
- Added detailed pages for Establish, Grow, Steward, and Preserve, including mission, attention areas, and reflection prompt.


## v1.1.0 — Catch-Up Release

- Restores the stable v1.0 baseline.
- Adds Foundation account support for Emergency Fund and Retirement.
- Splits Accounts into Active Debts and Foundations.
- Foundation account forms hide debt-only fields.
- Command page uses logo + reflection line.
- Command page order is Weekly Review, Season, Focus.
- Focus card opens the focus account detail.
- Season card opens Current Season detail.
- Balance changes are interpreted differently for debts and foundations.
- Privacy language simplified.


## v1.1.1 — Command Card Click Fix

- Fixed Season card on Command tab not opening Current Season detail.
- Strengthened delegated tap handling so nested card content still triggers the card action.
- Version bumped to v1.1.1 / Build 111.


## v1.1.2 — Founder Brief Alignment

- Restores missing Command card action handlers for Season and Focus.
- Makes the Weekly Review card itself tappable, not only the button.
- Adds a quiet explanation on the Focus card for why that account deserves attention.
- Keeps Foundation account detail screens from showing debt-only fields.
- Version bumped to v1.1.2 / Build 112.
