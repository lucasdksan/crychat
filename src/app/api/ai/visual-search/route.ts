import { handleVisualSearchPost } from "@/backend/controllers/experience.controller";

export async function POST(request: Request) {
  return handleVisualSearchPost(request);
}