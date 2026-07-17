export const PRODUCT_IMAGE_MAX_FILES = 8;
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MIN_WIDTH = 1000;
export const PRODUCT_IMAGE_MIN_HEIGHT = 1000;
export const PRODUCT_IMAGE_MIN_RATIO = 0.95;
export const PRODUCT_IMAGE_MAX_RATIO = 1.05;

export const PRODUCT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PRODUCT_IMAGE_ACCEPT = PRODUCT_IMAGE_ALLOWED_TYPES.join(",");
export const PRODUCT_IMAGE_RULES_TEXT =
  "JPG, PNG или WEBP до 5 МБ. Фото товара должно быть квадратным, минимум 1000x1000 px.";

export function isAllowedProductImageType(type: string) {
  return PRODUCT_IMAGE_ALLOWED_TYPES.includes(
    type as (typeof PRODUCT_IMAGE_ALLOWED_TYPES)[number],
  );
}

export function isProductImageRatioAllowed(width: number, height: number) {
  const ratio = width / height;

  return ratio >= PRODUCT_IMAGE_MIN_RATIO && ratio <= PRODUCT_IMAGE_MAX_RATIO;
}

export function formatProductImageSize(bytes = PRODUCT_IMAGE_MAX_SIZE_BYTES) {
  return `${Math.round(bytes / 1024 / 1024)} МБ`;
}
