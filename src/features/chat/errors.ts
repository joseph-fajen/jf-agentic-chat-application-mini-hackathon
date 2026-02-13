import type { HttpStatusCode } from "@/core/api/errors";

/** Known error codes for chat operations. */
export type ChatErrorCode =
  | "CONVERSATION_NOT_FOUND"
  | "MESSAGE_NOT_FOUND"
  | "MESSAGE_NOT_IN_CONVERSATION"
  | "OPENROUTER_ERROR"
  | "STREAM_ERROR";

/**
 * Base error for chat-related errors.
 */
export class ChatError extends Error {
  readonly code: ChatErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: ChatErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ConversationNotFoundError extends ChatError {
  constructor(id: string) {
    super(`Conversation not found: ${id}`, "CONVERSATION_NOT_FOUND", 404);
  }
}

export class MessageNotFoundError extends ChatError {
  constructor(id: string) {
    super(`Message not found: ${id}`, "MESSAGE_NOT_FOUND", 404);
  }
}

export class MessageNotInConversationError extends ChatError {
  constructor(messageId: string, conversationId: string) {
    super(
      `Message ${messageId} does not belong to conversation ${conversationId}`,
      "MESSAGE_NOT_IN_CONVERSATION",
      400,
    );
  }
}

export class OpenRouterError extends ChatError {
  constructor(message: string) {
    super(message, "OPENROUTER_ERROR", 502);
  }
}

export class StreamError extends ChatError {
  constructor(message: string) {
    super(message, "STREAM_ERROR", 500);
  }
}
