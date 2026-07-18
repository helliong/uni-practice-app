import assert from "node:assert/strict";
import test from "node:test";
import {
  formatProductImageSize,
  isAllowedProductImageType,
  isProductImageRatioAllowed,
} from "./imageUploadRules";

test("product image MIME types allow JPG, PNG and WEBP only", () => {
  assert.equal(isAllowedProductImageType("image/jpeg"), true);
  assert.equal(isAllowedProductImageType("image/png"), true);
  assert.equal(isAllowedProductImageType("image/webp"), true);
  assert.equal(isAllowedProductImageType("image/svg+xml"), false);
});

test("product image ratio accepts square and near-square images", () => {
  assert.equal(isProductImageRatioAllowed(1000, 1000), true);
  assert.equal(isProductImageRatioAllowed(950, 1000), true);
  assert.equal(isProductImageRatioAllowed(1050, 1000), true);
  assert.equal(isProductImageRatioAllowed(1200, 1000), false);
  assert.equal(isProductImageRatioAllowed(800, 1000), false);
});

test("product image size formatter converts bytes to rounded megabytes", () => {
  assert.equal(formatProductImageSize(), "5 МБ");
  assert.equal(formatProductImageSize(1.6 * 1024 * 1024), "2 МБ");
});
