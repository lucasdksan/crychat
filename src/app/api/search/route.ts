import { handleSearchPost } from "@/backend/controllers/experience.controller";

export async function POST(request: Request) {
  return handleSearchPost(request);
}