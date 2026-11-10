import { auth } from "@/backend/auth";
import { getStoreMetricsSummary } from "@/backend/models/analytics.model";
import { findUserById } from "@/backend/models/user.model";
import { findStoreForOwner } from "@/backend/models/store.model";

export async function loadAdminDashboardMetrics(storeId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await findUserById(session.user.id);
  if (!user) {
    return null;
  }

  const resolvedStoreId =
    storeId ?? user.activeStoreId ?? user.stores[0]?.id ?? null;
  if (!resolvedStoreId) {
    return { store: null, metrics: null };
  }

  const store = await findStoreForOwner(resolvedStoreId, user.id);
  if (!store) {
    return { store: null, metrics: null };
  }

  const metrics = await getStoreMetricsSummary(store.id);
  return { store, metrics };
}
