import { redirect } from "next/navigation";

export default function AdminIaRedirectPage() {
  redirect("/admin?section=ai-providers");
}