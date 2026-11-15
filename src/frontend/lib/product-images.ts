import type { Product } from "@/experience/commerce-types";

export function productImageSrc(product: Pick<Product, "imageKey" | "imageUrl">) {
  if (product.imageUrl) {
    return product.imageUrl;
  }
  return PRODUCT_IMAGES[product.imageKey] ?? "";
}

export const PRODUCT_IMAGES: Record<string, string> = {
  laptop_dev_pro: "/assets/demo/laptop_dev_pro_1794697189716.jpg",
  laptop_ultrabook_silver: "/assets/demo/laptop_ultrabook_silver_1794697216771.jpg",
  smartphone_camera_pro: "/assets/demo/smartphone_camera_pro_1794697191080.jpg",
  smartphone_compact_oled: "/assets/demo/smartphone_compact_oled_1794697190834.jpg",
  headphones_studio_anc: "/assets/demo/headphones_studio_anc_1794697190895.jpg",
  monitor_desk_4k: "/assets/demo/monitor_desk_4k_1794697192212.jpg",
};