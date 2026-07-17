import { Product, ProductVariant } from "@/types";

export const variantKey = (color?: string, size?: string) =>
  `${color || "none"}::${size || "none"}`;

export function getProductImagesForColor(product: Product, color?: string) {
  if (color && product.imagesByColor?.[color]?.length) {
    return product.imagesByColor[color];
  }

  return product.images?.length ? product.images : [product.imageUrl].filter(Boolean);
}

export function getVariantStock(
  variants: ProductVariant[] | undefined,
  color?: string,
  size?: string,
) {
  const variant = variants?.find(
    (item) => item.color === color && item.size === size,
  );

  return variant?.stock;
}

export function hasVariantStock(
  product: Product,
  color?: string,
  size?: string,
) {
  const stock = getVariantStock(product.variants, color, size);

  return stock === undefined ? product.inStock !== false : stock > 0;
}

export function getAvailableSizesForColor(product: Product, color?: string) {
  if (!product.availableSizes?.length || !product.variants?.length) {
    return product.availableSizes || [];
  }

  return product.availableSizes.filter((size) =>
    hasVariantStock(product, color, size),
  );
}
