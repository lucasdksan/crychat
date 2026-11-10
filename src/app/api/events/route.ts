import { handleEventsPost } from "@/backend/controllers/events.controller";

export async function POST(request: Request) {
  return handleEventsPost(request);
}
