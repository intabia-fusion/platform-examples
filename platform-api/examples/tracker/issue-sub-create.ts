//
// Copyright © 2025 Intabia Fusion
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//

import { ConnectOptions, NodeWebSocketFactory, connect } from '@intabiafusion/api/api-client'
import core, { type Ref, SortingOrder, generateId } from '@intabiafusion/api/core'
import { makeRank } from '@intabiafusion/api/rank'
import tracker, { type Issue, IssuePriority } from '@intabiafusion/api/tracker'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

/**
 * Create a sub-issue attached to an existing parent issue.
 * Sub-issue differs from a root issue in attachedTo/attachedToClass/parents:
 *   - attachedTo      = parent issue _id (not tracker.ids.NoParent)
 *   - attachedToClass = tracker.class.Issue
 *   - collection      = 'subIssues'
 *   - parents         = [{ parentId, identifier, parentTitle, space }]
 */
async function main (): Promise<void> {
  const client = await connect(url, options)

  try {
    const project = await client.findOne(tracker.class.Project, {
      identifier: process.env.PLATFORM_PROJECT ?? 'TSK'
    })
    if (project === undefined) throw new Error('Project not found')

    // Pick a parent: env override or first root issue in the project.
    const parentIdentifier = process.env.PLATFORM_PARENT
    const parent =
      parentIdentifier !== undefined
        ? await client.findOne(tracker.class.Issue, { identifier: parentIdentifier })
        : await client.findOne(
            tracker.class.Issue,
            { space: project._id, attachedTo: tracker.ids.NoParent },
            { sort: { modifiedOn: SortingOrder.Descending } }
          )
    if (parent === undefined) throw new Error('Parent issue not found')
    console.log('parent:', parent.identifier, parent.title)

    const subIssueId: Ref<Issue> = generateId()

    // Increment project sequence to obtain next issue number.
    const incResult = await client.updateDoc(
      tracker.class.Project,
      core.space.Space,
      project._id,
      { $inc: { sequence: 1 } },
      true
    )
    const sequence = (incResult as any).object.sequence

    const lastOne = await client.findOne<Issue>(
      tracker.class.Issue,
      { space: project._id },
      { sort: { rank: SortingOrder.Descending } }
    )

    const description = await client.uploadMarkup(
      tracker.class.Issue,
      subIssueId,
      'description',
      `# Sub-task of ${parent.identifier}\n\nBreak down the parent into smaller work items.`,
      'markdown'
    )

    await client.addCollection(
      tracker.class.Issue,
      project._id,
      parent._id,
      tracker.class.Issue,
      'subIssues',
      {
        title: `Sub of ${parent.identifier}`,
        description,
        status: project.defaultIssueStatus,
        number: sequence,
        kind: tracker.taskTypes.Issue,
        identifier: `${project.identifier}-${sequence}`,
        priority: IssuePriority.Medium,
        assignee: null,
        component: null,
        estimation: 0,
        remainingTime: 0,
        reportedTime: 0,
        reports: 0,
        subIssues: 0,
        parents: [
          {
            parentId: parent._id,
            identifier: parent.identifier,
            parentTitle: parent.title,
            space: parent.space
          },
          ...parent.parents
        ],
        childInfo: [],
        dueDate: null,
        rank: makeRank(lastOne?.rank, undefined)
      },
      subIssueId
    )

    const created = await client.findOne(tracker.class.Issue, { _id: subIssueId })
    console.log('created sub-issue:', created?.identifier, '->', created?.attachedTo)
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  void main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
