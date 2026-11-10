import { redirect } from "next/navigation";

import { auth } from "@/backend/auth";

export default async function HomePage() {
  const session = await auth();
  redirect(session ? "/chat" : "/entrar");
}
