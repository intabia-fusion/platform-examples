# platform-api examples

Examples for `@intabiafusion/api` — single publishable bundle for Intabia Fusion
platform API.

## Install

By default uses `@intabiafusion/api` from the npm registry:
```bash
npm install
```

### Use a local tarball

Download `intabiafusion-api-<version>.tgz` (from a CI artifact or
`dev/api/bundle` in the foundation repo) into `./tarballs/`, then:
```bash
./use-local.sh                          # newest tarball in ./tarballs/
./use-local.sh path/to/custom.tgz       # explicit path
```

Switch back to npm:
```bash
./use-npm.sh                 # ^1.0.0
./use-npm.sh 1.2.3           # pin a version
```

## Run

Set env vars:
```bash
export PLATFORM_URL=http://localhost:8087
export PLATFORM_EMAIL=user1
export PLATFORM_PASSWORD=1234
export PLATFORM_WORKSPACE=ws1
export PLATFORM_PROJECT=TSK
```

Then any example:
```bash
npx ts-node examples/tracker/issue-create.ts
```

## Layout

- `tracker/` — issues, sub-issues, labels, edit/update (REST + WS)
- `chunter/` — channels, messages
- `contact/` — persons
- `documents/` — teamspaces, documents
- `ws/` — WebSocket-only: `live-query.ts` subscribes to live tx stream

## REST vs WebSocket

- REST: CRUD, markup. No model on client.
- WebSocket: reactive live queries via `client.createLiveQuery()`.

See [`MIGRATION.md`](./MIGRATION.md) for migration from the per-package
layout.
