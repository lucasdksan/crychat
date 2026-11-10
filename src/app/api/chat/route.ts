import { handleChatPost } from "@/backend/controllers/chat.controller";

export async function POST(request: Request) {
  return handleChatPost(request);
}
