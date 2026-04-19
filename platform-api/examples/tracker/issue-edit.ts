//
// Copyright © 2025 Intabia Fusion
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//

import { ConnectOptions, NodeWebSocketFactory, connect } from '@intabiafusion/api/api-client'
import { SortingOrder } from '@intabiafusion/api/core'
import tracker, { IssuePriority } from '@intabiafusion/api/tracker'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

/**
 * Edit latest issue in the project: change title, priority and description.
 */
async function main (): Promise<void> {
  const client = await connect(url, options)
  try {
    const project = await client.findOne(tracker.class.Project, {
      identifier: process.env.PLATFORM_PROJECT ?? 'TSK'
    })
    if (project === undefined) throw new Error('Project not found')

    const issue = await client.findOne(
      tracker.class.Issue,
      { space: project._id },
      { sort: { modifiedOn: SortingOrder.Descending } }
    )
    if (issue === undefined) throw new Error('No issues found')

    console.log('editing:', issue.identifier, issue.title)

    const newDescription = await client.uploadMarkup(
      tracker.class.Issue,
      issue._id,
      'description',
      `# ${issue.identifier} updated\n\nUpdated at ${new Date().toISOString()}\n\n- change 1\n- change 2`,
      'markdown'
    )

    await client.updateDoc(
      tracker.class.Issue,
      project._id,
      issue._id,
      {
        title: `${issue.title} [edited ${new Date().toISOString()}]`,
        priority: IssuePriority.High,
        description: newDescription
      }
    )

    const after = await client.findOne(tracker.class.Issue, { _id: issue._id })
    console.log('updated:', after?.identifier, after?.title, 'priority=', after?.priority)
    if (after?.description != null && after.description !== '') {
      const md = await client.fetchMarkup(after._class, after._id, 'description', after.description, 'markdown')
      console.log('--- description ---')
      console.log(md)
    }
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
