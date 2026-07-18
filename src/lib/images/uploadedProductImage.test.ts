import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { getUploadedProductImage } from "./uploadedProductImage";

test("uploaded product image resolves supported image files", () => {
  assert.deepEqual(getUploadedProductImage("product.PNG", "/uploads"), {
    contentType: "image/png",
    path: join("/uploads", "product.PNG"),
  });
});

test("uploaded product image rejects unsupported and unsafe file names", () => {
  assert.equal(getUploadedProductImage("document.pdf", "/uploads"), null);
  assert.equal(getUploadedProductImage("../secret.png", "/uploads"), null);
});
