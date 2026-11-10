import { auth } from "@/backend/auth";
import { findUserById } from "@/backend/models/user.model";
import { ChatTemplate } from "@/frontend/components/templates/chat-template";

export default async function ChatPage() {
  const session = await auth();
  const user = session?.user?.id ? await findUserById(session.user.id) : null;
  const storeId = user?.activeStoreId ?? user?.stores[0]?.id ?? undefined;

  return <ChatTemplate storeId={storeId} />;
}
