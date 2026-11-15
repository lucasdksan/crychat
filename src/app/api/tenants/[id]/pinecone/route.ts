import { handleTenantPineconePost } from "@/backend/controllers/experience.controller";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return handleTenantPineconePost(id, request);
}