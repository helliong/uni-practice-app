import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  optimizeProductImage,
  PRODUCT_IMAGE_MAX_DIMENSION,
} from "./productImageOptimization";

test("product image optimization converts images to bounded WebP", async () => {
  const source = await sharp({
    create: {
      width: 2400,
      height: 2400,
      channels: 3,
      background: "#ffffff",
    },
  })
    .png()
    .toBuffer();

  const optimized = await optimizeProductImage(source);
  const metadata = await sharp(optimized).metadata();

  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, PRODUCT_IMAGE_MAX_DIMENSION);
  assert.equal(metadata.height, PRODUCT_IMAGE_MAX_DIMENSION);
});
