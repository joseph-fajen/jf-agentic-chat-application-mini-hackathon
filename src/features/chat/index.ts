// Types

// Constants
export { MAX_CONTEXT_MESSAGES, SYSTEM_PROMPT } from "./constants";
// Errors
export type { ChatErrorCode } from "./errors";
export {
  ChatError,
  ConversationNotFoundError,
  MessageNotFoundError,
  MessageNotInConversationError,
  OpenRouterError,
  StreamError,
} from "./errors";
export type { Conversation, Message, NewConversation, NewMessage } from "./models";
export type {
  CreateConversationInput,
  ForkConversationInput,
  SendMessageInput,
  UpdateConversationInput,
} from "./schemas";
// Schemas (for validation)
export {
  CreateConversationSchema,
  ForkConversationSchema,
  SendMessageSchema,
  UpdateConversationSchema,
} from "./schemas";

// Service functions (public API)
export {
  addMessage,
  createConversation,
  deleteConversation,
  forkConversation,
  generateTitleFromMessage,
  getConversation,
  getMessages,
  updateConversation,
} from "./service";

// Stream functions
export { buildMessages, streamChatCompletion } from "./stream";
