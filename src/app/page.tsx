import { redirect } from "next/navigation";

import { auth } from "@/backend/auth";
import { DEFAULT_AUTHENTICATED_PATH } from "@/backend/lib/auth/redirect";

export default async function HomePage() {
  const session = await auth();
  redirect(session ? DEFAULT_AUTHENTICATED_PATH : "/entrar");
}
