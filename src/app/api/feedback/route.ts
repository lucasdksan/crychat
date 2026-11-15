import { handleFeedbackPost } from "@/backend/controllers/experience.controller";

export async function POST(request: Request) {
  return handleFeedbackPost(request);
}