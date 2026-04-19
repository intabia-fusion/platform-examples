# Migration Guide — `@intabiafusion/api` bundle

Single bundle replacing many `@intabiafusion/*` packages.

## Imports

Before:
```ts
import { connect } from '@intabiafusion/api-client'
import core, { type Ref } from '@intabiafusion/core'
import tracker, { type Issue } from '@intabiafusion/tracker'
import { LiveQuery } from '@intabiafusion/query'
```

After:
```ts
import { connect } from '@intabiafusion/api/api-client'
import core, { type Ref } from '@intabiafusion/api/core'
import tracker, { type Issue } from '@intabiafusion/api/tracker'
import { LiveQuery } from '@intabiafusion/api/query'
```

Bundled roots: `api-client`, `account-client`, `client`, `client-resources`,
`core`, `query`, `tracker`, `chunter`, `contact`, `card`, `chat`, `task`,
`document`, `rank`, `tags`.

## `package.json`

```json
{
  "dependencies": {
    "@intabiafusion/api": "^1.0.0",
    "ws": "^8.18.2"
  }
}
```

Remove every other `@intabiafusion/*` dependency.

## REST vs WebSocket

- REST (`createRestClient`): CRUD, markup upload/fetch. No model download.
  Server routes `update`/`remove` via `isDerived(AttachedDoc)`.
- WebSocket (`connect` → `PlatformClient`): reactive live queries, full model,
  tx subscription.

### REST — new operations

`createRestClient(endpoint, workspaceId, token, collaboratorEndpoint?)` now
exposes:
- `updateDoc`, `updateCollection`
- `removeDoc`, `removeCollection`
- `uploadMarkup`, `fetchMarkup` (require `collaboratorEndpoint`)

All delegate to server `/api/v1/update` and `/api/v1/remove`. Server dispatches
to doc vs collection based on class hierarchy — no client-side model required.

### WebSocket — LiveQuery

Before (raw `Client` exposed):
```ts
const lq = new LiveQuery(client as any)
```

After:
```ts
const lq = client.createLiveQuery()
lq.query(tracker.class.Issue, { space }, (result) => { ... })
```

`createLiveQuery()` wires the underlying connection's `notify` to feed
transactions into the `LiveQuery` instance. Multiple calls chain.

## Root issue constants

Root issue (no parent) uses sentinels:
```ts
attachedTo: tracker.ids.NoParent
attachedToClass: tracker.class.Issue
collection: 'subIssues'
```

Not `project._id` / `'issues'`.

## `identifier` is client-side

Server `IdentifierMiddleware` only generates values for attributes typed as
`TypeIdentifier`. `Issue.identifier` is `IntlString` — the client must build
`${project.identifier}-${sequence}` after `$inc: { sequence: 1 }` on the
project.
