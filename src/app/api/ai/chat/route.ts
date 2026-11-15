import { handleExperienceChatPost } from "@/backend/controllers/experience.controller";

export async function POST(request: Request) {
  return handleExperienceChatPost(request);
}