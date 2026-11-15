import { handleIntegrationSyncPost } from "@/backend/controllers/experience.controller";

type Params = { params: Promise<{ id: string; provider: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, provider } = await params;
  return handleIntegrationSyncPost(id, provider, request);
}