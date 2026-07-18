import sharp from "sharp";

export const PRODUCT_IMAGE_WEBP_QUALITY = 80;
export const PRODUCT_IMAGE_MAX_DIMENSION = 2000;

export async function optimizeProductImage(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: PRODUCT_IMAGE_MAX_DIMENSION,
      height: PRODUCT_IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: PRODUCT_IMAGE_WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();
}
