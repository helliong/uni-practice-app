export type ProductVariantPayload = {
  color?: string;
  size?: string;
  stock?: number | string;
  sku?: string;
};

type ComparableProduct = {
  name: string;
  price: number;
  stockCount: number;
  category: string;
  isPublished: boolean;
  universityId: string | null;
};

export function normalizeProductVariants(variants: ProductVariantPayload[] | undefined) {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant) => ({
      color: variant.color || undefined,
      size: variant.size || undefined,
      stock: Math.max(0, Number(variant.stock) || 0),
      sku: variant.sku || undefined,
    }))
    .filter((variant) => variant.color || variant.size);
}

export function getProductTotalStock(
  variants: ReturnType<typeof normalizeProductVariants>,
  fallback: unknown,
) {
  if (variants.length > 0) {
    return variants.reduce((total, variant) => total + variant.stock, 0);
  }

  return Math.max(0, Number(fallback) || 0);
}

export function normalizeProductSku(sku: string) {
  return sku.trim().replace(/\s+/g, "-");
}

export function getChangedProductFields(
  previous: ComparableProduct,
  next: ComparableProduct,
) {
  return [
    previous.name !== next.name ? "название" : null,
    previous.price !== next.price ? "цена" : null,
    previous.stockCount !== next.stockCount ? "остаток" : null,
    previous.category !== next.category ? "категория" : null,
    previous.isPublished !== next.isPublished ? "публикация" : null,
    previous.universityId !== next.universityId ? "университет" : null,
  ].filter((field): field is string => Boolean(field));
}
