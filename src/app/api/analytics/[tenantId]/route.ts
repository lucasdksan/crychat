import { handleAnalyticsGet } from "@/backend/controllers/experience.controller";

type Params = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { tenantId } = await params;
  return handleAnalyticsGet(tenantId);
}