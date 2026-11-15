"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/backend/auth";
import { sanitizeRedirectPath } from "@/backend/lib/auth/redirect";

export async function signInWithGoogle(formData: FormData) {
  const rawTo = formData.get("to");
  const to = sanitizeRedirectPath(
    typeof rawTo === "string" ? rawTo : null,
  );
  try {
    await signIn("google", { redirectTo: to });
  } catch (error) {
    if (error instanceof AuthError) {
      return;
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/entrar" });
}
