import {
  handleCreateDemoTenantPost,
  handleTenantsGet,
} from "@/backend/controllers/experience.controller";

export async function GET() {
  return handleTenantsGet();
}

export async function POST(request: Request) {
  return handleCreateDemoTenantPost(request);
}