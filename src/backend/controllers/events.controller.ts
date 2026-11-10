import { z } from "zod";

import { recordProductClick } from "@/backend/models/search-event.model";
import { recordAnalyticsEvent } from "@/backend/models/analytics.model";

const eventSchema = z.object({
  storeId: z.string(),
  sessionId: z.string().optional(),
  productId: z.string(),
  type: z.enum(["product_click", "product_view", "add_to_cart"]).default(
    "product_click",
  ),
});

export async function handleEventsPost(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Entrada inválida." }, { status: 400 });
  }

  if (parsed.data.type === "product_click") {
    await recordProductClick({
      storeId: parsed.data.storeId,
      sessionId: parsed.data.sessionId,
      productId: parsed.data.productId,
    });
  }

  await recordAnalyticsEvent({
    storeId: parsed.data.storeId,
    type:
      parsed.data.type === "add_to_cart"
        ? "add_to_cart"
        : parsed.data.type === "product_view"
          ? "product_view"
          : "custom",
    payload: {
      sessionId: parsed.data.sessionId,
      productId: parsed.data.productId,
      type: parsed.data.type,
    },
  });

  return Response.json({ ok: true });
}
