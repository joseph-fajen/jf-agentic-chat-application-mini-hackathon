import { getLogger } from "@/core/logging";

import {
  ConversationNotFoundError,
  MessageNotFoundError,
  MessageNotInConversationError,
} from "./errors";
import type { Conversation, Message } from "./models";
import * as repository from "./repository";

const logger = getLogger("chat.service");

export async function createConversation(title: string): Promise<Conversation> {
  logger.info({ title }, "conversation.create_started");

  const conversation = await repository.createConversation({ title });

  logger.info({ conversationId: conversation.id }, "conversation.create_completed");
  return conversation;
}

export async function getConversation(id: string): Promise<Conversation> {
  logger.info({ conversationId: id }, "conversation.get_started");

  const conversation = await repository.findConversationById(id);

  if (!conversation) {
    logger.warn({ conversationId: id }, "conversation.get_failed");
    throw new ConversationNotFoundError(id);
  }

  logger.info({ conversationId: id }, "conversation.get_completed");
  return conversation;
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  logger.info({ conversationId: id }, "conversation.update_started");

  const updated = await repository.updateConversation(id, { title });

  if (!updated) {
    logger.warn({ conversationId: id }, "conversation.update_failed");
    throw new ConversationNotFoundError(id);
  }

  logger.info({ conversationId: id }, "conversation.update_completed");
  return updated;
}

export async function deleteConversation(id: string): Promise<void> {
  logger.info({ conversationId: id }, "conversation.delete_started");

  const deleted = await repository.deleteConversation(id);

  if (!deleted) {
    logger.warn({ conversationId: id }, "conversation.delete_failed");
    throw new ConversationNotFoundError(id);
  }

  logger.info({ conversationId: id }, "conversation.delete_completed");
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  logger.info({ conversationId }, "messages.get_started");

  const msgs = await repository.findMessagesByConversationId(conversationId);

  logger.info({ conversationId, count: msgs.length }, "messages.get_completed");
  return msgs;
}

export async function addMessage(
  conversationId: string,
  role: string,
  content: string,
): Promise<Message> {
  logger.info({ conversationId, role }, "message.add_started");

  const message = await repository.createMessage({ conversationId, role, content });

  logger.info({ conversationId, messageId: message.id }, "message.add_completed");
  return message;
}

export function generateTitleFromMessage(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 50) {
    return trimmed;
  }
  return `${trimmed.substring(0, 50)}...`;
}

export async function forkConversation(
  conversationId: string,
  messageId: string,
): Promise<Conversation> {
  logger.info({ conversationId, messageId }, "conversation.fork_started");

  // Verify source conversation exists
  const sourceConversation = await repository.findConversationById(conversationId);
  if (!sourceConversation) {
    logger.warn({ conversationId }, "conversation.fork_failed_not_found");
    throw new ConversationNotFoundError(conversationId);
  }

  // Verify message exists
  const forkMessage = await repository.findMessageById(messageId);
  if (!forkMessage) {
    logger.warn({ messageId }, "conversation.fork_failed_message_not_found");
    throw new MessageNotFoundError(messageId);
  }

  // Verify message belongs to conversation
  if (forkMessage.conversationId !== conversationId) {
    logger.warn({ messageId, conversationId }, "conversation.fork_failed_message_mismatch");
    throw new MessageNotInConversationError(messageId, conversationId);
  }

  // Get messages up to fork point
  const messagesToCopy = await repository.findMessagesUpToId(conversationId, forkMessage.createdAt);

  // Create branch title
  const branchTitle = sourceConversation.title.includes("(branch)")
    ? sourceConversation.title
    : `${sourceConversation.title} (branch)`;

  // Create new conversation with copied messages
  const newConversation = await repository.createConversationWithMessages(
    {
      title: branchTitle,
      parentConversationId: conversationId,
      branchFromMessageId: messageId,
    },
    messagesToCopy.map((m) => ({ role: m.role, content: m.content })),
  );

  logger.info(
    {
      conversationId,
      newConversationId: newConversation.id,
      messagesCopied: messagesToCopy.length,
    },
    "conversation.fork_completed",
  );

  return newConversation;
}
