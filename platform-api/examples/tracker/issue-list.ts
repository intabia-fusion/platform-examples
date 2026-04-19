//
// Copyright © 2025 Intabia Fusion
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
import { SortingOrder } from '@intabia-fusion/api/core'
import task from '@intabia-fusion/api/task'
import tracker from '@intabia-fusion/api/tracker'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

/**
 * Example demonstrating how to list issues in a project using the Platform API.
 * This script:
 * 1. Finds a project by identifier
 * 2. Fetches all issues in the project
 */
async function main (): Promise<void> {
  const client = await connect(url, options)

  try {
    // List projects (pick first one found)
    const projects = await client.findAll(tracker.class.Project, {}, {
      lookup: { type: task.class.ProjectType }
    })
    console.log('projects:', projects.map((p) => p.identifier))
    const project = projects[0]
    if (project === undefined) {
      throw new Error('No projects in workspace')
    }
    console.log('project:', project.identifier, project.description)
    if (project.$lookup?.type !== undefined) {
      const projectType = project.$lookup.type
      for (const status of projectType.statuses) {
        console.log('-', status)
      }
    }

    // Find issues in the project
    const issues = await client.findAll(
      tracker.class.Issue,
      {
        space: project._id
      },
      {
        limit: 20,
        sort: {
          modifiedOn: SortingOrder.Descending
        }
      }
    )

    console.log('found issues:', issues.length)
    for (const issue of issues) {
      console.log('-', issue.identifier, issue.title)
      if (issue.description) {
        const markup = await client.fetchMarkup(issue._class, issue._id, 'description', issue.description, 'markdown')
        console.log('  ', markup)
      }
    }
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  void main()
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
