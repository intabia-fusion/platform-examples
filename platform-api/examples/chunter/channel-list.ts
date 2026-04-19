//
// Copyright © 2025 Intabia Fusion
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//

import { ConnectOptions, NodeWebSocketFactory, connect } from '@intabiafusion/api/api-client'
import { SortingOrder } from '@intabiafusion/api/core'
import chunter from '@intabiafusion/api/chunter'
import { markupToText } from '@intabiafusion/api/text-core'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

/**
 * List channels in the workspace with last messages per channel.
 */
async function main (): Promise<void> {
  const client = await connect(url, options)
  try {
    const channels = await client.findAll(chunter.class.Channel, {})
    console.log('channels:', channels.length)

    for (const ch of channels) {
      console.log(`- ${ch.name}${ch.topic !== undefined ? ` (${ch.topic})` : ''} [${ch.messages ?? 0} msgs]`)

      const messages = await client.findAll(
        chunter.class.ChatMessage,
        { attachedTo: ch._id },
        { limit: 3, sort: { modifiedOn: SortingOrder.Descending } }
      )
      for (const m of messages) {
        const text = m.message !== undefined && m.message !== '' ? markupToText(m.message) : ''
        console.log(`    [${new Date(m.modifiedOn).toISOString()}] ${text}`)
      }
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
