//
// Copyright © 2026 Intabia Fusion
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { ConnectOptions, NodeWebSocketFactory, connect } from '@intabia-fusion/api/api-client'
import core, { SortingOrder, generateId, type Ref } from '@intabia-fusion/api/core'
import { makeRank } from '@intabia-fusion/api/rank'
import tracker, { type Issue, IssuePriority } from '@intabia-fusion/api/tracker'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

/**
 * Subscribe to Issue changes via LiveQuery, create an issue in parallel,
 * observe the reactive update.
 */
async function main (): Promise<void> {
  const client = await connect(url, options)
  try {
    const project = await client.findOne(tracker.class.Project, {
      identifier: process.env.PLATFORM_PROJECT ?? 'TSK'
    })
    if (project === undefined) throw new Error('Project not found')

    const lq = client.createLiveQuery()

    let received = 0
    const unsubscribe = lq.query(
      tracker.class.Issue,
      { space: project._id },
      (result) => {
        received++
        console.log(`[live] update #${received}, total issues:`, result.length)
      },
      { sort: { modifiedOn: SortingOrder.Descending }, limit: 5 }
    )

    await new Promise((r) => setTimeout(r, 500))

    const issueId: Ref<Issue> = generateId()
    const inc = await client.updateDoc(
      tracker.class.Project, core.space.Space, project._id, { $inc: { sequence: 1 } }, true
    )
    const sequence = (inc as any).object.sequence
    const last = await client.findOne<Issue>(
      tracker.class.Issue, { space: project._id }, { sort: { rank: SortingOrder.Descending } }
    )

    await client.addCollection(
      tracker.class.Issue,
      project._id,
      tracker.ids.NoParent,
      tracker.class.Issue,
      'subIssues',
      {
        title: `Live query demo ${sequence}`,
        description: null,
        status: project.defaultIssueStatus,
        number: sequence,
        kind: tracker.taskTypes.Issue,
        identifier: `${project.identifier}-${sequence}`,
        priority: IssuePriority.Low,
        assignee: null,
        component: null,
        estimation: 0,
        remainingTime: 0,
        reportedTime: 0,
        reports: 0,
        subIssues: 0,
        parents: [],
        childInfo: [],
        dueDate: null,
        rank: makeRank(last?.rank, undefined)
      },
      issueId
    )

    await new Promise((r) => setTimeout(r, 1500))
    unsubscribe()
    console.log(`done, received ${received} live updates`)
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  void main().catch((err) => { console.error(err); process.exit(1) })
}
