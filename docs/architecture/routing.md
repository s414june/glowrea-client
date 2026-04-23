# Routing Architecture

See also: `docs/architecture/app-shell-navigation.md` for app shell navigation and Lucide icon rendering architecture.

## `/home`

- Role: home timeline page entry after login.
- Owns: page-level layout, invoking timeline feature composable, wiring retry/refresh/load more actions.
- Does not own: Mastodon response transformation, dedupe policy, token persistence, OAuth flow.

## Responsibilities Split

- Route page: orchestrates states and interactions.
- Composable: controls loading, pagination, dedupe, and error recovery.
- API layer: calls local server endpoint and maps transport errors.
- Server endpoint: talks to Mastodon upstream with token from runtime config.
