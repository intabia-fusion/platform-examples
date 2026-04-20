# Migration Guide — `@intabia-fusion/api` bundle

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
import { connect } from '@intabia-fusion/api/api-client'
import core, { type Ref } from '@intabia-fusion/api/core'
import tracker, { type Issue } from '@intabia-fusion/api/tracker'
import { LiveQuery } from '@intabia-fusion/api/query'
```

Short name after the `@intabiafusion/` scope maps 1:1 to the subpath of
`@intabia-fusion/api`. E.g. `@intabiafusion/contact` -> `@intabia-fusion/api/contact`.

Bundled roots: `api-client`, `account-client`, `client`, `client-resources`,
`core`, `query`, `tracker`, `chunter`, `contact`, `card`, `chat`, `task`,
`document`, `rank`, `tags`.

## `package.json`

Before:
```json
{
  "dependencies": {
    "@intabiafusion/api-client": "^0.7.18",
    "@intabiafusion/core": "^0.7.x",
    "@intabiafusion/tracker": "^0.7.x",
    "@intabiafusion/query": "^0.7.x",
    "ws": "^8.18.2"
  }
}
```

After:
```json
{
  "dependencies": {
    "@intabia-fusion/api": "^1.0.0",
    "ws": "^8.18.2"
  }
}
```

Remove every `@intabiafusion/*` dependency — they are all bundled.

## Bulk codemod

```bash
# macOS
grep -rlE "@intabiafusion/(api-client|core|tracker|chunter|contact|card|chat|task|document|rank|tags|query|client|client-resources|account-client)" src \
  | xargs sed -i '' -E 's|@intabiafusion/([a-z0-9-]+)|@intabia-fusion/api/\1|g'

# Linux
grep -rlE "@intabiafusion/(api-client|core|...)" src \
  | xargs sed -i -E 's|@intabiafusion/([a-z0-9-]+)|@intabia-fusion/api/\1|g'
```

Then drop obsolete entries from `package.json` by hand.

## Registry

No GitHub Packages token needed anymore — `@intabia-fusion/api` is on the
public npm registry (`registry.npmjs.org`). Remove any `.npmrc` entry like
`@intabiafusion:registry=https://npm.pkg.github.com/`.

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
import { LiveQuery } from '@intabiafusion/query'
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
