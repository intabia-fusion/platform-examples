//
// Copyright © 2025 Intabia Fusion
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//

import { ConnectOptions, NodeWebSocketFactory, connect } from '@intabiafusion/api/api-client'
import { SortingOrder, generateId, type Markup } from '@intabiafusion/api/core'
import chunter, { type ChatMessage, type ThreadMessage } from '@intabiafusion/api/chunter'
import { htmlToMarkup } from '@intabiafusion/api/text'

const url = process.env.PLATFORM_URL ?? 'http://localhost:8087'
const options: ConnectOptions = {
  email: process.env.PLATFORM_EMAIL ?? 'user1',
  password: process.env.PLATFORM_PASSWORD ?? '1234',
  workspace: process.env.PLATFORM_WORKSPACE ?? 'ws1',
  socketFactory: NodeWebSocketFactory,
  connectionTimeout: 30000
}

const CHANNEL_NAME = process.env.PLATFORM_CHANNEL ?? 'general'

function asMarkup (html: string): Markup {
  // ChatMessage.message stores ProseMirror JSON serialized as a string
  return htmlToMarkup(html)
}

/**
 * Post a message into a channel and reply in a thread.
 */
async function main (): Promise<void> {
  const client = await connect(url, options)
  try {
    const channel = await client.findOne(chunter.class.Channel, { name: CHANNEL_NAME })
    if (channel === undefined) throw new Error(`channel "${CHANNEL_NAME}" not found`)

    const messageId = generateId<ChatMessage>()
    await client.addCollection(
      chunter.class.ChatMessage,
      channel._id,
      channel._id,
      channel._class,
      'messages',
      { message: asMarkup(`<p>hello from platform-api at ${new Date().toISOString()}</p>`) },
      messageId
    )
    console.log('posted message:', messageId)

    const threadId = generateId<ThreadMessage>()
    await client.addCollection<ChatMessage, ThreadMessage>(
      chunter.class.ThreadMessage,
      channel._id,
      messageId,
      chunter.class.ChatMessage,
      'replies',
      {
        message: asMarkup('<p>reply in thread</p>'),
        objectId: channel._id,
        objectClass: channel._class
      },
      threadId
    )
    console.log('posted thread reply:', threadId)

    const replies = await client.findAll(
      chunter.class.ThreadMessage,
      { attachedTo: messageId },
      { sort: { modifiedOn: SortingOrder.Ascending } }
    )
    console.log('thread replies:', replies.length)
    for (const r of replies) {
      console.log(' ', r.message ?? '')
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
