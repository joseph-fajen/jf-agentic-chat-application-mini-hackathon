import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { ForkConversationSchema, forkConversation } from "@/features/chat";

const logger = getLogger("api.chat.conversations.fork");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chat/conversations/[id]/fork
 * Fork a conversation at a specific message, creating a new branch.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { messageId } = ForkConversationSchema.parse(body);

    logger.info({ conversationId: id, messageId }, "fork.request_started");

    const newConversation = await forkConversation(id, messageId);

    logger.info(
      { conversationId: id, newConversationId: newConversation.id },
      "fork.request_completed",
    );

    return NextResponse.json({ conversation: newConversation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
